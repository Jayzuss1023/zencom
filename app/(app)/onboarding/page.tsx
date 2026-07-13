"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreateOrganization, useOrganization } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { AlertCircle, Building2, Check, Loader2, Sparkles } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandMark } from "@/components/hero-section/brand-mark";
import { ClaimDebugPanel } from "@/components/claim-bug-panel";

export default function OnboardingPage() {
  const router = useRouter();

  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isLoading: convexAuthLoading, isAuthenticated } = useConvexAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();

  const hasActiveOrg = Boolean(organization?.id);
  const whoami = useQuery(api.debug.whoami);
  const createWorkspaceForOrg = useMutation(
    api.onboarding.createWorkspaceForOrg,
  );

  useEffect(() => {
    // Will only fire if authenticated or organization has been created on Clerk's end
    if (!isAuthenticated) return;
    if (!hasActiveOrg) return;
    if (!whoami?.hasActiveOrg) return; // Wait for the claim to reach Convex
    if (provisioning) return;

    let cancelled = false;

    createWorkspaceForOrg()
      .then(() => {
        if (!cancelled) router.replace("/dashboard");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setProvisioning(false);
        setError(
          e instanceof Error ? e.message : "Failed to provision workspace",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    hasActiveOrg,
    whoami,
    provisioning,
    createWorkspaceForOrg,
    router,
  ]);

  if (convexAuthLoading || !orgLoaded) {
    return (
      <OnboardingShell>
        <OnboardingShellCard>
          <div className="flex items-center gap-4">
            <div>
              <Loader2 className="size-5 animate-spin" />
            </div>
            <div>
              <h2>Loading...</h2>
              <p>Checking your session and organization.</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </OnboardingShellCard>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell>
      <div className="flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_10px_30px_-8px_var(--brand)]">
          <Building2 className="size-7" />
        </span>
        <Badge
          variant="secondary"
          className="mt-6 gap-1.5 bg-brand/10 text-brand"
        >
          <Sparkles className="size-3" />
          Step 1 of 1
        </Badge>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
          Create your workspace
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Your organization is your team&apos;s workspace. You can invite
          teammates and manage billing once it&apos;s set up.
        </p>
      </div>

      <div className="flex justify-center">
        <CreateOrganization
          skipInvitationScreen
          afterCreateOrganizationUrl="/onboarding"
          appearance={{
            variables: {
              colorPrimary: "#5746f0",
              colorForeground: "#0a0918",
              colorMutedForeground: "#6b7280",
              borderRadius: "0.75rem",
              fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            },
            elements: {
              rootBox: "w-full",
              card: "shadow-card rounded-2xl border border-border",
              formButtonPrimary:
                "bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_8px_24px_-8px_var(--brand)] hover:opacity-95 normal-case",
            },
          }}
        />
      </div>
      <ClaimDebugPanel whoami={whoami} />
    </OnboardingShell>
  );
}

function OnboardingShellCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
      {children}
    </div>
  );
}

function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-dotgrid absolute inset-0 opacity-[0.5] mask-[radial-gradient(60%_45%_at_50%_30%,black,transparent)]" />
        <div className="absolute -top-32 left-1/2 size-128 -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]" />
      </div>
      <div className="relative mx-auto flex flex-col w-full max-w-xl gap-6">
        <div className="flex justify-center">
          <BrandMark />
        </div>
        {children}
      </div>
    </div>
  );
}
