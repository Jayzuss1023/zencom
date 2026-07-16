"use client";

import { InboxIcon } from "lucide-react";

export default function InboxPage() {
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
        <div>{/* ConversationList */}</div>
      </div>

      {/* Right pane - Thread */}
      <div>{/* ConversationThread */}</div>
    </div>
  );
}
