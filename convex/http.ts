import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { Webhook } from "svix";

// ─────────────────────────────────────────────────────────────────────────────
// Single Clerk webhook endpoint (Reconciled-Conflict #8).
//
//   POST  https://<convex-deployment>.convex.site/clerk-webhook
//
// svix-verifies the RAW body against CLERK_WEBHOOK_SIGNING_SECRET, then
// dispatches the parsed event to idempotent internal upserts. Handles:
//   - organization.created / updated / deleted          → workspaces
//   - organizationMembership.created / updated / deleted → workspaceMembers
//   - subscription.* / subscriptionItem.* (camelCase)    → subscriptions
// Unhandled event types are logged and 200'd (so Clerk doesn't retry forever).
//
// `svix`'s `Webhook` class verifies using pure-JS sha256 (via standardwebhooks),
// so this runs in Convex's default V8 runtime — no `"use node"` needed.
//
// TODO(human): in the Clerk Dashboard, register this endpoint URL
//   (https://energized-dove-25.convex.site/clerk-webhook for dev) and subscribe
//   it to organization.*, organizationMembership.*, organizationInvitation.*,
//   subscription.* AND subscriptionItem.*. Then set the signing secret on the
//   Convex deployment:
//     npx convex env set CLERK_WEBHOOK_SIGNING_SECRET whsec_xxx
//   (CLERK_WEBHOOK_SIGNING_SECRET is currently UNSET on dev — until it is set,
//   this endpoint returns 500 by design rather than trusting unverified bodies.)
// ─────────────────────────────────────────────────────────────────────────────

const http = httpRouter();

// Map Clerk's role string → our coarse app role. Clerk's admin role is
// "org:admin"; everything else (incl. "org:support", custom roles) → support.
function mapRole(rawRole: string | null | undefined): "admin" | "support" {
  return rawRole === "org:admin" ? "admin" : "support";
}

// Clerk timestamps are epoch SECONDS on most billing payloads; normalize to ms.
function toMs(value: unknown): number | undefined {
  if (typeof value !== "number") return undefined;
  // Heuristic: < 1e12 ⇒ seconds, else already ms.
  return value < 1e12 ? value * 1000 : value;
}

