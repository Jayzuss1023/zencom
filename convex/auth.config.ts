import { type AuthConfig } from "convex/server";

// Tells Convex to trust JWTs issued by your Clerk instance.
// Setup (Clerk dashboard): open the Convex integration and click
// "Activate Convex integration" — it provisions a JWT with the "convex" audience.
// Then point Convex at your Clerk Frontend API URL (the JWT issuer). This env var
// lives in the CONVEX deployment, not .env.local:
//   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-subdomain>.clerk.accounts.dev
// applicationID must match the JWT's "aud" claim ("convex").
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
