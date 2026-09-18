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
  return (
    <div>
      <WidgetHeader />
      {/* Tab Bar - Helpdesk when faqEnabled */}
    </div>
  );
}
