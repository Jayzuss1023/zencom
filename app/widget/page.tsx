"use client";

import { WidgetHeader } from "@/app/widget/components/WidgetHeader";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { div } from "motion/react-client";
import { useEffect, useState } from "react";
import {
  loadOrCreate,
  VISITOR_ID_KEY,
  VISITOR_NAME_KEY,
} from "./lib/widget-utils";

export default function WidgetPage() {
  const [appId, setAppId] = useState<Id<"workspaces"> | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState<string | null>(null);

  // Get app_id from the iframe URL + load/create anonymous visitor
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("app_id");
    if (id) setAppId(id as Id<"workspaces">);

    setVisitorId(loadOrCreate(VISITOR_ID_KEY));
    setVisitorName(loadOrCreate(VISITOR_NAME_KEY));
  });

  const conversations = useQuery(
    api.conversations.listForVisitor,
    appId && visitorId ? { workspaceId: appId, visitorId } : "skip",
  );

  return (
    <div>
      Widgget Page
      <WidgetHeader />
      {/* Tab Bar - Helkdesk when faqEnabled */}
    </div>
  );
}
