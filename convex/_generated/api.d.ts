/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as clerkWebhooks from "../clerkWebhooks.js";
import type * as conversations from "../conversations.js";
import type * as debug from "../debug.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_plans from "../lib/plans.js";
import type * as lib_ratelimit from "../lib/ratelimit.js";
import type * as onboarding from "../onboarding.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  clerkWebhooks: typeof clerkWebhooks;
  conversations: typeof conversations;
  debug: typeof debug;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/plans": typeof lib_plans;
  "lib/ratelimit": typeof lib_ratelimit;
  onboarding: typeof onboarding;
  workspaces: typeof workspaces;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
