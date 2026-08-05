"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { initials } from "./utils";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { usePresence } from "./usePresence";

type Convo = NonNullable<
  ReturnType<typeof useQuery<typeof api.inbox.getConvo>>
>;

export function ThreadHeader({ convo }: { convo: Convo }) {
  // const [activeId, setActiveId] = useState<Id<"conversations"> | null>(null);
  // const [typing, setTyping] = useState(false);
  // const { ok } = usePresence({
  //   activeConversationId: activeId,
  //   typingConversationId: typing ? activeId : null,
  // });
  return (
    <div>
      <div>
        <div>
          <Avatar>
            <AvatarFallback>{initials(convo.visitorName)}</AvatarFallback>
          </Avatar>
          <div>
            <div>
              <span>{convo.visitorName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
