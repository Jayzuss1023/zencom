// import { mutation, query } from "./_generated/server";
// import type { QueryCtx } from "./_generated/server";
// import { ConvexError, v } from "convex/values";
// import { requireAdmin } from "./lib/auth";
// import { rateLimiter, rlKey } from "./lib/ratelimit";
// import { planFeatures } from "./lib/plans";
// import type { Doc, Id } from "./_generated/dataModel";

// // ─────────────────────────────────────────────────────────────────────────────
// // Phase 6 — WIDGET config + lead capture.
// //
// // Three audiences in this file:
// //   1. PUBLIC (anonymous iframe widget): `getConfig`, `captureLead`. Scoped by
// //      the public `workspaceId` (the embed app_id). NEVER leaks org/owner ids.
// //      `getConfig` always returns sensible DEFAULTS so a brand-new workspace
// //      with no appearance/settings row still renders a usable widget.
// //   2. AUTHED admin (dashboard customizer): `getAppearance` / `getSettings`
// //      (read) and `updateAppearance` / `updateSettings` (write, validated).
// //
// // The companion vanilla `loader.js` does NOT speak Convex client — it styles the
// // launcher bubble from the CORS-enabled `GET /widget-config` HTTP endpoint in
// // http.ts, which reuses `resolveAppearance` below for an identical shape.
// // ─────────────────────────────────────────────────────────────────────────────

// // ── DEFAULTS ─────────────────────────────────────────────────────────────────
// // Returned when no widgetAppearance / widgetSettings row exists yet. Kept here
// // (single source of truth) so the public query, the authed reader, and the HTTP
// // endpoint all agree.
// const DEFAULT_APPEARANCE = {
//   themeColor: "#0F172A", // slate-900 header / accent
//   buttonColor: "#4F46E5", // indigo-600 launcher bubble (saturated, high-contrast)
//   cornerRadius: 16,
//   title: "Chat with us",
//   titleColor: "#FFFFFF",
//   position: "bottom-right" as const,
//   bottomMargin: 20,
//   sideMargin: 20,
//   notificationSound: true,
// };

// const DEFAULT_SETTINGS = {
//   proactiveMessage: {
//     enabled: false,
//     delaySeconds: 10,
//     text: "Hi there! 👋 Can we help you with anything?",
//   },
//   leadCapture: {
//     enabled: false,
//     requiredFields: ["email"] as Array<
//       "firstName" | "lastName" | "email" | "phone"
//     >,
//   },
//   faqEnabled: true,
// };

// // ── VALIDATION HELPERS ───────────────────────────────────────────────────────
// const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
// const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// const CORNER_RADIUS_MIN = 0;
// const CORNER_RADIUS_MAX = 32;
// const MARGIN_MIN = 0;
// const MARGIN_MAX = 120;
// const PROACTIVE_DELAY_MIN = 0;
// const PROACTIVE_DELAY_MAX = 600; // 10 minutes
// const PROACTIVE_TEXT_MAX = 280;

// const NAME_MAX = 80;
// const EMAIL_MAX = 254; // RFC 5321 local+domain cap
// const PHONE_MAX = 32;

// function assertHex(value: string, field: string): void {
//   if (!HEX_COLOR.test(value)) {
//     throw new ConvexError({
//       code: "INVALID_COLOR",
//       message: `${field} must be a hex color like #4F46E5 (got ${value}).`,
//     });
//   }
// }

// function assertRange(
//   value: number,
//   min: number,
//   max: number,
//   field: string,
// ): void {
//   if (!Number.isFinite(value) || value < min || value > max) {
//     throw new ConvexError({
//       code: "OUT_OF_RANGE",
//       message: `${field} must be between ${min} and ${max} (got ${value}).`,
//     });
//   }
// }

