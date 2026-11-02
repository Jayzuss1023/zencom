"use client";

import { WidgetHeader } from "@/app/widget/components/WidgetHeader";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { ChatTab } from "./components/ChatTab/ChatTab";

export default function WidgetPage() {
  // STATE MANAGEMENT
  const [appId, setAppId] = useState<Id<"workspaces"> | null>(null);
  const [conversationId, setConversationId] =
    useState<Id<"conversations"> | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);

  // CONVEX
  const createConversation = useMutation(api.conversations.createForVisitor);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("app_id");
    if (id) setAppId(id as Id<"workspaces">);
  });

  // Lazily initialize brand new conversation on first send. Otherwise, return existing thread
  const ensureConversation = useCallback(
    async (): Promise<Id<"conversations"> | null> => {
      if (conversationId) return conversationId;
      if (!appId || !visitorId) return null;
      try {
      } catch {
        return null;
      }
    },
  );

  const config = useQuery(
    api.widget.getConfig,
    appId ? { workspaceId: appId } : "skip",
  );
  return (
    <div>
      <WidgetHeader />
      <ChatTab conversationId={conversationId} />
    </div>
  );
}
