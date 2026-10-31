import { Id } from "@/convex/_generated/dataModel";
import { Send } from "lucide-react";
import React, { useState } from "react";

type Props = {
  conversationId: Id<"conversations"> | null;
};

export function ChatTab({ conversationId }: Props) {
  // for send message form
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body && sending) return;
    setText("");
    setError(false);
    setSending(true);
    try {
      // Create conversation for new chats
    } catch (err) {}
  };
  return (
    <div className="flex h-full flex-col bg-[#fafafb]">
      <form
        onSubmit={submit}
        className="flex items-end gap-2 border-t border-neutral-100 bg-white p-3"
      >
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
          }}
          rows={1}
          placeholder="Type your message..."
          aria-label="Type your message"
          className="max-h-28 min-h-10.5 flex-1 resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm leading-relaxed outline-none transition placeholder:text-neutral-400 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-[var(--wc-button)]/30 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Send message"
          className="flex size-10.5 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm transition hover:opacity-95 disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
