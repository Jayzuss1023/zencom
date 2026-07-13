import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { getPlan, planFeatures, planLimits } from "./lib/plans";

// ─────────────────────────────────────────────────────────────────────────────
// Webhook sink internal mutations (Reconciled-Conflict #8).
//
// `http.ts` svix-verifies the raw body, then dispatches the parsed Clerk event
// to these idempotent upserts. Events are treated as out-of-order and
// at-least-once: membership can arrive before organization.created (→ lazily
// upsert the parent workspace), subscriptionItem.* may arrive before
// subscription.* (→ upsert by whatever key is present). All writes are
// internalMutation only — never reachable from a client.
//
// These are the Phase-0 wiring; the full empirical billing payload mapping is
// finished in Phase 2 (convex/billing.ts). Here we normalize the documented
// shapes and stay defensive about missing fields.
// ─────────────────────────────────────────────────────────────────────────────

// Lazily upsert (and return) the workspace row for a Clerk org. Used by every
// org-scoped event so an out-of-order membership/subscription event can still
// land against a workspace even if organization.created hasn't been processed.
async function ensureWorkspaceForOrg(
  ctx: MutationCtx,
  args: {
    clerkOrgId: string;
    name?: string;
    slug?: string;
    ownerClerkUserId?: string;
  },
): Promise<Id<"workspaces">> {
  const existing = await ctx.db
    .query("workspaces")
    .withIndex("by_org", (q) => q.eq("clerkOrgId", args.clerkOrgId))
    .unique();
  if (existing) return existing._id;

  return await ctx.db.insert("workspaces", {
    name: args.name ?? args.slug ?? "Workspace",
    ownerClerkUserId: args.ownerClerkUserId ?? "",
    clerkOrgId: args.clerkOrgId,
    slug: args.slug,
  });
}

// ── ORGANIZATIONS ───────────────────────────────────────────────────────────

export const upsertOrganization = internalMutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
    createdByClerkUserId: v.optional(v.string()),
  },
  returns: v.id("workspaces"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_org", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        slug: args.slug,
      });
      return existing._id;
    }

    return await ctx.db.insert("workspaces", {
      name: args.name,
      ownerClerkUserId: args.createdByClerkUserId ?? "",
      clerkOrgId: args.clerkOrgId,
      slug: args.slug,
    });
  },
});

export const deleteOrganization = internalMutation({
  args: { clerkOrgId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Soft-handle: mark members removed; keep the workspace + its conversations
    // for data retention. (Hard cascade is out of MVP scope — see retention gap.)
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_org_user", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .collect();
    for (const m of members) {
      if (m.status !== "removed") {
        await ctx.db.patch(m._id, { status: "removed" });
      }
    }
    return null;
  },
});

// ── MEMBERSHIPS ──────────────────────────────────────────────────────────────

export const upsertMembership = internalMutation({
  args: {
    clerkOrgId: v.string(),
    clerkUserId: v.string(),
    role: v.union(v.literal("admin"), v.literal("support")),
    name: v.string(),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    orgName: v.optional(v.string()),
    orgSlug: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workspaceId = await ensureWorkspaceForOrg(ctx, {
      clerkOrgId: args.clerkOrgId,
      name: args.orgName,
      slug: args.orgSlug,
      ownerClerkUserId: args.clerkUserId,
    });

    const existing = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("clerkOrgId", args.clerkOrgId).eq("clerkUserId", args.clerkUserId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        workspaceId,
        role: args.role,
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
        status: "active",
      });
      return null;
    }

    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      clerkOrgId: args.clerkOrgId,
      clerkUserId: args.clerkUserId,
      role: args.role,
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
      status: "active",
    });
    return null;
  },
});

export const removeMembership = internalMutation({
  args: { clerkOrgId: v.string(), clerkUserId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("clerkOrgId", args.clerkOrgId).eq("clerkUserId", args.clerkUserId),
      )
      .unique();
    if (existing && existing.status !== "removed") {
      await ctx.db.patch(existing._id, { status: "removed" });
    }
    return null;
  },
});

// ── BILLING (subscription.* / subscriptionItem.*) ────────────────────────────
//
// Phase-0 wiring: idempotent upsert keyed by subscription / subscriptionItem /
// org. Statuses arrive camelCase (Reconciled-Conflict #13) and are normalized
// here into our snake_case union. The full empirical payload-path mapping is
// finalized in Phase 2.

