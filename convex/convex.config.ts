import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";
import presence from "@convex-dev/presence/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";

// Single shared component-registration file (edited additively per phase).
// - agent:       @convex-dev/agent owns AI threads/messages/streaming (LOCKED
//                decision). Bridged to our `conversations` via an optional
//                `threadId` field. Wired up in Phase 4.
// - presence:    online-user / typing roster for the dashboard + widget.
// - rateLimiter: abuse controls on the anonymous widget write surface.
const app = defineApp();
app.use(agent);
app.use(presence);
app.use(rateLimiter);

export default app;
