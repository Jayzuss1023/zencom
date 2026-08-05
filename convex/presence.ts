import { ConvexError, v } from "convex/values";
import { components } from "./_generated/api";
import { Presence } from "@convex-dev/presence";
import { mutation, query } from "./_generated/server";
import { requireOrgMember } from "./lib/auth";
import { Doc } from "./_generated/dataModel";

const presence = new Presence(components.presence);

export const publicRoster = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.object({
    ok: v.boolean(),
  }),
  handler: async (ctx, { workspaceId }) => {
    const ws = ctx.db.get(workspaceId);
    if (!ws) {
      throw new ConvexError({ code: "UNKNOWN_WORKSPACE" });
    }

    const presenceRows = await presence.listRoom(ctx, workspaceId, false, 20);
    const onlineByClerkId = new Map<string, boolean>(
      presenceRows.map((r) => [r.userId, r.online]),
    );

    return {
      ok: true,
    };
  },
});

export const heartbeat = mutation({
  args: {
    sessionId: v.string(),
    interval: v.number(),
    data: v.optional(
      v.object({
        typingConversationId: v.optional(v.id("conversations")),
        activeConversationId: v.optional(v.id("conversations")),
      }),
    ),
  },
  returns: v.object({ roomToken: v.string(), sessionToken: v.string() }),
  handler: async (ctx, { sessionId, interval, data }) => {
    const member = await requireOrgMember(ctx);
    const roomId = member.workspace._id; // room = workspace
    const userId = member.identity.subject; // Clerk user id

    const tokens = await presence.heartbeat(
      ctx,
      roomId,
      userId,
      sessionId,
      interval,
    );

    // Attach per-user typing/active context for teammates (best-effort).
    if (data) {
      await presence.updateRoomUser(ctx, roomId, userId, data);
      console.log("DATA", data);
    }
    return tokens;
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  returns: v.null(),
  handler: async (ctx, { sessionToken }) => {
    await presence.disconnect(ctx, sessionToken);
    return null;
  },
});

export const list = query({
  args: { roomToken: v.string() },
  returns: v.object({
    ok: v.boolean(),
  }),
  handler: async (ctx, { roomToken }) => {
    const member = await requireOrgMember(ctx);

    // live listener for presence of active user
    const presenceRows = await presence.list(ctx, roomToken);

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) =>
        q.eq("workspaceId", member.workspace._id),
      )
      .collect();

    const byId = new Map<string, Doc<"workspaceMembers">>(
      members.map((m) => [m.clerkUserId, m]),
    );

    const prows = presenceRows.map((row) => {
      const data = (row.data ?? {}) as {
        typingConversationId?: string;
        activeConversationId?: string;
      };
      const m = byId.get(row.userId);
      console.log(m);
    });
    console.log(prows);

    return {
      ok: true,
    };
  },
});
