import { httpRouter } from "convex/server";
import { stripeWebhook } from "./stripe";

const router = httpRouter();

router.route({
  path: "/stripeWebhook",
  method: "POST",
  handler: stripeWebhook,
});

export default router;
