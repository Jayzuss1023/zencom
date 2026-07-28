import { Badge, Bot, User } from "lucide-react";

export function ModeBadge({ mode }: { mode: "ai" | "human" }) {
  return mode === "ai" ? (
    <Badge className="h-5 gap-1 border-brand/20 bg-brand/10 px-1.5 text-[10px] font-medium text-brand">
      <Bot className="size-3" />
      AI
    </Badge>
  ) : (
    <Badge className="h-5 gap-1 border-emerald-500/20 bg-emerald-500/10 px-1.5 text-[10px] font-medium text-emerald-600">
      <User className="size-3" />
      Human
    </Badge>
  );
}
