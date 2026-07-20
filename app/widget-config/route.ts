import { NextRequest, NextResponse } from "next/server";

// Retreiving widget

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=60",
};

// config.widget.ts DEFAULT APPEARANCE
const DEFAULT_BUBBLE = {
  themeColor: "#0F172A",
  buttonColor: "#4F46E5",
  cornerRadius: 16,
  title: "Chat with us",
  titleColor: "#FFFFFF",
  logoUrl: null as string | null,
  position: "bottom-right",
  bottomMargin: 20,
  sideMargin: 20,
  notificationSound: true,
};

function convexSiteOrigin(): string | null {
  const explicit = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
  if (explicit) return explicit.replace(/\+$/, "");
  const cloud = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (cloud) return cloud?.replace(/\.convex\.cloud\/?$/, ".convex.site");
  return null;
}

export async function GET(req: NextRequest) {
  const appId = req.nextUrl.searchParams.get("app_id");
  const site = convexSiteOrigin();

  if (!appId || !site) {
    return NextResponse.json(DEFAULT_BUBBLE, { status: 200, headers: CORS });
  }
  try {
    const upstream = await fetch(
      `${site}/widget-config?app_id=${encodeURIComponent(appId)}`,
      { cache: "no-store" },
    );
    const body = await upstream.json();
    console.log(body);

    return NextResponse.json(body, { status: 200, headers: CORS });
  } catch (err) {
    console.error("[widget-config proxy] upstream fetch failed:", err);
    return NextResponse.json(DEFAULT_BUBBLE, { status: 200, headers: CORS });
  }
}
