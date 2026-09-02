import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
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

const MAX_BODY_LEN = 4000; // server-side bound on visitor free-text
export const sendFromAgent = mutation({
  args: { conversationId: v.id("conversations"), body: v.string() },
  returns: v.null(),
  handler: async (ctx, { conversationId, body }) => {
    const { workspace, identity } = await requireOrgMember(ctx);
    const convo = await ctx.db.get(conversationId);

    // Validation before allowing message post
    if (!convo) throw new ConvexError({ code: "UKNOWN_CONVERSATION" });
    if (convo.workspaceId !== workspace._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Not authorized for this conversation.",
      });
    }

    const trimmed = body.slice(0, MAX_BODY_LEN);
    if (trimmed.length === 0) {
      throw new ConvexError({ code: "EMPTY_BODY" });
    }

    await ctx.db.insert("messages", {
      conversationId,
      author: "agent",
      body: trimmed,
      isAi: false, // human
      authorClerkUserId: identity.subject,
    });

    // Update time of last msg sent for UI dashboard
    await ctx.db.patch(conversationId, { lastMessageAt: Date.now() });
    return null;
  },
});
