import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const createWorkspaceForOrg = mutation({
  args: {},
  returns: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
  },
});
