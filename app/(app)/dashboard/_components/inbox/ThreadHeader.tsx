"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { initials } from "./utils";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { RosterEntry, usePresence } from "./usePresence";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Check,
  ChevronDown,
  CircleCheck,
  CircleDot,
  User,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { appRouterContext } from "next/dist/server/route-modules/app-route/shared-modules";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Convo = NonNullable<
  ReturnType<typeof useQuery<typeof api.inbox.getConvo>>
>;

export function ThreadHeader({
  convo,
  roster,
}: {
  convo: Convo;
  roster: RosterEntry[];
}) {
  const conversationId = convo._id;
  const [busy, setBusy] = useState(false);

  const members = useQuery(api.inbox.listMembers);
  const takeOver = useMutation(api.inbox.takeOver);
  const returnToAi = useMutation(api.inbox.returnToAi);
  const assign = useMutation(api.inbox.assign);
  const unassign = useMutation(api.inbox.unassign);
  const setStatus = useMutation(api.inbox.setStatus);

  const isHuman = convo.mode === "human";

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
    } catch (err) {
      err instanceof Error ? err.message : "Something went wrong.";
    } finally {
      setBusy(false);
    }
  };

  // Who's actively viewin THIS conversationo (exludes me is fine - shows team)
  const viewers = roster.filter(
    (r) => r.online && r.activeConversationId === conversationId,
  );

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <Avatar className="size-10">
            <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
              {initials(convo.visitorName)}
            </AvatarFallback>
          </Avatar>
          <span
            aria-hidden
            className={cn(
              "absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-card",
              viewers.length > 0 ? "bg-emerald-500" : "bg-zinc-300",
            )}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold tracking-tight">
              {convo.visitorName}
            </span>
            {viewers.length > 0 ? (
              <Tooltip>
                <TooltipTrigger>
                  <span className="flex -space-x-1.5">
                    {viewers.slice(0, 3).map((v) => (
                      <Avatar
                        key={v.clerkUserId}
                        className="ring-card size-5 ring-2"
                      >
                        {v.avatarUrl ? <AvatarImage src={v.avatarUrl} /> : null}
                        <AvatarFallback className="bg-brand/10 text-[8px] font-medium text-brand">
                          {initials(v.name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {viewers.map((v) => v.name ?? "Teammate").join(", ")} viewing
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          <div>
            <span>{convo.status === "closed" ? "Closed" : "Open"}</span>
            {viewers.length > 0 ? <span>{viewers.length} viewing</span> : null}
          </div>
        </div>
      </div>

      <div>
        {/* AI + Human toggle */}
        {isHuman ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() =>
              run(
                () => returnToAi({ conversationId }),
                "Handed back to AI assistant",
              )
            }
          >
            <Bot className="size-4" />
            Return to AI
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={busy}
            className="bg-linear-to-br from brand to-brand-2 text-white shadow-[0_8px_24px_-8px_var(--brand)] hover:opacity-95"
            onClick={() =>
              run(
                () => takeOver({ conversationId }),
                "You've taken over this conversation",
              )
            }
          >
            <User className="size-4" />
            Take over
          </Button>
        )}

        {/* Assignee dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="sm" variant="outline" disabled={busy}>
                {convo.assigneeName ? (
                  <>
                    <Avatar className="size-4">
                      {convo.assigneeAvatarUrl ? (
                        <AvatarImage src={convo.assigneeAvatarUrl} />
                      ) : null}
                      <AvatarFallback className="text-[8px]">
                        {initials(convo.assigneeName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-28 truncate">
                      {convo.assigneeName}
                    </span>
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    Assign
                  </>
                )}
                <ChevronDown className="size-3 opacity-60" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Assign to</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {members === undefined ? (
              <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
            ) : (
              members.map((m) => {
                const selected = convo.assignedClerkUserId === m.clerkUserId;
                return (
                  <DropdownMenuItem
                    key={m.clerkUserId}
                    onClick={() =>
                      run(
                        () =>
                          assign({
                            conversationId,
                            clerkUserId: m.clerkUserId,
                          }),
                        `Assigned to ${m.name}`,
                      )
                    }
                  >
                    <Avatar className="size-5">
                      {m.avatarUrl ? <AvatarImage src={m.avatarUrl} /> : null}
                      <AvatarFallback className="text-[9px]">
                        {initials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">
                      {m.name}
                      {m.isSelf ? " (me)" : ""}
                      {selected ? (
                        <Check className="ml-auto size-4 opacity-70" />
                      ) : null}
                    </span>
                  </DropdownMenuItem>
                );
              })
            )}
            {convo.assignedClerkUserId ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    run(
                      () => unassign({ conversationId }),
                      "Returned to the queue",
                    )
                  }
                >
                  Unassign
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Control */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button disabled={busy} size="sm" variant="outline">
                {convo.status === "closed" ? (
                  <CircleCheck className="size-4" />
                ) : (
                  <CircleDot className="size-4" />
                )}
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                run(
                  () => setStatus({ conversationId, status: "open" }),
                  "This conversation is now open",
                )
              }
            >
              <CircleDot className="size-4" />
              Open
              {convo.status !== "closed" ? (
                <Check className="ml-auto size-4 opacity-70" />
              ) : null}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                run(
                  () => setStatus({ conversationId, status: "closed" }),
                  "Conversation closed.",
                )
              }
            >
              <CircleCheck className="size-4" />
              Closed
              {convo.status === "closed" ? (
                <Check className="ml-auto size-4 opacity-70" />
              ) : null}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Badge
          className={cn(
            "gap-1 font-medium",
            isHuman
              ? "border-emeral-500/20 bg-emerald-500/10 text-emerald-600"
              : "border-brand/20 bg-brand/10 text-brand",
          )}
        >
          {isHuman ? <User className="size-3" /> : <Bot className="size-3" />}
          {isHuman ? "Human" : "AI"}
        </Badge>
      </div>
    </div>
  );
}
