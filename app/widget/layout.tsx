"use client";

import React, { useEffect, useState } from "react";
import { WidgetProvider } from "./WidgetProvider";
import { Id } from "@/convex/_generated/dataModel";

export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [appId, setAppId] = useState<Id<"workspaces"> | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("app_id");
    if (id) setAppId(id as Id<"workspaces">);
  });

  return <WidgetProvider>{children}</WidgetProvider>;
}
