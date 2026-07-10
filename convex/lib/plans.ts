// ─────────────────────────────────────────────────────────────────────────────
// Plan / feature / limit definitions (Free / Pro / Scale).
//
// These are the CANONICAL limits Convex enforces on the anonymous widget path.
// Clerk Billing carries the plans + checkout, but Clerk does not meter usage —
// Convex is the enforcement boundary. The webhook mirror writes a snapshot of
// these limits onto each `subscriptions` row (so a plan-definition change does
// not silently re-gate existing subscribers until their next webhook event);
// this file is the source those snapshots are derived from + the fallback for
// orgs with no subscription row yet (treated as Free).
//
// Plan slugs match the Clerk Billing plan slugs ("free_org" | "pro" | "scale").
// These are the exact slugs `has({ plan: '<slug>' })` checks against. "free_org"
// is Clerk's auto-created default org plan (created when org billing is enabled);
// we reuse it as Free rather than minting a second free plan.
// The `cplan_…` ids differ dev vs prod — never hardcode them here; map by slug.
//
// Seat caps stay <= 20 on Free/Pro to avoid Clerk's paid B2B add-on
// (Locked-decision #2). Scale is capped at 20 here for MVP ("contact us" above).
// ─────────────────────────────────────────────────────────────────────────────

export const PLAN_SLUGS = ["free_org", "pro", "scale"] as const;
export type PlanSlug = (typeof PLAN_SLUGS)[number];

// Feature flags gated by plan. Mirrored onto `subscriptions.features` and read
// by both Convex (server-side enforcement) and the client (`has()` for UI).
export const FEATURES = [
  "ai_messages",
  "website_crawl",
  "kb_documents",
  "helpdesk",
  "proactive_messages",
  "remove_branding",
] as const;
export type Feature = (typeof FEATURES)[number];

export type PlanLimits = {
  // Mirrors the `subscriptions.limits` object shape exactly.
  aiMessagesPerMonth: number;
  kbDocuments: number;
  crawlPages: number;
  seats: number;
};

export type PlanDefinition = {
  slug: PlanSlug;
  name: string;
  features: Feature[];
  limits: PlanLimits;
};

export const PLANS: Record<PlanSlug, PlanDefinition> = {
  free_org: {
    slug: "free_org",
    name: "Free",
    features: ["ai_messages", "kb_documents", "helpdesk"],
    limits: {
      aiMessagesPerMonth: 100,
      kbDocuments: 10,
      crawlPages: 0,
      seats: 2,
    },
  },
  pro: {
    slug: "pro",
    name: "Pro",
    features: [
      "ai_messages",
      "website_crawl",
      "kb_documents",
      "helpdesk",
      "proactive_messages",
      "remove_branding",
    ],
    limits: {
      aiMessagesPerMonth: 2000,
      kbDocuments: 200,
      crawlPages: 200,
      seats: 10,
    },
  },
  scale: {
    slug: "scale",
    name: "Scale",
    features: [
      "ai_messages",
      "website_crawl",
      "kb_documents",
      "helpdesk",
      "proactive_messages",
      "remove_branding",
    ],
    limits: {
      aiMessagesPerMonth: 20000,
      kbDocuments: 2000,
      crawlPages: 2000,
      // <= 20 keeps us off Clerk's paid B2B add-on for MVP (Locked-decision #2).
      seats: 20,
    },
  },
};

// The plan an org falls back to when it has no `subscriptions` row yet (e.g.
// brand-new org before the first billing webhook lands). Free is the floor.
export const DEFAULT_PLAN_SLUG: PlanSlug = "free_org";

export function isPlanSlug(value: string): value is PlanSlug {
  return (PLAN_SLUGS as readonly string[]).includes(value);
}

// Resolve a plan definition from an arbitrary slug string (webhook-supplied),
// defaulting to Free for unknown/absent slugs so enforcement always has limits.
export function getPlan(slug: string | null | undefined): PlanDefinition {
  if (slug && isPlanSlug(slug)) return PLANS[slug];
  return PLANS[DEFAULT_PLAN_SLUG];
}

export function planLimits(slug: string | null | undefined): PlanLimits {
  return getPlan(slug).limits;
}

export function planFeatures(slug: string | null | undefined): Feature[] {
  return getPlan(slug).features;
}

export function planHasFeature(
  slug: string | null | undefined,
  feature: Feature,
): boolean {
  return getPlan(slug).features.includes(feature);
}
