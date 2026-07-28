import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireOrgMember } from "./lib/auth";
import { Doc } from "./_generated/dataModel";
import { enrich, isUnread, loadMember } from "./lib/utils";

const conversationListItem = v.object({
  _id: v.id("conversations"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  visitorId: v.string(),
  visitorName: v.string(),
  lastMessageAt: v.number(),
  mode: v.union(v.literal("ai"), v.literal("human")),
  status: v.union(v.literal("open"), v.literal("closed")),
  assignedClerkUserId: v.optional(v.string()),
  assignedAt: v.optional(v.number()),
  assigneeName: v.optional(v.string()),
  assigneeAvatarUrl: v.optional(v.string()),
  lastVisitorMessageAt: v.optional(v.number()),
  lastReadByAgentAt: v.optional(v.number()),
  unread: v.boolean(),
});

export const qeueCounts = query({
  args: {},
  returns: v.object({
    all: v.number(),
    mine: v.number(),
    unassigned: v.number(),
    ai: v.number(),
    human: v.number(),
    unread: v.number(),
  }),
  handler: async (ctx) => {
    const member = await requireOrgMember(ctx);
    const wsId = member.workspace._id;
    const callerId = member.identity.subject;
    const rows = await ctx.db
      .query("conversations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", wsId))
      .collect();

    let all = 0;
    let mine = 0;
    let unassigned = 0;
    let ai = 0;
    let human = 0;
    let unread = 0;

    for (const c of rows) {
      all += 1;
      if (c.assignedClerkUserId === callerId) mine += 1;
      if (!c.assignedClerkUserId) unassigned += 1;
      if ((c.mode ?? "ai") === "ai") ai += 1;
      else human += 1;
      if (isUnread(c)) unread += 1;
    }
    return {
      all,
      mine,
      unassigned,
      ai,
      human,
      unread,
    };
  },
});

// QUERIES
export const listConversations = query({
  args: {
    filter: v.optional(
      v.union(
        v.literal("all"),
        v.literal("mine"),
        v.literal("unassigned"),
        v.literal("ai"),
        v.literal("human"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  returns: v.array(conversationListItem),
  handler: async (ctx, { filter, limit }) => {
    const member = await requireOrgMember(ctx);
    const wsId = member.workspace._id;
    const callerId = member.identity.subject;
    const take = Math.min(limit ?? 100, 200);
    const which = filter ?? "all";

    let rows: Doc<"conversations">[];
    if (which === "mine") {
      rows = await ctx.db
        .query("conversations")
        .withIndex("by_workspace_assignee", (q) =>
          q.eq("workspaceId", wsId).eq("assignedClerkUserId", callerId),
        )
        .order("desc")
        .take(take);
    } else if (which === "unassigned") {
      rows = await ctx.db
        .query("conversations")
        .withIndex("by_workspace_assignee", (q) =>
          q.eq("workspaceId", wsId).eq("assignedClerkUserId", undefined),
        )
        .order("desc")
        .take(take);
    } else if (which === "ai" || which === "human") {
      rows = await ctx.db
        .query("conversations")
        .withIndex("by_workspace_mode", (q) =>
          q.eq("workspaceId", wsId).eq("mode", which),
        )
        .order("desc")
        .take(take);
    } else {
      // all - every conversation in the workspace starting with the newest
      rows = await ctx.db
        .query("conversations")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", wsId))
        .order("desc")
        .take(take);
    }

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", wsId))
      .collect();

    const memberByClerkId = new Map(members.map((m) => [m.clerkUserId, m]));

    return rows.map((c) => enrich(c, memberByClerkId));
  },
});

export const getConvo = query({
  args: { conversationId: v.id("conversations") },
  returns: v.union(conversationListItem, v.null()),
  handler: async (ctx, { conversationId }) => {
    console.log("GETTING CONVOS");
    const member = await requireOrgMember(ctx);
    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.workspaceId !== member.workspace._id) {
      return null;
    }

    console.log("CONVO", convo);

    const assignee = convo.assignedClerkUserId
      ? await loadMember(ctx, member.workspace._id, convo.assignedClerkUserId)
      : null;

    const memberByClerkId = new Map<string, Doc<"workspaceMembers">>();
    if (assignee) memberByClerkId.set(assignee.clerkUserId, assignee);

    return enrich(convo, memberByClerkId);
  },
});
