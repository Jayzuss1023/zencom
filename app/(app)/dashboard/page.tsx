"use client";

import { InboxIcon } from "lucide-react";
import { useState } from "react";
import {
  ConversationList,
  InboxFilter,
} from "./_components/inbox/ConversationList";
import { Id } from "@/convex/_generated/dataModel";
import { ConversationThread } from "./_components/ConversationThread/ConversationThread";
import { usePresence } from "./_components/inbox/usePresence";
import { OnlineRoster } from "./_components/inbox/onlineRoster";

export default function InboxPage() {
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [activeId, setActiveId] = useState<Id<"conversations"> | null>(null);
  const [typing, setTyping] = useState(false);
  const { roster, onlineCount } = usePresence({
    activeConversationId: activeId,
    typingConversationId: typing ? activeId : null,
  });

  return (
    <div className="grid h-[calc(100svh-3.5rem)] grid-cols-1 bg-muted/30 md:grid-cols-[minmax(320px,380px)_1fr]">
      <div
        className={`bg-card flex min-h-0 min-w-0 flex-col border-r border-border ${
          activeId ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <InboxIcon className="size-4" />
            </span>
            <div className="leading-none">
              <h1 className="text-sm font-semibold tracking-tight">Inbox</h1>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Shared conversations
              </p>
            </div>
          </div>
          {/* OnlineRoster */}
          <OnlineRoster roster={roster} onlineCount={onlineCount} />
        </div>
        <div className="min-h-0 flex-1">
          <ConversationList
            filter={filter}
            onFilterChange={setFilter}
            activeId={activeId}
            onSelect={setActiveId}
          />
        </div>
      </div>

      {/* Right pane - Thread */}
      <div
        className={`bg-background min-h-0 min-w-0 ${
          activeId ? "flex" : "hidden md:flex"
        } flex-col`}
      >
        {activeId ? (
          <ConversationThread
            key={activeId}
            conversationId={activeId}
            roster={roster}
            onTypingChange={setTyping}
          />
        ) : (
          <div className="grid h-full place-items-center p-8">
            <div className="flex max-w-sm flex-col items-center text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <InboxIcon className="size-7" />
              </div>
              <h2 className="mt-5 text-base font-medium text-foreground">
                No conversation selected
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Pick a conversation from the list to read the thread, reply, and
                hand off between your AI agent and the team.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
