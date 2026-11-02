import { genericOAuth, type GenericOAuthOptions } from "better-auth/plugins/generic-oauth";
import { GROK_PROVIDERS } from "./providers.ts";

/** Better Auth 1.7 uses social sign-in internally. Keep the callback paths
 * already registered with the broker, including request-specific preview hosts.
 * callbackPath is composed with Better Auth's validated baseURL for BOTH the
 * authorization request and the token exchange; never derive an origin here. */
export function brokerOAuth<const ID extends string>(options: GenericOAuthOptions<ID>) {
  const plugin = genericOAuth(options);
  const providerIds = new Set(options.config.map(({ providerId }) => providerId));
  return {
    ...plugin,
    async init(context: Parameters<typeof plugin.init>[0]) {
      const result = await plugin.init(context);
      return {
        ...result,
        context: {
          ...result.context,
          socialProviders: result.context.socialProviders.map((provider) =>
            providerIds.has(provider.id as ID)
              ? { ...provider, callbackPath: `/oauth2/callback/${provider.id}` }
              : provider,
          ),
        },
      };
    },
  };
}

/** Dispatch only our registered legacy callback URLs to Better Auth 1.7's
 * core callback endpoint. This is an internal rewrite, preserving the original
 * origin, state, method, body and cookies; no redirect or trust rule is added. */
export function brokerCallbackRequest(request: Request): Request {
  const url = new URL(request.url);
  const provider = GROK_PROVIDERS.find(
    ({ providerId }) => url.pathname === `/api/auth/oauth2/callback/${providerId}`,
  );
  if (!provider) return request;
  url.pathname = `/api/auth/callback/${provider.providerId}`;
  return new Request(url, request);
}
