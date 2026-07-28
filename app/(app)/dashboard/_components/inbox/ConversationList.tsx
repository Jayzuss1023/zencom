"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { InboxIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "./utils";
import { relativeTime } from "@/convex/lib/utils";
import { LastMessagePreview } from "./LastMessagePreview";
import { ModeBadge } from "./ModeBadge";
import { Badge } from "@/components/ui/badge";

export type InboxFilter = "all" | "mine" | "unassigned" | "ai" | "human";

const FILTERS: { value: InboxFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "mine", label: "Mine" },
  { value: "unassigned", label: "Unassigned" },
  { value: "ai", label: "AI" },
  { value: "human", label: "Human" },
];

export function ConversationList({
  filter,
  onFilterChange,
  activeId,
  onSelect,
}: {
  filter: InboxFilter;
  onFilterChange: (f: InboxFilter) => void;
  activeId: Id<"conversations"> | null;
  onSelect: (id: Id<"conversations">) => void;
}) {
  // Counts for filters
  const counts = useQuery(api.inbox.qeueCounts, {});
  // Changes state of conversation onFilterChange
  const conversations = useQuery(api.inbox.listConversations, { filter });

  const countsFor = (f: InboxFilter): number | undefined => {
    if (!counts) return undefined;
    return counts[f];
  };

  return (
    <div className="@container/inbox flex h-full flex-col">
      <div className="border-b border-border p-2.5">
        <Tabs
          value={filter}
          onValueChange={(v) => onFilterChange(v as InboxFilter)}
        >
          <TabsList>
            {FILTERS.map((f) => {
              const c = countsFor(f.value);
              const isActive = f.value === filter;

              return (
                <TabsTrigger
                  key={f.value}
                  value={f.value}
                  className="h-7 flex-none gap-1.5 rounded-lg px-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors data-[state=active]:bg-card data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-soft"
                >
                  {f.label}
                  {c !== undefined && c > 0 ? (
                    <span
                      className={cn(
                        "min-w-4 rounded-full px-1 text-center text-[10px] tabular-numbs",
                        isActive
                          ? "bg-brand/10 text-brand"
                          : "bg-muted-foreground/10 text-muted-foreground",
                      )}
                    >
                      {c}
                    </span>
                  ) : null}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* List */}
      <ScrollArea>
        {conversations === undefined ? (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-2 py-3">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-w.5 w-8" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3.5 w-12 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="bg-muted rounded-2xl size-14 flex justify-center items-center text-muted-foreground">
              <InboxIcon className="size=6" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">
              No conversations here yet
            </p>
            <p className="mt-1 text-xs text=muted-foreground">
              {/* All widgets r displayed */}
              {filter === "all"
                ? "Open the widget on a page and say hi"
                : "Try a different filter"}
            </p>
          </div>
        ) : (
          <ul>
            {conversations.map((c) => {
              const isActive = c._id === activeId;

              return (
                <li key={c._id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c._id)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "group relative flex w-full items-start gap-3 rounded-xl px-2.5 py-3 text-left transition-colors",
                      isActive ? "bg-brand/8" : "hover:bg-muted/70",
                    )}
                  >
                    {isActive ? (
                      <span
                        aria-hidden
                        className="absolute inset-y-2.5 left-0 w-1 rounded-full bg-linear-to-b from-brand to-brand-2"
                      />
                    ) : null}
                    <div className="relative shrink-0">
                      <Avatar
                        className={cn(
                          "size-9 ring-2 ring-transparent transition-shadow",
                          isActive && "ring-brand/20",
                        )}
                      >
                        <AvatarFallback
                          className={cn(
                            "text-xs font-medium",
                            isActive
                              ? "bg-brand/15 text-brand"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {initials(c.visitorName)}
                        </AvatarFallback>
                      </Avatar>
                      {c.unread ? (
                        <span className="ring-2 ring-card size-2.5 bg-brand absolute -right-0.5 -top-0.5 rounded-full" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "truncate text-sm",
                            c.unread
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground/90",
                          )}
                        >
                          {c.visitorName}
                        </span>
                        <span
                          className={cn(
                            "ml-auto shrink-0 text-[11px] tabular-nums",
                            c.unread
                              ? "font-medium text-brand"
                              : "text-muted-foreground",
                          )}
                        >
                          {relativeTime(c.lastMessageAt)}
                        </span>
                      </div>

                      <LastMessagePreview
                        conversationId={c._id}
                        unread={c.unread}
                      />
                      <div>
                        <ModeBadge mode={c.mode} />
                        {c.status === "closed" ? (
                          <Badge
                            variant="outline"
                            className="h-5 gap-1 px-1.5 text-[10px] text-muted-foreground"
                          >
                            Closed
                          </Badge>
                        ) : null}
                        {c.assigneeName ? (
                          <span className="ml-auto flex items-center gap-1">
                            <Avatar className="size-5 ring-2 ring-card">
                              {c.assigneeAvatarUrl ? (
                                <AvatarImage src={c.assigneeAvatarUrl} />
                              ) : null}
                            </Avatar>
                          </span>
                        ) : (
                          <span className="ml-auto text-[10px] font-medium text-muted-foreground/70">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
