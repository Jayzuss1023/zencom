import { v } from "convex/values";
import { query } from "./_generated/server";

export const getConfig = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.null(),
  handler: async (ctx, { workspaceId }) => {
    const ws = await ctx.db.get(workspaceId);
  },
});
