import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Bot } from "lucide-react";
import { div } from "motion/react-client";
import { ThreadHeader } from "./ThreadHeader";

export function ConversationThread({
  conversationId,
}: {
  conversationId: Id<"conversations">;
}) {
  const convo = useQuery(api.inbox.getConvo, { conversationId });

  if (convo === undefined) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="ml-auto h-8 w-24 rounded-md" />
        </div>
        <div className="flex-1 space-y-4 p-6">
          <Skeleton className="h-14 w-1/2 rounded-2xl" />
          <Skeleton className="ml-auto h-14 w-1/2 rounded-2xl" />
          <Skeleton className="h-14 w-2/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (convo === null) {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div className="flex max-w-xs flex-col items-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Bot className="size-6" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">
            Conversation unavailable
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            This conversation may have been removed or you no longer have
            access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ThreadHeader convo={convo} />
    </div>
  );
}
