import { Doc, Id } from "@/_generated/dataModel";
import { MutationCtx, QueryCtx } from "@/_generated/server";

// All messages start off in AI mode (Admin has not yet been assigned)
// If Visitor's last message time is greater than AI's read then mark as unread
// Once human is assigned, every new message defaults to unread
export function isUnread(convo: Doc<"conversations">): boolean {
  const lastVisitor = convo.lastVisitorMessageAt ?? 0;
  if (lastVisitor === 0) return false;
  const lastRead = convo.lastReadByAgentAt ?? 0;
  return lastVisitor > lastRead;
}

export function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export async function loadMember(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  clerkUserId: string,
) {
  const members = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .collect();

  return members.find((m) => m.clerkUserId === clerkUserId) ?? null;
}

export function enrich(
  convo: Doc<"conversations">,
  memberByClerkId: Map<string, Doc<"workspaceMembers">>,
) {
  const assignee = convo.assignedClerkUserId
    ? memberByClerkId.get(convo.assignedClerkUserId)
    : undefined;

  return {
    _id: convo._id,
    _creationTime: convo._creationTime,
    workspaceId: convo.workspaceId,
    visitorId: convo.visitorId,
    visitorName: convo.visitorName,
    lastMessageAt: convo.lastMessageAt,
    mode: convo.mode ?? "ai",
    status: convo.status ?? "open",
    assignedClerkUserId: convo.assignedClerkUserId,
    assignedAt: convo.assignedAt,
    assigneeName: assignee?.name,
    assigneeAvatarUrl: assignee?.imageUrl,
    lastVisitorMessageAt: convo.lastVisitorMessageAt,
    lastReadByAgentAt: convo.lastReadByAgentAt,
    unread: isUnread(convo),
  };
}
