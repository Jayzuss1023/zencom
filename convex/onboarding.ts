import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const createWorkspaceForOrg = mutation({
  args: {},
  returns: v.object({
    _id: v.id("workspaces"),
    _creationTime: v.number(),
    name: v.string(),
    clerkOrgId: v.optional(v.string()),
    slug: v.optional(v.string()),
    created: v.boolean(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "NOT_AUTHENTICATED",
        message: "Not authenticated",
      });
    }

    const claims = identity.o as unknown as Record<string, unknown>;
    const orgId = typeof claims.id === "string" ? claims.id : null;
    const orgSlug = typeof claims.slg === "string" ? claims.slg : undefined;

    if (!orgId) {
      throw new ConvexError({
        code: "NO_ACTIVE_ORG",
        message: "No active organization on the session",
      });
    }

    // Reuse the existing workspace for this org if present
    let workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_org", (q) => q.eq("clerkOrgId", orgId))
      .unique();

    let created = false;
    if (!workspace) {
      const name =
        (typeof claims.org === "string" && claims.org) ||
        (typeof identity.name === "string" && identity.name) ||
        orgSlug ||
        "My workspace";

      const id = await ctx.db.insert("workspaces", {
        name,
        ownerClerkUserId: identity.subject,
        clerkOrgId: orgId,
        slug: orgSlug,
      });
      workspace = (await ctx.db.get(id))!;
      created = true;
    }
    // Ensure an admin membership row for the caller
    const existingMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("clerkOrgId", orgId).eq("clerkUserId", identity.subject),
      )
      .unique();

    if (!existingMember) {
      await ctx.db.insert("workspaceMembers", {
        workspaceId: workspace._id,
        clerkOrgId: orgId,
        clerkUserId: identity.subject,
        // The self-provisioning caller minted (or owns) the org → seed as admin.
        // The membership webhook reconciles the authoritative role afterward.
        role: "admin",
        name:
          (typeof identity.name === "string" && identity.name) ||
          (typeof identity.email === "string" && identity.email) ||
          "Admin",
        email: typeof identity.email === "string" ? identity.email : undefined,
        status: "active",
      });
    }

    return {
      _id: workspace._id,
      _creationTime: workspace._creationTime,
      name: workspace.name,
      clerkOrgId: workspace.clerkOrgId,
      slug: workspace.slug,
      created,
    };
  },
});
