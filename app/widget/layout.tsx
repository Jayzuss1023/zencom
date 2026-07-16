import type { Viewport } from "next";
import React from "react";
import { WidgetProvider } from "./WidgetProvider";

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
  return <WidgetProvider>{children}</WidgetProvider>;
}
