"use client";

import type { Viewport } from "next";
import React, { useEffect, useState } from "react";
import { WidgetProvider } from "./WidgetProvider";
import { Id } from "@/convex/_generated/dataModel";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [appId, setAppId] = useState<Id<"workspaces"> | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("app_id");
    if (!appId) {
      setAppId(id as Id<"workspaces">);
    }
  });

  return <WidgetProvider>{children}</WidgetProvider>;
}
