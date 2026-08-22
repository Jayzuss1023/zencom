import { Doc } from "@/convex/_generated/dataModel";
import { relativeTime } from "@/convex/lib/utils";
import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

type Message = Doc<"messages">;

// AI Generated
// Markdown bubble styling. Colors are inherited from the surrounding bubble so
// the same prose works on the light AI bubble and the solid human-agent bubble.
const MARKDOWN_PROSE = cn(
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
  "[&_p]:my-1.5 [&_strong]:font-semibold [&_em]:italic",
  "[&_a]:underline [&_a]:underline-offset-2",
  "[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5",
  "[&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_li]:my-0.5",
  "[&_:where(h1,h2,h3,h4)]:my-1.5 [&_:where(h1,h2,h3,h4)]:font-semibold",
  "[&_h1]:text-base [&_h2]:text-[15px] [&_h3]:text-sm",
  "[&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
  "[&_pre]:my-1.5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-black/10 [&_pre]:p-2.5",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_hr]:my-2 [&_hr]:border-current/20",
);

export default function MessageRow({ message }: { message: Message }) {
  const isAgent = message.author === "agent";
  const isAi = isAgent && message.isAi;

  if (message.author === "system") {
    return (
      <div className="my-1.5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
          {message.body}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group/msg flex flex-col gap-1",
        isAgent ? "items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "max-w-[78%] px-4 py-2.5 text-sm leading-relaxed shadow-soft",
          isAgent
            ? isAi
              ? "rounded-2xl rounded-br-md border border-brand/20 bg-brand/5 text-foreground"
              : "rounded-2xl rounded-br-md bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_8px_24px_-12px_var(--brand)]"
            : "rounded-2xl rounded-bl-md border border-border bg-card text-foreground",
        )}
      >
        {isAi ? (
          <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
            <Sparkles className="size-3" />
            AI assistant
          </span>
        ) : null}
        {isAgent ? (
          <div
            className={cn("wrap-break-word", MARKDOWN_PROSE)}
            // Message bodies are HTML-escaped inside renderMarkdown before a
            // limited tag set is re-introduced, so agent/AI output can't inject
            // executable markup.
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.body) }}
          />
        ) : (
          <p className="whitespace-pre-wrap wrap-break-word">{message.body}</p>
        )}
        {/* {isAi ? <Citations citations={message.citations} /> : null} */}
      </div>
      <span className="px-1 text-[10px] tabular-nums text-muted-foreground/60 opacity-0 transition-opacity group-hover/msg:opacity-100">
        {relativeTime(message._creationTime)}
      </span>
    </div>
  );
}
