import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireOrgMember } from "./lib/auth";

// List a conversations messages. Solely used for Dashboard and Widget
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

    // Authorization. Skip function if unsuccessful
    // Verify and allow only for either workspace or visitor from widget to have access
    if (visitorId !== undefined) {
      if (convo.visitorId !== visitorId) return [];
    } else {
      const { workspace } = await requireOrgMember(ctx);
      if (convo.workspaceId !== workspace._id) return [];
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId),
      )
      .order("asc")
      .collect();
  },
});
