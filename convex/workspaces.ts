import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";

export { getActiveWorkspace } from "./lib/auth";

export const ensureForCurrentUser = mutation({
  args: {},
  returns: v.object({
    _id: v.id("workspaces"),
    _creationTime: v.number(),
    name: v.string(),
    clerkOrgId: v.optional(v.string()),
    slug: v.optional(v.string()),
    ownerClerkUserId: v.string(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "NOT_AUTHENTICATED",
        message: "Not authenticated.",
      });
    }
    const claims = identity.o as unknown as Record<string, unknown>;
    console.log(claims);
    const orgId = typeof claims.id === "string" ? claims.id : null;
    const orgSlug = typeof claims.slg === "string" ? claims.slg : undefined;
    if (!orgId) {
      // No active org → the dashboard must route to /onboarding. Surface the
      // typed code rather than silently creating an owner-keyed workspace.
      throw new ConvexError({
        code: "NO_ACTIVE_ORG",
        message: "No active organization on the session.",
      });
    }

    let ws = await ctx.db
      .query("workspaces")
      .withIndex("by_org", (q) => q.eq("clerkOrgId", orgId))
      .unique();

    if (!ws) {
      const name =
        (typeof claims.name === "string" && claims.name) ||
        (typeof identity.name === "string" && identity.name) ||
        orgSlug ||
        "My workspace";
      const id = await ctx.db.insert("workspaces", {
        name,
        ownerClerkUserId: identity.subject,
        clerkOrgId: orgId,
        slug: orgSlug,
      });
      ws = (await ctx.db.get(id))!;

      // Seed the admin membership idempotently.
      const existingMember = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_org_user", (q) =>
          q.eq("clerkOrgId", orgId).eq("clerkUserId", identity.subject),
        )
        .unique();
      if (!existingMember) {
        await ctx.db.insert("workspaceMembers", {
          workspaceId: ws._id,
          clerkOrgId: orgId,
          clerkUserId: identity.subject,
          role: "admin",
          name:
            (typeof identity.name === "string" && identity.name) ||
            (typeof identity.email === "string" && identity.email) ||
            "Admin",
          email:
            typeof identity.email === "string" ? identity.email : undefined,
          status: "active",
        });
      }
    }

    return {
      _id: ws._id,
      _creationTime: ws._creationTime,
      name: ws.name,
      clerkOrgId: ws.clerkOrgId,
      slug: ws.slug,
      ownerClerkUserId: ws.ownerClerkUserId,
    };
  },
});
