import { query } from "./_generated/server";
import { v } from "convex/values";

// Check if a User an an Organization exists in Convex's Auth.
// Type check and return the object
export const whoami = query({
  args: {},
  returns: {
    authenticated: v.boolean(),
    subject: v.union(v.string(), v.null()),
    orgId: v.union(v.string(), v.null()),
    orgRole: v.union(v.string(), v.null()),
    orgSlug: v.union(v.string(), v.null()),
    hasActiveOrg: v.boolean(),
  },
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return {
        authenticated: false,
        subject: null,
        orgId: null,
        orgRole: null,
        orgSlug: null,
        hasActiveOrg: false,
      };
    }
    const claims = identity.o as unknown as Record<string, unknown>;
    const orgId =
      claims !== undefined && typeof claims.id === "string" ? claims.id : null;
    const orgRole =
      claims !== undefined && claims.rol && typeof claims.rol === "string"
        ? claims.rol
        : null;
    const orgSlug =
      claims !== undefined && claims.slg && typeof claims.slg === "string"
        ? claims.slg
        : null;

    return {
      authenticated: true,
      subject: identity.subject,
      orgId,
      orgRole,
      orgSlug,
      hasActiveOrg: orgId !== null,
    };
  },
});