// // Resolve the appearance for a workspace, falling back to defaults. Resolves the
// // logo storage id to a URL (URLs expire, so we never persist them). Shared by
// // the public `getConfig` query and the authed `getAppearance` reader. (The CORS
// // HTTP endpoint in http.ts calls `getConfig` via runQuery rather than this
// // helper, so it gets the identical shape without a ctx-type mismatch.)
// export async function resolveAppearance(
//   ctx: QueryCtx,
//   workspaceId: Id<"workspaces">,
// ): Promise<{
//   themeColor: string;
//   buttonColor: string;
//   cornerRadius: number;
//   title: string;
//   titleColor: string;
//   logoUrl: string | null;
//   position: "bottom-right" | "bottom-left";
//   bottomMargin: number;
//   sideMargin: number;
//   notificationSound: boolean;
// }> {
//   const row: Doc<"widgetAppearance"> | null = await ctx.db
//     .query("widgetAppearance")
//     .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
//     .unique();

//   if (!row) {
//     return { ...DEFAULT_APPEARANCE, logoUrl: null };
//   }

//   const logoUrl = row.logoStorageId
//     ? await ctx.storage.getUrl(row.logoStorageId)
//     : null;

//   return {
//     themeColor: row.themeColor,
//     buttonColor: row.buttonColor,
//     cornerRadius: row.cornerRadius,
//     title: row.title,
//     titleColor: row.titleColor,
//     logoUrl,
//     position: row.position,
//     bottomMargin: row.bottomMargin,
//     sideMargin: row.sideMargin,
//     notificationSound: row.notificationSound,
//   };
// }

// const appearanceShape = v.object({
//   themeColor: v.string(),
//   buttonColor: v.string(),
//   cornerRadius: v.number(),
//   title: v.string(),
//   titleColor: v.string(),
//   logoUrl: v.union(v.string(), v.null()),
//   position: v.union(v.literal("bottom-right"), v.literal("bottom-left")),
//   bottomMargin: v.number(),
//   sideMargin: v.number(),
//   notificationSound: v.boolean(),
// });

// // Resolve whether the workspace's plan removes the "Powered by" branding.
// // Reads the `subscriptions` mirror (webhook-written) by workspace and checks the
// // plan's feature list. Defaults to FALSE (Free shows branding) when no
// // subscription row exists yet. The widget is anonymous (no Clerk), so this MUST
// // come from Convex's mirror, not Clerk's `has()`.
// async function resolveRemoveBranding(
//   ctx: QueryCtx,
//   workspaceId: Id<"workspaces">,
// ): Promise<boolean> {
//   const sub: Doc<"subscriptions"> | null = await ctx.db
//     .query("subscriptions")
//     .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
//     .unique();

//   // No subscription row ⇒ implicit Free ⇒ branding shown.
//   if (!sub) return false;

//   return planFeatures(sub.planSlug).includes("remove_branding");
// }

// const settingsShape = v.object({
//   proactiveMessage: v.object({
//     enabled: v.boolean(),
//     delaySeconds: v.number(),
//     text: v.string(),
//   }),
//   leadCapture: v.object({
//     enabled: v.boolean(),
//     requiredFields: v.array(
//       v.union(
//         v.literal("firstName"),
//         v.literal("lastName"),
//         v.literal("email"),
//         v.literal("phone"),
//       ),
//     ),
//   }),
//   faqEnabled: v.boolean(),
// });

// // ── PUBLIC (widget iframe) ───────────────────────────────────────────────────

// // Full config bundle for the anonymous iframe widget: workspace name, resolved
// // appearance (logo URL resolved), and behavior settings. ALWAYS returns a
// // usable shape with defaults if rows are absent. Returns null only when the
// // workspaceId doesn't resolve to a real workspace (bad embed app_id).
// export const getConfig = query({
//   args: { workspaceId: v.id("workspaces") },
//   returns: v.union(
//     v.object({
//       workspaceName: v.string(),
//       appearance: appearanceShape,
//       settings: settingsShape,
//       // true ⇒ paid plan (Pro/Scale): hide the "Powered by" footer. Defaults
//       // to false (Free) so the anonymous widget shows branding unless the
//       // workspace's mirrored plan grants `remove_branding`.
//       removeBranding: v.boolean(),
//     }),
//     v.null(),
//   ),
//   handler: async (ctx, { workspaceId }) => {
//     const ws = await ctx.db.get(workspaceId);
//     if (!ws) return null;

//     const appearance = await resolveAppearance(ctx, workspaceId);

//     const settingsRow = await ctx.db
//       .query("widgetSettings")
//       .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
//       .unique();

