import { ConvexError, v } from "convex/values";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { OrgMemberContext, requireOrgMember } from "./lib/auth";
import { Doc, Id } from "./_generated/dataModel";
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

async function requireConversation(
  ctx: QueryCtx | MutationCtx,
  conversationId: Id<"conversations">,
): Promise<{ member: OrgMemberContext; convo: Doc<"conversations"> }> {
  const member = await requireOrgMember(ctx);
  const convo = await ctx.db.get(conversationId);

  if (!convo) {
    throw new ConvexError({
      code: "UNKNOWN_CONVERSATION",
      message: "Conversation not found.",
    });
  }

  if (convo.workspaceId !== member.workspace._id) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Not authorized for this conversation.",
    });
  }

  return { member, convo };
}

async function postSystem(
  ctx: MutationCtx,
  conversationId: Id<"conversations">,
  body: string,
): Promise<void> {
  await ctx.db.insert("messages", {
    conversationId,
    author: "system",
    body,
  });
}

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
    const member = await requireOrgMember(ctx);
    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.workspaceId !== member.workspace._id) {
      return null;
    }

    const assignee = convo.assignedClerkUserId
      ? await loadMember(ctx, member.workspace._id, convo.assignedClerkUserId)
      : null;

    const memberByClerkId = new Map<string, Doc<"workspaceMembers">>();
    if (assignee) memberByClerkId.set(assignee.clerkUserId, assignee);

    return enrich(convo, memberByClerkId);
  },
});

export const listMembers = query({
  args: {},
  returns: v.array(
    v.object({
      clerkUserId: v.string(),
      name: v.string(),
      avatarUrl: v.optional(v.string()),
      role: v.union(v.literal("admin"), v.literal("support")),
      isSelf: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const member = await requireOrgMember(ctx);
    const callerId = member.identity.subject;
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) =>
        q.eq("workspaceId", member.workspace._id),
      )
      .collect();
    const active = members
      .filter((m) => m.status === "active")
      .sort((a, b) => a.name.localeCompare(b.name));

    return await Promise.all(
      active.map(async (m) => {
        const customAvatarUrl = m.customAvatarStorageId
          ? await ctx.storage.getUrl(m.customAvatarStorageId)
          : null;

        return {
          clerkUserId: m.clerkUserId,
          name: m.name,
          avatarUrl: customAvatarUrl ?? m.imageUrl,
          role: m.role,
          isSelf: m.clerkUserId === callerId,
        };
      }),
    );
  },
});

// LOGGED IN USER TAKEOVER / RETURN TO AI TOGGLE FUNCS
// Update the targeted conversations table
// Update from AI to Human. "assignedClerkUser" is not updated. User is still assigned to conversation
export const returnToAi = mutation({
  args: { conversationId: v.id("conversations") },
  returns: v.null(),
  handler: async (ctx, { conversationId }) => {
    const { convo } = await requireConversation(ctx, conversationId);
    if (convo.mode !== "human") {
      // Already AI - Do nothing
      return null;
    }

    // Prevent from excessive attempts
    if (convo.pendingAgentJobId) {
      try {
        await ctx.scheduler.cancel(convo.pendingAgentJobId);
      } catch {
        // ignore
      }
    }

    await ctx.db.patch(conversationId, {
      mode: "ai",
      pendingAgentJobId: undefined,
    });
    await postSystem(ctx, conversationId, "handed back to the AI assistant.");
    return null;
  },
});

// Update the targeted conversations table
// Logged in user takesover conversation. Update the "assignedClerkUser"
// Update from AI to Human
export const takeOver = mutation({
  args: { conversationId: v.id("conversations") },
  returns: v.null(),
  handler: async (ctx, { conversationId }) => {
    const { member, convo } = await requireConversation(ctx, conversationId);
    const callerId = member.identity.subject;

    const alreadyHuman = convo.mode === "human";

    // Cancel the pending, not yet started AI Job
    if (convo.pendingAgentJobId) {
      try {
        await ctx.scheduler.cancel(convo.pendingAgentJobId);
      } catch {
        // ignore
      }
    }

    const patch: Partial<Doc<"conversations">> = {
      mode: "human",
      agentRunEpoch: (convo.agentRunEpoch ?? 0) + 1,
      pendingAgentJobId: undefined,
      lastReadByAgentAt: Date.now(),
    };

    // Only self assign if no one owns it
    if (!convo.assignedClerkUserId) {
      patch.assignedClerkUserId = callerId;
      patch.assignedAt = Date.now();
    }

    await ctx.db.patch(conversationId, patch);

    if (!alreadyHuman) {
      const name = member.identity.name;
      await postSystem(ctx, conversationId, `${name} joined the conversation.`);
    }
    return null;
  },
});

// ASSIGN/REASSIGN/UNASSIGN USER FROM CONVERSATION
export const assign = mutation({
  args: {
    conversationId: v.id("conversations"),
    clerkUserId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { conversationId, clerkUserId }) => {
    const { member, convo } = await requireConversation(ctx, conversationId);

    const targetMember = await loadMember(
      ctx,
      member.workspace._id,
      clerkUserId,
    );

    if (!targetMember || targetMember.status !== "active") {
      throw new ConvexError({
        code: "INVALID_ASSIGNEE",
        message: "Assignee is not an active member of this workspace.",
      });
    }

    // Update ConversationID's table and send message to notify user new assignee
    await ctx.db.patch(conversationId, {
      assignedClerkUserId: clerkUserId,
      assignedAt: Date.now(),
    });
    await postSystem(
      ctx,
      conversationId,
      `Conversation assigned to ${targetMember.name}`,
    );

    return null;
  },
});

export const unassign = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  returns: v.null(),
  handler: async (ctx, { conversationId }) => {
    const { convo } = await requireConversation(ctx, conversationId);

    if (!convo.assignedClerkUserId) {
      // Skip. User not yet assigned
      return null;
    }

    await ctx.db.patch(conversationId, {
      assignedClerkUserId: undefined,
      assignedAt: undefined,
    });
    await postSystem(ctx, conversationId, "Conversation returned to the queue");

    return null;
  },
});

// CONFIGURE STATUS OF CONVERSATION: OPEN/CLOSED
export const setStatus = mutation({
  args: {
    conversationId: v.id("conversations"),
    status: v.union(v.literal("open"), v.literal("closed")),
  },
  returns: v.null(),
  handler: async (ctx, { conversationId, status }) => {
    await requireConversation(ctx, conversationId); // Called for validation
    await ctx.db.patch(conversationId, {
      status: status,
    });
    await postSystem(ctx, conversationId, `This conversation is now ${status}`);
    return null;
  },
});
