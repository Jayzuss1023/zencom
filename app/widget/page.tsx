"use client";

import { WidgetHeader } from "@/app/widget/components/WidgetHeader";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";

export default function WidgetPage() {
  const [appId, setAppId] = useState<Id<"workspaces"> | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    console.log(params);
  });

  const config = useQuery(
    api.widget.getConfig,
    appId ? { workspaceId: appId } : "skip",
  );
  return (
    <div>
      <WidgetHeader />
      {/* Tab Bar - Helpdesk when faqEnabled */}
    </div>
  );
}
