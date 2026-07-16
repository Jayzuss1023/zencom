"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import React from "react";

// Widget talks to clients without Clerk - Visitors are anyonymous
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
