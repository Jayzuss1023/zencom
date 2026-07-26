"use client";

import { InboxIcon } from "lucide-react";
import { useState } from "react";
import {
  ConversationList,
  InboxFilter,
} from "./_components/inbox/ConversationList";
import { Id } from "@/convex/_generated/dataModel";

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
      <div>{/* ConversationThread */}</div>
    </div>
  );
}
