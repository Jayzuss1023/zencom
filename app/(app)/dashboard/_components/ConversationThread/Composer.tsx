import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Bot, Send } from "lucide-react";
import { useState } from "react";

export default function Composer({
  conversationId,
  isAiMode,
  onTypingChange,
}: {
  conversationId: Id<"conversations">;
  isAiMode: boolean;
  onTypingChange: (isTyping: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [sending, isSending] = useState(false);

  const send = useMutation(api.messages.sendFromAgent);
  const takeOver = useMutation(api.inbox.takeOver);

  const submit = async () => {
    const body = text.trim();
    const sendMsg = await send({ conversationId, body });
    console.log("MESSAGE", sendMsg);
  };

  return (
    <div className="border-t border-border bg-card px-4 py-3.5">
      {isAiMode ? (
        <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 text-[11px] font-medium text-brand">
          <Bot className="size-3.5 shrink-0" />
          The AI is handling this chat — replying will take it over.
        </div>
      ) : null}
      <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-soft transition-colors focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/10">
        <Textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTypingChange(e.target.value.trim().length > 0);
          }}
          onBlur={() => onTypingChange(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder="Reply to the visitor…  (Enter to send, Shift+Enter for newline)"
          rows={2}
          className="max-h-40 min-h-10 resize-none border-0 bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <Button
          size="icon"
          className="size-10 shrink-0 rounded-xl bg-linear-to-br from-brand to-brand-2 text-white shadow-[0_8px_24px_-8px_var(--brand)] hover:opacity-95 disabled:from-muted-foreground/40 disabled:to-muted-foreground/40 disabled:opacity-100 disabled:shadow-none"
          disabled={sending || text.trim().length === 0}
          onClick={() => void submit()}
          aria-label="Send reply"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
