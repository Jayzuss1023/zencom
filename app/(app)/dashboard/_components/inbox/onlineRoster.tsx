import { Users } from "lucide-react";
import { usePresence } from "./usePresence";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "./utils";

export function OnlineRoster({
  roster,
  onlineCount,
}: {
  roster: ReturnType<typeof usePresence>["roster"];
  onlineCount: number;
}) {
  const online = roster.filter((r) => r.online);
  console.log(online);

  if (online.length === 0) {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
        <Users className="size-3.5" />
        No one online
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 shadow-soft">
          <span className="flex -space-x-2">
            {online.slice(0, 4).map((m) => (
              <Avatar key={m.clerkUserId} className="ring-card size-6 ring-2">
                {m.avatarUrl ? <AvatarImage src={m.avatarUrl} /> : null}
                <AvatarFallback className="bg-brand/10 text-[9px] font-medium text-brand">
                  {initials(m.name)}
                </AvatarFallback>
              </Avatar>
            ))}
          </span>
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {onlineCount} teammate{onlineCount === 1 ? "" : "s"} online
      </TooltipContent>
    </Tooltip>
  );
}
