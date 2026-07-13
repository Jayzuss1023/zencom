"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { div, span } from "motion/react-client";

export type WhoamiResult = {
  authenticated: boolean;
  subject: string | null;
  orgId: string | null;
  orgRole: string | null;
  orgSlug: string | null;
  hasActiveOrg: boolean;
};

export function ClaimDebugPanel({
  whoami,
}: {
  whoami: WhoamiResult | undefined;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Claim verification (dev)</CardTitle>
          {whoami && (
            <Badge variant={whoami.hasActiveOrg ? "default" : "secondary"}>
              {whoami.hasActiveOrg ? "active org" : "no active org"}
            </Badge>
          )}
        </div>
        <CardDescription>
          Live output of <code className="font-mono">debug.whoami</code> - the
          org claims as Convex sees them on the JWT
        </CardDescription>
      </CardHeader>

      <CardContent>
        {whoami === undefined ? (
          <div>
            <Skeleton className-="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : (
          <div>
            <ClaimRow
              label="authenticated"
              value={String(whoami.authenticated)}
            />
            <ClaimRow label="subject" value={whoami.subject} />
            <ClaimRow label="orgId" value={whoami.orgId} />
            <ClaimRow label="orgRole" value={whoami.orgRole} />
            <ClaimRow label="orgSlug" value={whoami.orgSlug} />
            <ClaimRow
              label="hasActiveOrg"
              value={String(whoami.hasActiveOrg)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClaimRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 last:border-b-0">
      <span className="text-muted-foreground text-sm font-medium">{label}</span>
      <span className="text-muted-foreground">
        {value === null ? <span>null</span> : value}
      </span>
    </div>
  );
}
