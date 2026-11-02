/**
 * Dev-only `/__app-env` endpoint: the client env the running Vite server
 * resolved, as JSON.
 *
 * `scripts/check-auth-invariant.mjs` reads it to compare the live dev server's
 * `VITE_AUTH_ENABLED` against the value the next build will resolve. The
 * config is loaded even when Vite is started outside `scripts/with-app-env.mjs`
 * — the case that check exists to catch. These are the same values Vite inlines
 * into the client bundle, and `apply: "serve"` keeps the route out of deployed
 * apps.
 */
import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";

export const APP_ENV_ROUTE = "/__app-env";
export const BUILD_ENV_ROUTE = "/__app-build.json";
export function workspaceIdentity(root) {
  return createHash("sha256").update(realpathSync(root)).digest("hex");
}

export function appEnvPlugin() {
  let config;
  return {
    name: "app-builder:app-env",
    configResolved(resolved) { config = resolved; },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: BUILD_ENV_ROUTE.slice(1), source: JSON.stringify({ authEnabled: config.env.VITE_AUTH_ENABLED !== "false" }) });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathOnly = (req.url ?? "").split("?", 1)[0];
        if (pathOnly !== APP_ENV_ROUTE || (req.method ?? "GET").toUpperCase() !== "GET") {
          next();
          return;
        }
        const body = Buffer.from(JSON.stringify({ ...server.config.env, workspaceId: workspaceIdentity(server.config.root) }), "utf8");
        res.statusCode = 200;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.setHeader("cache-control", "no-cache");
        res.setHeader("content-length", String(body.byteLength));
        res.end(body);
      });
    },
  };
}
