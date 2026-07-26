import { ConvexError, v } from "convex/values";
import { components } from "./_generated/api";
import { Presence } from "@convex-dev/presence";
import { query } from "./_generated/server";

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
