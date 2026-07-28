import { v } from "convex/values";
import { query } from "./_generated/server";

export const list = query({
  args: {
    conversationId: v.id("conversations"),
    visitorId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      conversationId: v.id("conversations"),
      author: v.union(
        v.literal("visitor"),
        v.literal("agent"),
        v.literal("system"),
      ),
      body: v.string(),
      isAi: v.optional(v.boolean()),
      authorClerkUserId: v.optional(v.string()),
      pending: v.optional(v.boolean()),
      citations: v.optional(
        v.array(
          v.object({
            chunkId: v.optional(v.id("knowledgeChunks")),
            title: v.optional(v.string()),
            url: v.optional(v.string()),
          }),
        ),
      ),
    }),
  ),
  handler: async (ctx, { conversationId, visitorId }) => {
    const convo = await ctx.db.get(conversationId);

    if (!convo) return [];

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId),
      )
      .order("asc")
      .collect();
  },
});
