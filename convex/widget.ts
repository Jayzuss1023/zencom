import { v } from "convex/values";
import { query, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const PLAN_SLUGS = ["free_org", "pro", "scale"] as const;

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

export type PlanSlug = (typeof PLAN_SLUGS)[number];

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

export const DEFAULT_PLAN_SLUG: PlanSlug = "free_org";

export function isPlanSlug(value: string): value is PlanSlug {
  return (PLAN_SLUGS as readonly string[]).includes(value);
}

export function getPlan(slug: string | null | undefined): PlanDefinition {
  if (slug && isPlanSlug(slug)) return PLANS[slug];
  return PLANS[DEFAULT_PLAN_SLUG];
}

export function planFeatures(slug: string | null | undefined): Feature[] {
  return getPlan(slug).features;
}

const DEFAULT_SETTINGS = {
  proactiveMessage: {
    enabled: false,
    delaySeconds: 10,
    text: "Hi there! 👋 Can we help you with anything?",
  },
  leadCapture: {
    enabled: false,
    requiredFields: ["email"] as Array<
      "firstName" | "lastName" | "email" | "phone"
    >,
  },
  faqEnabled: true,
};

const DEFAULT_APPEARANCE = {
  themeColor: "#0F172A", // slate-900 header / accent
  buttonColor: "#4F46E5", // indigo-600 launcher bubble (saturated, high-contrast)
  cornerRadius: 16,
  title: "Chat with us",
  titleColor: "#FFFFFF",
  position: "bottom-right" as const,
  bottomMargin: 20,
  sideMargin: 20,
  notificationSound: true,
};

export async function resolveAppearance(
  ctx: QueryCtx,
  workspaceId: Id<"workspaces">,
): Promise<{
  themeColor: string;
  buttonColor: string;
  cornerRadius: number;
  title: string;
  titleColor: string;
  logoUrl: string | null;
  position: "bottom-right" | "bottom-left";
  bottomMargin: number;
  sideMargin: number;
  notificationSound: boolean;
}> {
  const row: Doc<"widgetAppearance"> | null = await ctx.db
    .query("widgetAppearance")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .unique();

  if (!row) {
    return { ...DEFAULT_APPEARANCE, logoUrl: null };
  }

  const logoUrl = row.logoStorageId
    ? await ctx.storage.getUrl(row.logoStorageId)
    : null;

  return {
    themeColor: row.themeColor,
    buttonColor: row.buttonColor,
    cornerRadius: row.cornerRadius,
    title: row.title,
    titleColor: row.titleColor,
    logoUrl,
    position: row.position,
    bottomMargin: row.bottomMargin,
    sideMargin: row.sideMargin,
    notificationSound: row.notificationSound,
  };
}

const appearanceShape = v.object({
  themeColor: v.string(),
  buttonColor: v.string(),
  cornerRadius: v.number(),
  title: v.string(),
  titleColor: v.string(),
  logoUrl: v.union(v.string(), v.null()),
  position: v.union(v.literal("bottom-right"), v.literal("bottom-left")),
  bottomMargin: v.number(),
  sideMargin: v.number(),
  notificationSound: v.boolean(),
});

const settingsShape = v.object({
  proactiveMessage: v.object({
    enabled: v.boolean(),
    delaySeconds: v.number(),
    text: v.string(),
  }),
  leadCapture: v.object({
    enabled: v.boolean(),
    requiredFields: v.array(
      v.union(
        v.literal("firstName"),
        v.literal("lastName"),
        v.literal("email"),
        v.literal("phone"),
      ),
    ),
  }),
  faqEnabled: v.boolean(),
});

async function resolveRemoveBranding(
  ctx: QueryCtx,
  workspaceId: Id<"workspaces">,
): Promise<boolean> {
  const sub: Doc<"subscriptions"> | null = await ctx.db
    .query("subscriptions")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .unique();

  // No subscription row ⇒ implicit Free ⇒ branding shown.
  if (!sub) return false;

  return planFeatures(sub.planSlug).includes("remove_branding");
}

export const getConfig = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.union(
    v.object({
      workspaceName: v.string(),
      appearance: appearanceShape,
      settings: settingsShape,
      // true ⇒ paid plan (Pro/Scale): hide the "Powered by" footer. Defaults
      // to false (Free) so the anonymous widget shows branding unless the
      // workspace's mirrored plan grants `remove_branding`.
      removeBranding: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, { workspaceId }) => {
    const ws = await ctx.db.get(workspaceId);
    if (!ws) return null;

    const appearance = await resolveAppearance(ctx, workspaceId);

    const settingsRow = await ctx.db
      .query("widgetSettings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .unique();

    const settings = settingsRow
      ? {
          proactiveMessage: settingsRow.proactiveMessage,
          leadCapture: settingsRow.leadCapture,
          faqEnabled: settingsRow.faqEnabled,
        }
      : DEFAULT_SETTINGS;

    const removeBranding = await resolveRemoveBranding(ctx, workspaceId);

    return {
      workspaceName: ws.name, // safe: same field getPublic already exposes
      appearance,
      settings,
      removeBranding,
    };
  },
});
