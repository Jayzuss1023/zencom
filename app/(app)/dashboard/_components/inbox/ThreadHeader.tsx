"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { initials } from "./utils";

type Convo = NonNullable<
  ReturnType<typeof useQuery<typeof api.inbox.getConvo>>
>;

export function ThreadHeader({ convo }: { convo: Convo }) {
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
