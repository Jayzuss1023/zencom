"use client";

import { X } from "lucide-react";
import { Button } from "../../../components/ui/button";

export function WidgetHeader() {
  return (
    <header>
      <div />
      <div />
      <Button asChild>
        <X className="size-4" />
      </Button>
    </header>
  );
}