function pick<T = unknown>(obj: unknown, ...keys: string[]): T | undefined {
  let cur: unknown = obj;
  for (const k of keys) {
    if (
      cur &&
      typeof cur === "object" &&
      k in (cur as Record<string, unknown>)
    ) {
      cur = (cur as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return cur as T;
}

const clerkWebhook = httpAction(async (ctx, request) => {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!signingSecret) {
    console.error(
      "[clerk-webhook] CLERK_WEBHOOK_SIGNING_SECRET is not set; refusing to process unverified webhook. Set it via `npx convex env set`.",
    );
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const payload = await request.text();
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  let event: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(signingSecret);
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: Record<string, unknown> };
  } catch (err) {
    console.error("[clerk-webhook] signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const { type, data } = event;

  try {
    switch (type) {
      // ── ORGANIZATIONS ──────────────────────────────────────────────────
      case "organization.created":
      case "organization.updated": {
        const clerkOrgId = pick<string>(data, "id");
        const name = pick<string>(data, "name") ?? "Workspace";
        const slug = pick<string>(data, "slug");
        const createdByClerkUserId = pick<string>(data, "created_by");
        if (clerkOrgId) {
          await ctx.runMutation(internal.clerkWebhooks.upsertOrganization, {
            clerkOrgId,
            name,
            slug,
            createdByClerkUserId,
          });
        }
        break;
      }
      case "organization.deleted": {
        const clerkOrgId = pick<string>(data, "id");
        if (clerkOrgId) {
          await ctx.runMutation(internal.clerkWebhooks.deleteOrganization, {
            clerkOrgId,
          });
        }
        break;
      }

      // ── MEMBERSHIPS ────────────────────────────────────────────────────
      case "organizationMembership.created":
      case "organizationMembership.updated": {
        const clerkOrgId = pick<string>(data, "organization", "id");
        const clerkUserId = pick<string>(data, "public_user_data", "user_id");
        const rawRole = pick<string>(data, "role");
        const firstName =
          pick<string>(data, "public_user_data", "first_name") ?? "";
        const lastName =
          pick<string>(data, "public_user_data", "last_name") ?? "";
        const identifier =
          pick<string>(data, "public_user_data", "identifier") ?? undefined;
        const imageUrl =
          pick<string>(data, "public_user_data", "image_url") ?? undefined;
        const name =
          `${firstName} ${lastName}`.trim() || identifier || "Member";
        if (clerkOrgId && clerkUserId) {
          await ctx.runMutation(internal.clerkWebhooks.upsertMembership, {
            clerkOrgId,
            clerkUserId,
            role: mapRole(rawRole),
            name,
            email: identifier,
            imageUrl,
            orgName: pick<string>(data, "organization", "name"),
            orgSlug: pick<string>(data, "organization", "slug"),
          });
        }
        break;
      }
      case "organizationMembership.deleted": {
        const clerkOrgId = pick<string>(data, "organization", "id");
        const clerkUserId = pick<string>(data, "public_user_data", "user_id");
        if (clerkOrgId && clerkUserId) {
          await ctx.runMutation(internal.clerkWebhooks.removeMembership, {
            clerkOrgId,
            clerkUserId,
          });
        }
        break;
      }

      // ── BILLING ────────────────────────────────────────────────────────
      // subscription.* and subscriptionItem.* (camelCase). subscriptionItem.* is
      // the authoritative plan+status signal. Payload paths here follow the
      // DOCUMENTED Clerk shape; Phase 2 finalizes them from a logged real event.
      default: {
        if (type.startsWith("subscription")) {
          // Log the raw payload ONCE per deploy to map the empirical path
          // (Phase 0 acceptance: "log one real billing payload").
          console.log(
            `[clerk-webhook] billing event ${type}:`,
            JSON.stringify(data),
          );

          const isItem = type.startsWith("subscriptionItem.");
          const clerkOrgId =
            pick<string>(data, "payer", "organization_id") ??
            pick<string>(data, "organization", "id") ??
            pick<string>(data, "payer", "id");

          // Deletion-ish lifecycle → downgrade in place.
          if (
            type === "subscription.deleted" ||
            type === "subscriptionItem.deleted"
          ) {
            await ctx.runMutation(internal.clerkWebhooks.deleteSubscription, {
              subscriptionId:
                pick<string>(data, "subscription_id") ??
                pick<string>(data, "id"),
              subscriptionItemId: isItem ? pick<string>(data, "id") : undefined,
              clerkOrgId,
            });
            break;
          }

          if (!clerkOrgId) {
            console.warn(
              `[clerk-webhook] ${type}: could not resolve clerkOrgId from payload; skipping.`,
            );
            break;
          }

          const planSlug =
            pick<string>(data, "plan", "slug") ??
            pick<string>(data, "items", "0", "plan", "slug") ??
            "free_org";
          // Status comes ONLY from the payload (top-level or first item). Do NOT
          // derive it from the event-type verb ("updated"/"created") — that maps
          // to "incomplete" and would disable AI for an active payer. When absent,
          // upsertSubscription preserves the existing row's status.
          const status =
            pick<string>(data, "status") ??
            pick<string>(data, "items", "0", "status");
          const subscriptionId =
            (isItem
              ? pick<string>(data, "subscription_id")
              : pick<string>(data, "id")) ??
            pick<string>(data, "id") ??
            clerkOrgId;
          const subscriptionItemId = isItem
            ? pick<string>(data, "id")
            : pick<string>(data, "items", "0", "id");

          await ctx.runMutation(internal.clerkWebhooks.upsertSubscription, {
            clerkOrgId,
            subscriptionId,
            subscriptionItemId,
            planSlug,
            status,
            seats: pick<number>(data, "quantity"),
            currentPeriodStart: toMs(
              pick(data, "current_period_start") ?? pick(data, "period_start"),
            ),
            currentPeriodEnd: toMs(
              pick(data, "current_period_end") ?? pick(data, "period_end"),
            ),
          });
        } else {
          console.log(`[clerk-webhook] unhandled event type: ${type}`);
        }
      }
    }
  } catch (err) {
    // Log + 200: Clerk retries on non-2xx; if our mutation is the problem,
    // retrying the same malformed event forever doesn't help. We've logged it.
    console.error(`[clerk-webhook] error handling ${type}:`, err);
    return new Response("Handled with error (logged)", { status: 200 });
  }

  return new Response(null, { status: 200 });
});

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: clerkWebhook,
});
