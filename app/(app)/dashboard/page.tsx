"use client";

import { InboxIcon } from "lucide-react";
import { useState } from "react";
import {
  ConversationList,
  InboxFilter,
} from "./_components/inbox/ConversationList";
import { Id } from "@/convex/_generated/dataModel";
import { ConversationThread } from "./_components/inbox/ConversationThread";

export default function InboxPage() {
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [activeId, setActiveId] = useState<Id<"conversations"> | null>(null);
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
      <div>
        {activeId ? (
          <ConversationThread key={activeId} conversationId={activeId} />
        ) : (
          <div>
            <div>
              <InboxIcon className="size-7" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
