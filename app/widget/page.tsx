"use client";

import { WidgetHeader } from "@/components/widget/WidgetHeader";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { div } from "motion/react-client";
import { useEffect, useState } from "react";

export default function WidgetPage() {
  const [appId, setAppId] = useState<Id<"workspaces"> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("app_id");
    console.log(id);
  });

  // Hand the host (loader.js) the authoritative proactive config so IT can run
  // the host-side dwell timer with the real `delaySeconds`. The iframe owns the
  // single source of truth (widget.getConfig); the loader owns the timing.
  useEffect(() => {});
  return (
    <div>
      Widgget Page
      <WidgetHeader />
    </div>
  );
}
