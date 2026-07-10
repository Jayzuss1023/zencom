import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

// ─────────────────────────────────────────────────────────────────────────────
// Anonymous-widget abuse controls (Locked-decision #5).
//
// The widget surface is unauthenticated and `workspaceId` is public (it's the
// embed app_id). These token-bucket limits gate ROW CREATION on the public
// path; AI quota (entitlements.ts) separately gates AI *replies*. Both are
// required.
//
// Keys are composed per `(workspaceId, visitorId)` so one abusive visitor on one
// tenant can't exhaust another's budget. Call sites pass
// `key: rlKey(workspaceId, visitorId)` and `throws: true` to surface a
// RateLimitError (or read `{ ok, retryAfter }` and degrade).
//
// `@convex-dev/rate-limiter` owns its own tables (registered as
// `components.rateLimiter` in convex.config.ts) — no custom table here.
// ─────────────────────────────────────────────────────────────────────────────

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Visitor → AI/human message sends. ~10/min sustained, small burst capacity
  // to feel natural while throttling scripted floods.
  widgetMessage: {
    kind: "token bucket",
    rate: 10,
    period: MINUTE,
    capacity: 5,
  },

  // Visitor → lead capture. Tight: a visitor rarely submits more than a couple
  // of leads; this throttles a scripted flood poisoning the leads table.
  leadCapture: {
    kind: "token bucket",
    rate: 5,
    period: HOUR,
    capacity: 3,
  },

  // Visitor → conversation create (getOrCreateForVisitor). Loose; mostly a
  // backstop against churning conversation rows.
  conversationCreate: {
    kind: "token bucket",
    rate: 20,
    period: HOUR,
    capacity: 5,
  },
});

// Compose the per-(workspace, visitor) rate-limit key. workspaceId alone is too
// coarse (one tenant shares a bucket); visitorId alone is spoofable but raises
// the cost. Together they scope abuse to a single tenant+visitor pair.
export function rlKey(workspaceId: string, visitorId: string): string {
  return `${workspaceId}:${visitorId}`;
}
