"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConvexAuth, useMutation } from "convex/react";
import {
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  MousePointerClick,
  Rocket,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function SetupPage() {
  const { isAuthenticated } = useConvexAuth();
  const [workspaceId, setWorkspaceId] = useState<Id<"workspaces"> | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const ensureWorkspace = useMutation(api.workspaces.ensureForCurrentUser);

  useEffect(() => {
    setOrigin(window.location.origin);
    if (isAuthenticated) {
      ensureWorkspace().then((ws) => setWorkspaceId(ws._id));
    }
  }, [isAuthenticated, ensureWorkspace]);

  if (!workspaceId || !origin) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6 lg:p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-5 w-96" />
        <Skeleton className="mt-8 h-40 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-32 w-full rounded-2xl" />
      </div>
    );
  }

  const snippet = `<src async src="${origin}/loader.js?app_id=${workspaceId}"></script>`;
  const demoUrl = `${origin}/demo.html?app_id=${workspaceId}`;

  return (
    <div className="mx-auto w-full max-w-3xl p-6 lg:p-8">
      <div className="flex flex-col gap-1.5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Code2 className="size-5" />
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Install your messenger
        </h1>
        <p className="text-muted-foreground">
          Add MyChat to your site in three quick steps - no engineering project
          required.
        </p>
      </div>

      {/* Install Steps */}
      <div className="mt-8 flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-start gap-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand to-brand-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_var(--brand)]">
              1
            </span>
            <div className="min-w-0 flex-1s">
              <h2 className="text-base- font-medium text-muted-foreground">
                Copy your install snippet
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Paste this just before the closing{" "}
                <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.8em] text-foreground">
                  &lt;/body&gt;
                </code>{" "}
                is your worspace id - it&apos;s safe to expose publicly
              </p>

              {/* Code block */}
              <div className="bg-ink group relative mt-4 overflow-hidden rounded-xl shadow-elevated">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
                  <span>
                    <span className="flex gap-1.5" aria-hidden>
                      <span className="size-2.5 rounded-full bg-white/20" />
                      <span className="size-2.5 rounded-full bg-white/20" />
                      <span className="size-2.5 rounded-full bg-white/20" />
                    </span>
                    index.html
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 px-2.5 text-white/70 hover:bg-white/10 hover:text-white"
                    onClick={async () => {
                      await navigator.clipboard.writeText(snippet);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    {copied ? (
                      <>
                        <Check className="size-3.5 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="overflow-x-auto px-4 py-4">
                  <code className="font-mono text-[13px] leading-relaxed text-white/90 whitespace-pre-wrap break-all">
                    {snippet}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 - paste it on your site */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-start gap-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand to-brand-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_var(--brand)]">
              2
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-medium tracking-tight">
                Drop it on your website
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Add the snippet to your site&apos;s HTML, template, or layout -
                anywhere is loads on every page. The messenger bubble appears in
                the bottom corner automatically
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 - try it live */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-start gap-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_var(--brand)]">
              3
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-medium tracking-tight">
                Try it right now
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Open the bundled demo page - a stand-in for a customer website
                with the snippet already wired up to you <code>app_id</code>
              </p>

              {/* Demo link card */}

              {/* Demo link card */}
              <div className="mt-4 flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Rocket className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">Live demo site</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      The messenger, running with your workspace.
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  className="bg-linear-to-br from-brand to-brand-2 text-white shadow-[0_8px_24px_-8px_var(--brand)] hover:opacity-95 sm:shrink-0"
                >
                  <a href={demoUrl} target="_blank" rel="noreferrer">
                    Open demo site
                    <ArrowUpRight className="size-4" />
                  </a>
                </Button>
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border bg-card p-3.5">
                <MousePointerClick className="mt-0.5 size-4 shrink-0 text-brand" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Send a message from the bubble there, then come back to the{" "}
                  <span className="font-medium text-foreground">Inbox</span> —
                  it appears live. Reply from the Inbox and it shows up in the
                  bubble instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