//     const settings = settingsRow
//       ? {
//           proactiveMessage: settingsRow.proactiveMessage,
//           leadCapture: settingsRow.leadCapture,
//           faqEnabled: settingsRow.faqEnabled,
//         }
//       : DEFAULT_SETTINGS;

//     const removeBranding = await resolveRemoveBranding(ctx, workspaceId);

//     return {
//       workspaceName: ws.name, // safe: same field getPublic already exposes
//       appearance,
//       settings,
//       removeBranding,
//     };
//   },
// });

// // PUBLIC (widget): capture a lead. Rate-limited per (workspaceId, visitorId).
// // Validates email + bounds all field lengths. Upserts so a visitor editing/
// // resubmitting their info doesn't create duplicate rows (dedup by visitorId,
// // else by email within the workspace).
// export const captureLead = mutation({
//   args: {
//     workspaceId: v.id("workspaces"),
//     visitorId: v.string(),
//     conversationId: v.optional(v.id("conversations")),
//     firstName: v.optional(v.string()),
//     lastName: v.optional(v.string()),
//     email: v.string(),
//     phone: v.optional(v.string()),
//   },
//   returns: v.object({ leadId: v.id("leads") }),
//   handler: async (ctx, args) => {
//     const ws = await ctx.db.get(args.workspaceId);
//     if (!ws) {
//       throw new ConvexError({
//         code: "UNKNOWN_WORKSPACE",
//         message: "Unknown workspace.",
//       });
//     }

//     // Throttle scripted floods of the leads table (5/hr, burst 3).
//     await rateLimiter.limit(ctx, "leadCapture", {
//       key: rlKey(args.workspaceId, args.visitorId),
//       throws: true,
//     });

//     const email = args.email.trim().toLowerCase();
//     if (!EMAIL_RE.test(email) || email.length > EMAIL_MAX) {
//       throw new ConvexError({
//         code: "INVALID_EMAIL",
//         message: "Please enter a valid email address.",
//       });
//     }

//     const firstName = args.firstName?.trim().slice(0, NAME_MAX) || undefined;
//     const lastName = args.lastName?.trim().slice(0, NAME_MAX) || undefined;
//     const phone = args.phone?.trim().slice(0, PHONE_MAX) || undefined;

//     // If this conversation belongs to a different workspace, drop the link
//     // rather than trusting the client-supplied id.
//     let conversationId = args.conversationId;
//     if (conversationId) {
//       const conv = await ctx.db.get(conversationId);
//       if (!conv || conv.workspaceId !== args.workspaceId) {
//         conversationId = undefined;
//       }
//     }

//     // Upsert by VISITOR only. We intentionally do NOT dedupe by email on this
//     // public path: a caller must not be able to overwrite another visitor's lead
//     // by submitting that visitor's email (cross-visitor tampering). Email-based
//     // merging, if wanted, belongs to an authed/admin reconciliation path.
//     const existing = await ctx.db
//       .query("leads")
//       .withIndex("by_workspace_visitor", (q) =>
//         q.eq("workspaceId", args.workspaceId).eq("visitorId", args.visitorId),
//       )
//       .first();

//     if (existing) {
//       await ctx.db.patch(existing._id, {
//         // Fill/refresh contact fields; never downgrade a status the dashboard
//         // already advanced (new → contacted → closed).
//         ...(firstName ? { firstName } : {}),
//         ...(lastName ? { lastName } : {}),
//         ...(phone ? { phone } : {}),
//         email,
//         ...(conversationId ? { conversationId } : {}),
//       });
//       return { leadId: existing._id };
//     }

//     const leadId = await ctx.db.insert("leads", {
//       workspaceId: args.workspaceId,
//       conversationId,
//       visitorId: args.visitorId,
//       firstName,
//       lastName,
//       email,
//       phone,
//       source: "widget",
//       status: "new",
//       createdAt: Date.now(),
//     });
//     return { leadId };
//   },
// });

// // ── AUTHED admin (dashboard customizer) ──────────────────────────────────────

// // Read the appearance for the customizer. Returns resolved defaults (logoUrl
// // null) when no row exists, so the form has stable initial values.
// export const getAppearance = query({
//   args: {},
//   returns: appearanceShape,
//   handler: async (ctx) => {
//     const { workspace } = await requireAdmin(ctx);
//     return await resolveAppearance(ctx, workspace._id);
//   },
// });

