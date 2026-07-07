import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Next.js 16 renamed `middleware.ts` -> `proxy.ts` (same project-root location,
// same `config.matcher` API). Clerk keeps the `export default clerkMiddleware(...)`
// form unchanged — only the filename moved.

// Protected: the dashboard and onboarding both require a signed-in user. The
// widget + loader stay public so they can run on customer sites with no Clerk
// session; `/`, `/sign-in`, `/sign-up`, and future marketing/pricing stay public
// by simply not being matched here (auth.protect only runs for matched routes).
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next internals and static files (loader.js / demo.html have a dot, so excluded)
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
    // Clerk's proxy path — keep its handshake/keyless requests flowing through Clerk
    "/__clerk/(.*)",
  ],
};
