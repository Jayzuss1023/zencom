"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";

export function OrgGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const active = useQuery(api.workspaces.getActiveWorkspace);

  const provisionWorkspace = useMutation(api.onboarding.createWorkspaceForOrg);
  const healingRef = useRef(false);

  useEffect(() => {
    // Convex Auth flow: Checked Clerk's Server for Organization and found none
    if (!active) return;

    if (active.ok) {
      healingRef.current = false;
      return;
    }

    if (active.code === "WORKSPACE_NOT_FOUND") {
      if (healingRef.current) return;
      healingRef.current = true;

      void provisionWorkspace().catch(() => {
        healingRef.current = false;
        router.replace("/onboarding");
      });
    }

    if (active.code === "NO_ACTIVE_ORG") {
      router.replace("/onboarding");
    }
  }, [active, provisionWorkspace, router]);

  // Auth still hydrating, or query in flight, or a redirect is imminent.
  if (authLoading || active === undefined || !active.ok) {
    return (
      <div className="grid min-h-[calc(100svh-53px)] place-items-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Loader2 className="size-5 animate-spin" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Loading workspace
            </p>
            <p className="text-sm text-muted-foreground">
              Getting your dashboard ready…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