// // List active team members with their resolved avatar info for the customizer's
// // per-member avatar editor. Admin-gated. Returns the custom widget avatar URL
// // (Convex storage) when set, plus the Clerk image URL fallback, so the editor
// // can show exactly what the widget will display for each teammate.
// export const listTeamAvatars = query({
//   args: {},
//   returns: v.array(
//     v.object({
//       clerkUserId: v.string(),
//       name: v.string(),
//       role: v.union(v.literal("admin"), v.literal("support")),
//       clerkImageUrl: v.union(v.string(), v.null()),
//       customAvatarUrl: v.union(v.string(), v.null()),
//     }),
//   ),
//   handler: async (ctx) => {
//     const { workspace } = await requireAdmin(ctx);
//     const members = await ctx.db
//       .query("workspaceMembers")
//       .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
//       .collect();

//     const active = members
//       .filter((m) => m.status === "active")
//       .sort((a, b) => a.name.localeCompare(b.name));

//     return await Promise.all(
//       active.map(async (m) => ({
//         clerkUserId: m.clerkUserId,
//         name: m.name,
//         role: m.role,
//         clerkImageUrl: m.imageUrl ?? null,
//         customAvatarUrl: m.customAvatarStorageId
//           ? await ctx.storage.getUrl(m.customAvatarStorageId)
//           : null,
//       })),
//     );
//   },
// });

// // Set or clear a team member's custom widget avatar. The `avatarStorageId` must
// // already be a validated image id (from finalizeImageUpload); `null` clears it.
// // Admin-gated AND workspace-scoped — you can only edit members of your own
// // workspace. Replacing or clearing deletes the previous blob to avoid orphans.
// export const setMemberAvatar = mutation({
//   args: {
//     clerkUserId: v.string(),
//     avatarStorageId: v.union(v.id("_storage"), v.null()),
//   },
//   returns: v.object({ ok: v.literal(true) }),
//   handler: async (ctx, args) => {
//     const { identity, workspace } = await requireAdmin(ctx);

//     const member = await ctx.db
//       .query("workspaceMembers")
//       .withIndex("by_org_user", (q) =>
//         q.eq("clerkOrgId", identity.orgId).eq("clerkUserId", args.clerkUserId),
//       )
//       .unique();

//     if (
//       !member ||
//       member.workspaceId !== workspace._id ||
//       member.status !== "active"
//     ) {
//       throw new ConvexError({
//         code: "MEMBER_NOT_FOUND",
//         message: "That member isn't part of this workspace.",
//       });
//     }

//     // Clean up the prior blob when replacing or clearing.
//     if (
//       member.customAvatarStorageId &&
//       member.customAvatarStorageId !== args.avatarStorageId
//     ) {
//       await ctx.storage.delete(member.customAvatarStorageId);
//     }

//     await ctx.db.patch(member._id, {
//       customAvatarStorageId: args.avatarStorageId ?? undefined,
//     });
//     return { ok: true as const };
//   },
// });

// export const getSettings = query({
//   args: {},
//   returns: settingsShape,
//   handler: async (ctx) => {
//     const { workspace } = await requireAdmin(ctx);
//     const row = await ctx.db
//       .query("widgetSettings")
//       .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
//       .unique();
//     return row
//       ? {
//           proactiveMessage: row.proactiveMessage,
//           leadCapture: row.leadCapture,
//           faqEnabled: row.faqEnabled,
//         }
//       : DEFAULT_SETTINGS;
//   },
// });

// // Update (upsert) appearance. All values validated server-side: hex colors,
// // radius/margin ranges, position enum (the enum is enforced by the arg
// // validator). The logoStorageId must already be a validated _storage id
// // (finalizeImageUpload). Passing logoStorageId: null clears the logo.
// export const updateAppearance = mutation({
//   args: {
//     themeColor: v.string(),
//     buttonColor: v.string(),
//     cornerRadius: v.number(),
//     title: v.string(),
//     titleColor: v.string(),
//     logoStorageId: v.optional(v.union(v.id("_storage"), v.null())),
//     position: v.union(v.literal("bottom-right"), v.literal("bottom-left")),
//     bottomMargin: v.number(),
//     sideMargin: v.number(),
//     notificationSound: v.boolean(),
//   },
//   returns: v.object({ ok: v.literal(true) }),
//   handler: async (ctx, args) => {
//     const { workspace } = await requireAdmin(ctx);

