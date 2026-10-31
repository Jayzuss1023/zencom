import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listForVisitor = query({
  args: {
    workspaceId: v.id("workspaces"),
    visitorId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("conversations"),
      lastMessageAt: v.number(),
      status: v.union(v.literal("open"), v.literal("closed")),
      mode: v.union(v.literal("ai"), v.literal("human")),
      preview: v.string(),
      lastAuthor: v.union(
        v.literal("visitor"),
        v.literal("agent"),
        v.literal("system"),
      ),
    }),
  ),
  handler: async (ctx, { workspaceId, visitorId }) => {
    const ws = await ctx.db.get(workspaceId);
    if (!ws) throw new ConvexError({ code: "UNKOWN_WORKSPACE" });

    const convos = await ctx.db
      .query("conversations")
      .withIndex("by_workspace_visitor", (q) =>
        q.eq("workspaceId", workspaceId).eq("visitorId", visitorId),
      )
      .collect();

    convos.sort((a, b) => b.lastMessageAt - a.lastMessageAt);

    const pullMessages = convos.slice(0, 20).map(async (c) => {
      const last = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", c._id))
        .order("desc")
        .first();
      if (!last) return null;

      return {
        _id: c._id,
        lastMessageAt: c.lastMessageAt,
        status: c.status ?? ("open" as const),
        mode: c.mode ?? ("ai" as const),
        preview: last.body.slice(0, 140),
        lastAuthor: last.author,
      };
    });

    const rows = await Promise.all(pullMessages);

    return rows.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

// Find or create this visitor's MOST RECENT conversation
// multi conversation safe - returns newest existing thread
export const getOrCreateForVisitor = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    visitorId: v.string(),
    visitorName: v.string(),
  },
  returns: v.id("conversations"),
  handler: async (ctx, { workspaceId, visitorId, visitorName }) => {
    const ws = await ctx.db.get(workspaceId);
    if (!ws) throw new ConvexError({ code: "UNKOWN_WORKSPACE" });

    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_workspace_visitor", (q) =>
        q.eq("workspaceId", workspaceId).eq("visitorId", visitorId),
      )
      .order("desc")
      .first();

    if (existing) return existing._id;
    const now = Date.now();

    return await ctx.db.insert("conversations", {
      workspaceId,
      visitorId,
      visitorName,
      lastMessageAt: now,
      mode: "ai", // Default: AI answered fist
      status: "open",
    });
  },
});
