import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createHash, generateKeyPairSync, randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { registerHooks } from "node:module";
import ts from "typescript";
import { PGlite } from "@electric-sql/pglite";
import { betterAuth } from "better-auth";
import { exportJWK, SignJWT } from "jose";
import { brokerCallbackRequest, brokerOAuth } from "./broker-oauth.ts";

const APP = "https://fixture.grok-sandbox.com";
const SECRET = "isolated-auth-upgrade-fixture-secret-at-least-32-characters";
const DB_KEY = Symbol.for("sparksuite.auth-upgrade-fixture-db");

class CookieJar {
  values = new Map<string, string>();
  apply(response: Response) {
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";", 1)[0];
      const separator = pair.indexOf("=");
      const name = pair.slice(0, separator);
      if (/max-age=0(?:;|$)/i.test(cookie)) this.values.delete(name);
      else this.values.set(name, pair.slice(separator + 1));
    }
  }
  headers(origin = APP) {
    return new Headers({
      host: new URL(origin).host,
      origin,
      cookie: [...this.values].map(([name, value]) => `${name}=${value}`).join("; "),
    });
  }
}

it("aliases only the registered broker callbacks without changing request data", async () => {
  const url = `${APP}/api/auth/oauth2/callback/grok-google?state=a%2Bb&code=one`;
  const original = new Request(url, { headers: { cookie: "state=signed" } });
  const aliased = brokerCallbackRequest(original);
  assert.equal(aliased.url, `${APP}/api/auth/callback/grok-google?state=a%2Bb&code=one`);
  assert.equal(aliased.headers.get("cookie"), "state=signed");
  const post = brokerCallbackRequest(new Request(`${APP}/api/auth/oauth2/callback/grok-x`, {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "state=posted&code=two",
  }));
  assert.equal(post.method, "POST");
  assert.equal(await post.text(), "state=posted&code=two");
  for (const path of ["/api/auth/oauth2/callback/other", "/api/auth/oauth2/callback/grok-google/extra", "/api/auth/get-session"]) {
    const request = new Request(`${APP}${path}`);
    assert.equal(brokerCallbackRequest(request), request);
  }
});

