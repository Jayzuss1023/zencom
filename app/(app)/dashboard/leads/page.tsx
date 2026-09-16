"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useConvex,
  useConvexAuth,
  useMutation,
  usePaginatedQuery,
} from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import {
  Download,
  ExternalLink,
  Loader2,
  MessageSquare,
  Search,
  Users,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type LeadStatus = "new" | "contacted" | "closed";

const STATUS_OPTIONS: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
];

const SOURCE_OPTIONS = [
  { value: "all", label: "All sources" },
  { value: "widget", label: "Widget" },
  { value: "proactive", label: "Proactive" },
];

export default function LeadsPage() {
  const { isAuthenticated } = useConvexAuth();
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [source, setSource] = useState<string | null>("all");
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-6 lg:p-8">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Contacts captured from your widget — search, filter, and export.
            </p>
          </div>
        </div>
        <Button disabled={exporting} variant="outline" className="shadow-sm">
          {exporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-border bg-card p-3 shadow-card">
        <div className="relative min-w-55 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="h-10 border-transparent bg-muted/60 pl-9 focus-visible:bg-background"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as LeadStatus | "all")}
        >
          <SelectTrigger className="h-10 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="h-10 w-37.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="h-11 px-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Name
              </TableHead>
              <TableHead className="h-11 px-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Email
              </TableHead>
              <TableHead className="hidden h-11 px-5 text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                Phone
              </TableHead>
              <TableHead className="hidden h-11 px-5 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                Source
              </TableHead>
              <TableHead className="hidden h-11 px-5 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                Captured
              </TableHead>
              <TableHead className="h-11 px-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="h-11 px-5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Conversation
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>
    </div>
  );
}
