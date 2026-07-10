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
    if (!active) return;

    if (active.ok) {
      healingRef.current = false;
      return;
    }

    if (active.code === "WORKSPACE_NOT_FOUND") {
      console.log("NOWORKSPACE FOUND");
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
  });

  return <>{children}</>;
}