describe("Better Auth upgrade with the existing app configuration and 1.6 SQL schema", { concurrency: false }, () => {
  let auth: typeof import("./server.ts").auth;
  let db: PGlite;
  let broker: Server;
  let issuer: string;
  let resolver: ReturnType<typeof registerHooks>;
  let gateKey: ReturnType<typeof generateKeyPairSync>;
  let jwk: Awaited<ReturnType<typeof exportJWK>>;
  const nativeFetch = globalThis.fetch;
  const savedEnv = new Map<string, string | undefined>();
  const codes = new Map<string, { sub: string; email: string; redirect: string; challenge: string }>();
  const accessTokens = new Map<string, { sub: string; email: string }>();
  const exchanges: URLSearchParams[] = [];
  const unexpectedFetches: string[] = [];

  before(async () => {
    db = new PGlite();
    await db.exec(readFileSync(new URL("../../../migrations/auth/0001_auth.sql", import.meta.url), "utf8"));
    (globalThis as Record<symbol, unknown>)[DB_KEY] = db;
    gateKey = generateKeyPairSync("ed25519");
    jwk = { ...(await exportJWK(gateKey.publicKey)), kid: "fixture-gate", alg: "EdDSA", use: "sig" };
    broker = createServer(async (request, response) => {
      try {
        const path = new URL(request.url ?? "/", issuer).pathname;
        if (path === "/__gate/identity-key") {
          response.setHeader("content-type", "application/json");
          response.end(JSON.stringify({ keys: [jwk] }));
          return;
        }
        if (path === "/api/auth/oauth2/token") {
          let body = "";
          for await (const chunk of request) body += chunk;
          const params = new URLSearchParams(body);
          exchanges.push(params);
          const code = params.get("code") ?? "";
          const entry = codes.get(code);
          assert.ok(entry, "Only a fixture-issued authorization code is accepted");
          assert.equal(params.get("redirect_uri"), entry.redirect, "Token exchange retains the registered legacy URI");
          assert.equal(params.get("grant_type"), "authorization_code");
          assert.equal(createHash("sha256").update(params.get("code_verifier") ?? "").digest("base64url"), entry.challenge);
          codes.delete(code);
          const accessToken = `fixture-access-${code}`;
          accessTokens.set(accessToken, entry);
          response.setHeader("content-type", "application/json");
          // Exercise OIDC userinfo's immutable sub even when no id_token is returned.
          response.end(JSON.stringify({ access_token: accessToken, token_type: "Bearer", expires_in: 3600, scope: "openid profile email" }));
          return;
        }
        if (path === "/api/auth/oauth2/userinfo") {
          const entry = accessTokens.get((request.headers.authorization ?? "").replace(/^Bearer /, ""));
          assert.ok(entry);
          response.setHeader("content-type", "application/json");
          response.end(JSON.stringify({ sub: entry.sub, email: entry.email, email_verified: true, name: "Fixture learner" }));
          return;
        }
        response.statusCode = 404;
        response.end();
      } catch (error) {
        response.statusCode = 400;
        response.end(String(error));
      }
    });
    await new Promise<void>((resolve) => broker.listen(0, "127.0.0.1", resolve));
    const address = broker.address();
    assert.ok(address && typeof address !== "string");
    issuer = `http://127.0.0.1:${address.port}`;
    globalThis.fetch = ((input, init) => {
      const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
      if (url.origin !== issuer) {
        unexpectedFetches.push(url.href);
        throw new Error(`External network disabled in auth fixture: ${url.origin}`);
      }
      return nativeFetch(input, init);
    }) as typeof fetch;
    const environment = {
      DATABASE_URL: "", VITE_AUTH_ENABLED: "true", BETTER_AUTH_URL: APP,
      BETTER_AUTH_SECRET: SECRET, BETTER_AUTH_TELEMETRY: "false",
      GROK_AUTH_ISSUER: issuer, GROK_AUTH_CLIENT_ID: "fixture-client", GROK_AUTH_CLIENT_SECRET: "fixture-secret",
      GROK_PROJECT_ID: "fixture-project", GROK_GATE_ORIGIN: issuer,
    };
    for (const [name, value] of Object.entries(environment)) {
      savedEnv.set(name, process.env[name]);
      process.env[name] = value;
    }
    const dbUrl = new URL("../db.ts", import.meta.url).href;
    // The app's DB bootstrap uses Vite import.meta.glob. Replace only that
    // bootstrap in this process with the isolated, already-migrated real DB;
    // load the actual auth config, broker providers and gate hooks unchanged.
    resolver = registerHooks({
      resolve(specifier, context, next) {
        if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
          const candidate = new URL(`${specifier}.ts`, context.parentURL);
          if (existsSync(candidate)) return next(candidate.href, context);
        }
        return next(specifier, context);
      },
      load(url, context, next) {
        if (url === dbUrl) return {
          format: "module", shortCircuit: true,
          source: `export async function ensureDbReady() {}\nexport function getPglite() { return globalThis[Symbol.for("sparksuite.auth-upgrade-fixture-db")]; }`,
        };
        if (url.startsWith(new URL("../../../", import.meta.url).href) && url.endsWith(".ts")) {
          const source = readFileSync(new URL(url), "utf8");
          return {
            format: "module", shortCircuit: true,
            source: ts.transpileModule(source, {
              compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
            }).outputText,
          };
        }
        return next(url, context);
      },
    });
    ({ auth } = await import("./server.ts"));
    await auth.$context;
  });

  after(async () => {
    resolver?.deregister();
    globalThis.fetch = nativeFetch;
    for (const [name, value] of savedEnv) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    delete (globalThis as Record<symbol, unknown>)[DB_KEY];
    if (broker) await new Promise<void>((resolve, reject) => broker.close((error) => error ? reject(error) : resolve()));
    await db?.close();
    assert.deepEqual(unexpectedFetches, [], "No real broker, OAuth provider, or telemetry request was made");
  });

  async function begin(provider = "grok-google", sub = "broker-returning", email = "returning@example.test", origin = APP, instance = auth) {
    const jar = new CookieJar();
    const headers = jar.headers(origin);
    headers.set("content-type", "application/json");
    const response = await instance.handler(new Request(`${origin}/api/auth/sign-in/social`, {
      method: "POST", headers,
      body: JSON.stringify({ provider, callbackURL: `${origin}/done`, errorCallbackURL: `${origin}/failed` }),
    }));
    assert.equal(response.status, 200, await response.clone().text());
    jar.apply(response);
    const authorization = new URL((await response.json()).url);
    assert.equal(authorization.origin, issuer);
    assert.equal(authorization.searchParams.get("redirect_uri"), `${origin}/api/auth/oauth2/callback/${provider}`);
    assert.equal(authorization.searchParams.get("code_challenge_method"), "S256");
    assert.equal(authorization.searchParams.get("idp"), provider === "grok-x" ? "twitter" : "google");
    assert.equal(authorization.searchParams.get("prompt"), "login");
    const code = randomUUID();
    codes.set(code, {
      sub, email, redirect: authorization.searchParams.get("redirect_uri")!, challenge: authorization.searchParams.get("code_challenge")!,
    });
    const callback = new URL(authorization.searchParams.get("redirect_uri")!);
    callback.searchParams.set("state", authorization.searchParams.get("state")!);
    callback.searchParams.set("code", code);
    return { jar, callback, authorization };
  }

  const complete = (flow: Awaited<ReturnType<typeof begin>>, instance = auth) =>
    instance.handler(brokerCallbackRequest(new Request(flow.callback, { headers: flow.jar.headers(flow.callback.origin) })));

  it("keeps returning broker users on their existing account rows and secures session cookies", async () => {
    await db.query('insert into "user" (id, name, email, "emailVerified") values ($1, $2, $3, true)', ["existing-user", "Existing", "returning@example.test"]);
    await db.query('insert into "account" (id, "accountId", "providerId", "userId", "updatedAt") values ($1, $2, $3, $4, now())', ["existing-account", "broker-returning", "grok-google", "existing-user"]);
    const columns = await db.query<{ column_name: string }>("select column_name from information_schema.columns where table_name = 'account'");
    assert.equal(columns.rows.some(({ column_name }) => column_name === "issuer"), false);
    const flow = await begin();
    const response = await complete(flow);
    assert.equal(response.headers.get("location"), `${APP}/done`, await response.clone().text());
    const tokenCookie = response.headers.getSetCookie().find((cookie) => cookie.startsWith("__Host-grok-auth.session_token="));
    assert.ok(tokenCookie);
    for (const attribute of [/; Path=\//i, /; Secure/i, /; HttpOnly/i, /; SameSite=Lax/i]) assert.match(tokenCookie, attribute);
    assert.doesNotMatch(tokenCookie, /; Domain=/i);
    flow.jar.apply(response);
    const session = await auth.handler(new Request(`${APP}/api/auth/get-session`, { headers: flow.jar.headers() }));
    const body = await session.json();
    assert.equal(body.user.id, "existing-user");
    const accounts = await db.query<{ id: string; accountId: string }>('select id, "accountId" from "account" where "userId" = $1', ["existing-user"]);
    assert.deepEqual(accounts.rows, [{ id: "existing-account", accountId: "broker-returning" }]);
    const bearer = await auth.handler(new Request(`${APP}/api/auth/get-session`, { headers: { authorization: `Bearer ${body.session.token}` } }));
    assert.equal((await bearer.json()).user.id, "existing-user");
    const signedOut = await auth.handler(new Request(`${APP}/api/auth/sign-out`, { method: "POST", headers: flow.jar.headers() }));
    assert.equal(signedOut.status, 200);
    flow.jar.apply(signedOut);
    const anonymous = await auth.handler(new Request(`${APP}/api/auth/get-session`, { headers: flow.jar.headers() }));
    assert.equal(await anonymous.json(), null);
    const oldBearer = await auth.handler(new Request(`${APP}/api/auth/get-session`, { headers: { authorization: `Bearer ${body.session.token}` } }));
    assert.equal(await oldBearer.json(), null);
  });

  it("consumes an OAuth state once through the real Kysely adapter and rejects replay", async () => {
    const flow = await begin("grok-x", "x-subject", "x@example.test");
    const before = exchanges.length;
    const reply = await complete(flow);
    assert.equal(reply.headers.get("location"), `${APP}/done`);
    assert.equal(exchanges.length - before, 1);
    const replay = await complete(flow);
    assert.notEqual(replay.headers.get("location"), `${APP}/done`);
    const accounts = await db.query<{ providerId: string; accountId: string }>('select "providerId", "accountId" from "account" where "accountId" = $1', ["x-subject"]);
    assert.deepEqual(accounts.rows, [{ providerId: "grok-x", accountId: "x-subject" }]);
    const sessions = await db.query<{ count: number }>('select count(*)::int as count from "session" s join "account" a on a."userId" = s."userId" where a."accountId" = $1', ["x-subject"]);
    assert.equal(sessions.rows[0].count, 1);
  });

  it("rejects untrusted sign-in callbacks before reaching the broker", async () => {
    const response = await auth.handler(new Request(`${APP}/api/auth/sign-in/social`, {
      method: "POST", headers: { origin: APP, "content-type": "application/json" },
      body: JSON.stringify({ provider: "grok-google", callbackURL: "https://attacker.example/done" }),
    }));
    assert.equal(response.status, 403);
  });

  it("uses the validated request origin for both legacy authorization and token callbacks", async () => {
    const dynamic = betterAuth({
      secret: SECRET,
      baseURL: { allowedHosts: ["*.grok-sandbox.com"], protocol: "https" },
      trustedOrigins: ["https://*.grok-sandbox.com"],
      database: { dialect: (await import("./pglite-dialect.ts")).pgliteDialect(() => db), type: "postgres" },
      plugins: [brokerOAuth({ config: [{
        providerId: "grok-google", clientId: "fixture-client", clientSecret: "fixture-secret",
        authorizationUrl: `${issuer}/api/auth/oauth2/authorize`, tokenUrl: `${issuer}/api/auth/oauth2/token`,
        userInfoUrl: `${issuer}/api/auth/oauth2/userinfo`, scopes: ["openid", "profile", "email"],
        accountSubject: ({ profile }) => profile.id ?? profile.sub ?? "",
        authorizationUrlParams: { idp: "google", prompt: "login" },
      }] })],
    });
    for (const origin of ["https://one.grok-sandbox.com", "https://two.grok-sandbox.com"]) {
      const flow = await begin("grok-google", `dynamic-${origin}`, `dynamic-${new URL(origin).hostname}@example.test`, origin, dynamic as unknown as typeof auth);
      const reply = await complete(flow, dynamic as unknown as typeof auth);
      assert.equal(reply.headers.get("location"), `${origin}/done`);
    }
  });

  it("materializes and rotates real gate sessions without trusting a mismatched signed identity", async (t) => {
    const messages: unknown[][] = [];
    t.mock.method(console, "error", (...args: unknown[]) => messages.push(args));
    async function gateToken(sub: string, audience = "app:fixture-project") {
      return new SignJWT({ sub, email: `${sub}@example.test`, name: sub })
        .setProtectedHeader({ alg: "EdDSA", kid: "fixture-gate" }).setIssuer(issuer)
        .setAudience(audience).setIssuedAt().setExpirationTime("2m").sign(gateKey.privateKey);
    }
    const jar = new CookieJar();
    async function getGate(sub: string) {
      const headers = jar.headers();
      headers.set("x-grok-identity", await gateToken(sub));
      const response = await auth.handler(new Request(`${APP}/api/auth/get-session`, { headers }));
      jar.apply(response);
      return { response, body: await response.json() };
    }
    const first = await getGate("gate-one");
    assert.equal(first.body.user.email, "gate-one@example.test");
    assert.ok(first.response.headers.getSetCookie().some((cookie) => cookie.startsWith("__Host-grok-auth.session_token=")));
    const again = await getGate("gate-one");
    assert.equal(again.body.user.id, first.body.user.id);
    const second = await getGate("gate-two");
    assert.equal(second.body.user.email, "gate-two@example.test");
    assert.notEqual(second.body.user.id, first.body.user.id);
    const binding = await db.query<{ providerId: string; accountId: string }>('select "providerId", "accountId" from "account" where "userId" = $1', [second.body.user.id]);
    assert.deepEqual(binding.rows, [{ providerId: "grok-gate", accountId: "gate-two" }]);
    const invalid = await auth.handler(new Request(`${APP}/api/auth/get-session`, {
      headers: { "x-grok-identity": await gateToken("gate-attacker", "app:another-project") },
    }));
    assert.equal(await invalid.json(), null);
    // Direct handler tests have no TanStack request cookie store. These
    // gate-specific diagnostics are expected; the invalid identity was denied.
    assert.ok(messages.every(([message]) => typeof message === "string" && message.startsWith("[gate-identity]")), JSON.stringify(messages));
  });
});
