//convex/stripe.js
import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";
import { api, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const APP_URL = process.env.APP_URL;
if (!APP_URL) {
  throw new Error("Missing APP_URL enviroment variable!");
}

export const startCheckout = action({
  args: {
    userId: v.id("users"),
    billing: v.string(),
  },
  handler: async (ctx, args) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-07-30.basil",
    });

    const user = await ctx.runQuery(api.users.getUserById, {
      userId: args.userId,
    });
    if (!user) throw new Error("User not found");

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: args.userId },
      });

      customerId = customer.id;
      await ctx.runMutation(api.users.saveStripeCustomerId, {
        userId: args.userId,
        stripeCustomerId: customerId,
      });
    }

    const priceMap = {
      monthly: process.env.STRIPE_PRICE_FYTRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_FYTRO_YEARLY,
    };

    const priceId = priceMap[args.billing];
    if (!priceId) throw new Error(`Invalid billing type: ${args.billing}`);

    const enableTrial = args.billing === 'yearly' || args.billing === 'monthly';

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: enableTrial ? 9 : undefined,
        metadata: {
          userId: args.userId,
          billing: args.billing,
        },
      },
      success_url: `fytro://stripe-success`,
      cancel_url: `fytro://stripe-cancel`,
      metadata: {
        userId: args.userId,
        billing: args.billing,
      },
    });

    return session.url;
  },
});


export const markUserAsSubscribed = internalMutation({
  args: { userId: v.id("users"), subscriptionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      subscribed: true,
      ...(args.subscriptionId && { subscriptionId: args.subscriptionId }),
    });
  },
});

export const getCustomerPortalUrl = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-07-30.basil",
    });

    const user = await ctx.runQuery(api.users.getUserById, {
      userId: args.userId,
    });

    if (!user?.stripeCustomerId) {
      throw new Error("No stripe customer ID");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: "fytro://stripe-success.jsx",
    });

    return session.url;
  }
});

export const stripeWebhook = httpAction(async (ctx, request) => {
  const event = await request.json();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil",
  });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const subscriptionId = session.subscription;
      const userId = session.metadata.userId;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      await ctx.runMutation(internal.users.updateSubscription, {
        userId,
        subscriptionId: subscription.id,
        status: subscription.status,
        trialEndsAt: subscription.trial_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const userId = subscription.metadata.userId;

      await ctx.runMutation(internal.users.updateSubscription, {
        userId,
        subscriptionId: subscription.id,
        status: subscription.status,
        trialEndsAt: subscription.trial_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });
      break;
    }
  }

  return new Response("ok", { status: 200 });
});

