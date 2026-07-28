import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { p } from "motion/react-client";

export function LastMessagePreview({
  conversationId,
  unread,
}: {
  conversationId: Id<"conversations">;
  unread?: boolean;
}) {
  const messages = useQuery(api.messages.list, {
    conversationId,
  });
  if (messages === undefined) {
    return <Skeleton className="mt-1.5 h-3 w-3/4" />;
  }

  const lastMsg = messages[messages.length - 1];

  if (!lastMsg) {
    return (
      <p className="mt-1 truncate text-xs italic text-muted-foreground/70">
        No messages yet
      </p>
    );
  }

  const prefix =
    lastMsg.author === "visitor"
      ? ""
      : lastMsg.author === "system"
        ? ""
        : "You";

  return (
    <p
      className={cn(
        "mt-1 truncate text-xs",
        unread ? "font-medium text-foreground" : "text-muted-foreground",
      )}
    >
      {prefix ? <span>{prefix}</span> : null}
      {lastMsg.body}
    </p>
  );
}
