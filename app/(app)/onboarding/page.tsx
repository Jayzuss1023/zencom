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
import { div } from "motion/react-client";

export default function OnboardingPage() {
  const { isLoading: convexAuthLoading, isAuthenticated } = useConvexAuth();

  //   if (convexAuthLoading) {
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
  //   }
  //   return <div>This is the onboarding page</div>;
}

function OnboardingShellCard({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-dotgrid absolute inset-0 opacity-[0.5] mask-[radial-gradient(60%_45%_at_50%_30%,black,transparent)]" />
        <div className="absolute -top-32 left-1/2 size-128 -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]" />
      </div>
      <div className="relative mx-auto flex w-full max-w-xl">
        <div>
          <BrandMark />
        </div>
        {children}
      </div>
    </div>
  );
}