const STATUS_MAP: Record<
  string,
  "active" | "past_due" | "canceled" | "ended" | "incomplete" | "expired"
> = {
  active: "active",
  pastDue: "past_due",
  past_due: "past_due",
  canceled: "canceled",
  cancelled: "canceled",
  ended: "ended",
  incomplete: "incomplete",
  expired: "expired",
  abandoned: "canceled",
};

export function normalizeStatus(
  raw: string | null | undefined,
): "active" | "past_due" | "canceled" | "ended" | "incomplete" | "expired" {
  if (!raw) return "incomplete";
  return STATUS_MAP[raw] ?? "incomplete";
}

export const upsertSubscription = internalMutation({
  args: {
    clerkOrgId: v.string(),
    subscriptionId: v.string(),
    subscriptionItemId: v.optional(v.string()),
    planSlug: v.string(),
    status: v.optional(v.string()), // raw Clerk status; normalized inside
    seats: v.optional(v.number()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    orgName: v.optional(v.string()),
    orgSlug: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workspaceId = await ensureWorkspaceForOrg(ctx, {
      clerkOrgId: args.clerkOrgId,
      name: args.orgName,
      slug: args.orgSlug,
    });

    const plan = getPlan(args.planSlug);
    const limits = planLimits(args.planSlug);
    const features = planFeatures(args.planSlug);
    const seats = args.seats ?? limits.seats;

    // Find an existing row to upsert: prefer subscriptionItemId, then
    // subscriptionId, then org. (subscriptionItem.* is the authoritative signal,
    // and may arrive before/after subscription.*.)
    let existing = null;
    if (args.subscriptionItemId) {
      existing = await ctx.db
        .query("subscriptions")
        .withIndex("by_subscription_item", (q) =>
          q.eq("subscriptionItemId", args.subscriptionItemId),
        )
        .unique();
    }
    if (!existing) {
      existing = await ctx.db
        .query("subscriptions")
        .withIndex("by_subscription", (q) =>
          q.eq("subscriptionId", args.subscriptionId),
        )
        .unique();
    }
    if (!existing) {
      existing = await ctx.db
        .query("subscriptions")
        .withIndex("by_org", (q) => q.eq("clerkOrgId", args.clerkOrgId))
        .unique();
    }

    // A partial webhook (e.g. subscriptionItem.updated) may omit `status`. Never
    // let that downgrade an active subscriber to "incomplete" — preserve the
    // existing row's status when the payload doesn't carry one.
    const status = args.status
      ? normalizeStatus(args.status)
      : (existing?.status ?? "incomplete");

    const row = {
      workspaceId,
      clerkOrgId: args.clerkOrgId,
      subscriptionId: args.subscriptionId,
      subscriptionItemId: args.subscriptionItemId,
      planSlug: plan.slug,
      status,
      seats,
      features,
      limits,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, row);
    } else {
      await ctx.db.insert("subscriptions", row);
    }
    return null;
  },
});

export const deleteSubscription = internalMutation({
  args: {
    subscriptionId: v.optional(v.string()),
    subscriptionItemId: v.optional(v.string()),
    clerkOrgId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    let existing = null;
    if (args.subscriptionItemId) {
      existing = await ctx.db
        .query("subscriptions")
        .withIndex("by_subscription_item", (q) =>
          q.eq("subscriptionItemId", args.subscriptionItemId),
        )
        .unique();
    }
    if (!existing && args.subscriptionId) {
      existing = await ctx.db
        .query("subscriptions")
        .withIndex("by_subscription", (q) =>
          q.eq("subscriptionId", args.subscriptionId!),
        )
        .unique();
    }
    // Last-resort fallback by org: an id mismatch (e.g. the stored row was keyed
    // off a subscriptionItem id that differs from the deletion payload) must not
    // leave a cancelled customer on a paid plan forever. One row per org makes
    // this unambiguous.
    if (!existing && args.clerkOrgId) {
      existing = await ctx.db
        .query("subscriptions")
        .withIndex("by_org", (q) => q.eq("clerkOrgId", args.clerkOrgId!))
        .unique();
    }
    if (existing) {
      // Downgrade in place to ended rather than hard-deleting, so quota reads
      // still resolve to a known (Free-equivalent) entitlement.
      await ctx.db.patch(existing._id, {
        status: "ended",
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});