//     assertHex(args.themeColor, "themeColor");
//     assertHex(args.buttonColor, "buttonColor");
//     assertHex(args.titleColor, "titleColor");
//     assertRange(
//       args.cornerRadius,
//       CORNER_RADIUS_MIN,
//       CORNER_RADIUS_MAX,
//       "cornerRadius",
//     );
//     assertRange(args.bottomMargin, MARGIN_MIN, MARGIN_MAX, "bottomMargin");
//     assertRange(args.sideMargin, MARGIN_MIN, MARGIN_MAX, "sideMargin");

//     const title = args.title.trim().slice(0, 60) || DEFAULT_APPEARANCE.title;

//     const existing = await ctx.db
//       .query("widgetAppearance")
//       .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
//       .unique();

//     // logoStorageId: undefined ⇒ leave as-is; null ⇒ clear; id ⇒ set.
//     const logoPatch =
//       args.logoStorageId === undefined
//         ? {}
//         : { logoStorageId: args.logoStorageId ?? undefined };

//     const fields = {
//       themeColor: args.themeColor,
//       buttonColor: args.buttonColor,
//       cornerRadius: args.cornerRadius,
//       title,
//       titleColor: args.titleColor,
//       position: args.position,
//       bottomMargin: args.bottomMargin,
//       sideMargin: args.sideMargin,
//       notificationSound: args.notificationSound,
//     };

//     if (existing) {
//       await ctx.db.patch(existing._id, { ...fields, ...logoPatch });
//     } else {
//       await ctx.db.insert("widgetAppearance", {
//         workspaceId: workspace._id,
//         ...fields,
//         logoStorageId:
//           args.logoStorageId === undefined || args.logoStorageId === null
//             ? undefined
//             : args.logoStorageId,
//       });
//     }
//     return { ok: true as const };
//   },
// });

// export const updateSettings = mutation({
//   args: {
//     proactiveMessage: v.object({
//       enabled: v.boolean(),
//       delaySeconds: v.number(),
//       text: v.string(),
//     }),
//     leadCapture: v.object({
//       enabled: v.boolean(),
//       requiredFields: v.array(
//         v.union(
//           v.literal("firstName"),
//           v.literal("lastName"),
//           v.literal("email"),
//           v.literal("phone"),
//         ),
//       ),
//     }),
//     faqEnabled: v.boolean(),
//   },
//   returns: v.object({ ok: v.literal(true) }),
//   handler: async (ctx, args) => {
//     const { workspace } = await requireAdmin(ctx);

//     assertRange(
//       args.proactiveMessage.delaySeconds,
//       PROACTIVE_DELAY_MIN,
//       PROACTIVE_DELAY_MAX,
//       "proactiveMessage.delaySeconds",
//     );

//     // Bound + dedupe values; the union literals are already enforced by the arg
//     // validator, but we still cap the array and proactive text length.
//     const proactiveText = args.proactiveMessage.text
//       .trim()
//       .slice(0, PROACTIVE_TEXT_MAX);
//     const requiredFields = Array.from(new Set(args.leadCapture.requiredFields));

//     const fields = {
//       proactiveMessage: {
//         enabled: args.proactiveMessage.enabled,
//         delaySeconds: Math.round(args.proactiveMessage.delaySeconds),
//         text: proactiveText,
//       },
//       leadCapture: {
//         enabled: args.leadCapture.enabled,
//         requiredFields,
//       },
//       faqEnabled: args.faqEnabled,
//     };

//     const existing = await ctx.db
//       .query("widgetSettings")
//       .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
//       .unique();

//     if (existing) {
//       await ctx.db.patch(existing._id, fields);
//     } else {
//       await ctx.db.insert("widgetSettings", {
//         workspaceId: workspace._id,
//         ...fields,
//       });
//     }
//     return { ok: true as const };
//   },
// });
