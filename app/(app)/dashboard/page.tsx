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

export default function InboxPage() {
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [activeId, setActiveId] = useState<Id<"conversations"> | null>(null);
  const [typing, setTyping] = useState(false);
  const { roster, onlineCount } = usePresence({
    activeConversationId: activeId,
    typingConversationId: typing ? activeId : null,
  });

  return (
    <div>
      <div>
        <div>
          <div>
            <span>
              <InboxIcon className="size-4" />
            </span>
            <div>
              <h1>Inbox</h1>
              <p>Shared conversations</p>
            </div>
          </div>
          {/* OnlineRoster */}
        </div>
        <div>
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
