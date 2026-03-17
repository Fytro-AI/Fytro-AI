import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";

export const CreateNewUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    uid: v.string(),
  },
  handler: async (ctx, args) => {
    // 1) FIRST try by uid (important for guest->real upgrade)
    const byUid = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("uid"), args.uid))
      .first();

    if (byUid) {
      // Upgrade existing guest (or existing user)
      await ctx.db.patch(byUid._id, {
        name: args.name,
        email: args.email,
        uid: args.uid,
        isGuest: false,
      });
      return await ctx.db.get(byUid._id);
    }

    // 2) fallback: try by email (normal signup)
    const existingUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (!existingUser.uid) {
        await ctx.db.patch(existingUser._id, { uid: args.uid });
      }
      return existingUser;
    }

    // 3) create brand new
    const data = {
      name: args.name,
      email: args.email,
      credits: 10,
      uid: args.uid,
      subscribed: false,
      isGuest: false,
    };

    const newId = await ctx.db.insert("users", data);
    return await ctx.db.get(newId);
  },
});

export const UpsertGuestUser = mutation({
  args: {
    uid: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("uid"), args.uid))
      .first();

    if (existing) return existing;

    const newId = await ctx.db.insert("users", {
      uid: args.uid,
      name: "Guest",
      email: "guest-" + args.uid + "@guest.com",
      credits: 10,
      subscribed: false,
      isGuest: true,
    });

    return await ctx.db.get(newId);
  },
});

export const GetUserByUid = query({
  args: { uid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("uid"), args.uid))
      .first();
  },
});

export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const saveStripeCustomerId = internalMutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      stripeCustomerId: args.stripeCustomerId,
    });
  },
});

export const GetUser = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    if (!args.email) return null;

    const user = await ctx.db.query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();

    if (!user[0]) return null;

    return {
      ...user[0],
      _id: user[0]._id,
    };
  },
});


export const updateUserPref = mutation({
  args: {
    uid: v.string(),
    age: v.optional(v.float64()),
    name: v.optional(v.string()),
    weight: v.optional(v.float64()),
    gender: v.optional(v.string()),
    goal: v.string(),
    level: v.optional(v.string()),
    trainingDays: v.array(v.string()),
    split: v.optional(v.string()),
    access: v.optional(v.string()),
    sleep: v.optional(v.string()),
    motivation: v.optional(v.array(v.string())),
    commitment: v.optional(v.float64()),
    injuries: v.optional(v.string()),
    subscribed: v.optional(v.boolean()),
    custom: v.optional(v.string()),
    workout: v.optional(
      v.object({
        Mon: v.array(workoutObj()),
        Tue: v.array(workoutObj()),
        Wed: v.array(workoutObj()),
        Thu: v.array(workoutObj()),
        Fri: v.array(workoutObj()),
        Sat: v.array(workoutObj()),
        Sun: v.array(workoutObj()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.uid, {
      age: args.age,
      weight: args.weight,
      gender: args.gender,
      goal: args.goal,
      level: args.level,
      trainingDays: args.trainingDays,
      split: args.split,
      access: args.access,
      sleep: args.sleep,
      motivation: args.motivation,
      commitment: args.commitment,
      injuries: args.injuries,
      workout: args.workout,
      plan: args.plan,
    });
  },
});


export const updateUserWeight = mutation({
  args: {
    userId: v.id("users"),
    exercise: v.string(),
    weight: v.union(v.string(), v.float64()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    const weights = user.weights ?? {};
    weights[args.exercise] = { weight: String(args.weight) };
    await ctx.db.patch(args.userId, { weights });
  },
});

export const updateWeight = mutation({
  args: {
    email: v.string(),
    exercise: v.string(),
    weight: v.union(v.string(), v.float64()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (!user) throw new Error("User not found");

    const weightStr = String(args.weight);

    const newWeights = { ...(user.weights || {}) };
    newWeights[args.exercise] = {
      weight: weightStr,
      streak: 0,
      lastResult: "manual",
    };

    await ctx.db.patch(user._id, { weights: newWeights });
  },
});

export const addOrUpdatePR = mutation({
  args: { email: v.string(), exercise: v.string(), pr: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").filter(q => q.eq(q.field("email"), args.email)).first();

    if (!user) throw new Error("User not found");

    const existing = user.prs || {};

    const now = new Date().toISOString();

    const updated = {
      ...existing,
      [args.exercise]: [
        ...(existing[args.exercise] || []),
        { weight: args.pr, date: now },
      ],
    };

    await ctx.db.patch(user._id, { prs: updated });
  },
});


export const RefetchUser = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    return user;
  },
});



export const getUserPRs = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.prs || {};
  },
});


export const addGoal = mutation({
  args: { email: v.string(), goal: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) throw new Error("User not found");

    const updatedGoals = user.goals || [];
    updatedGoals.push({ text: args.goal, completed: false });
    await ctx.db.patch(user._id, { goals: updatedGoals });
  },
});


export const toggleGoal = mutation({
  args: { email: v.string(), index: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) throw new Error("User not found");

    const updatedGoals = [...(user.goals || [])];
    updatedGoals[args.index].completed = !updatedGoals[args.index].completed;

    await ctx.db.patch(user._id, { goals: updatedGoals });
  },
});


export const removeGoal = mutation({
  args: { email: v.string(), index: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) throw new Error("User not found");

    const updatedGoals = [...(user.goals || [])];
    updatedGoals.splice(args.index, 1);
    await ctx.db.patch(user._id, { goals: updatedGoals });
  },
});

export const updateWeightProgression = mutation({
  args: {
    email: v.string(),
    exercise: v.string(),
    newWeight: v.optional(v.union(v.string(), v.float64(), v.null())),
    result: v.string(),
    repRange: v.optional(v.object({ min: v.float64(), max: v.float64() })),
    sets: v.optional(v.union(v.float64(), v.null())),
    lastRotatedAt: v.optional(v.float64()),
    lastProgressAt: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (!user) throw new Error("User not found");

    const weights = user.weights ?? {};

    const prev = weights[args.exercise] ?? {
      streak: 0,
      failStreak: 0,
      partialStreak: 0,
      blockWeek: 1,
      blockId: `block-initial`,
    };

    const normalizedPrev = {
      streak: Number(prev.streak ?? 0),
      failStreak: Number(prev.failStreak ?? 0),
      partialStreak: Number(prev.partialStreak ?? 0),
      blockWeek: Number(prev.blockWeek ?? 1),
      blockId: prev.blockId ?? "block-initial",
      weight: prev.weight,
      repRange: prev.repRange,
      sets: prev.sets,
      lastRotatedAt: prev.lastRotatedAt,
      lastProgressAt: prev.lastProgressAt,
    };

    const isRotated = typeof args.lastRotatedAt === "number";
    const nextBlockWeek = isRotated
      ? 1
      : Math.min((prev.blockWeek ?? 1) + 1, 8);

    const updated = {
      ...prev,

      weight: args.newWeight ?? normalizedPrev.weight,
      repRange: args.repRange ?? normalizedPrev.repRange,
      sets: args.sets ?? normalizedPrev.sets,

      streak: args.result === "complete" ? normalizedPrev.streak + 1 : 0,
      failStreak: args.result === "fail" ? normalizedPrev.failStreak + 1 : 0,
      partialStreak: args.result === "partial" ? normalizedPrev.partialStreak + 1 : 0,

      blockId: isRotated
        ? `block-${Date.now()}`
        : normalizedPrev.blockId,

      blockWeek: nextBlockWeek,

      lastRotatedAt: args.lastRotatedAt ?? normalizedPrev.lastRotatedAt,
    };

    if (args.lastProgressAt !== undefined) {
      updated.lastProgressAt = args.lastProgressAt;
    }

    await ctx.db.patch(user._id, {
      weights: {
        ...weights,
        [args.exercise]: updated,
      },
    });
  },
});

export const updateUserSummary = mutation({
  args: {
    userId: v.id("users"),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      adjustmentSummary: args.summary,
    });
  },
});


function workoutObj() {
  return v.object({
    exercise: v.string(),
    reps: v.optional(v.string()),
    sets: v.optional(v.float64()),
    type: v.string(),
    repRange: v.optional(
      v.object({
        min: v.float64(),
        max: v.float64(),
      })
    ),
    weight: v.optional(v.string()),
  });
}

export const setBreakStatus = mutation({
  args: { email: v.string(), status: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").filter((q) => q.eq(q.field("email"), args.email)).first();
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { onBreak: args.status });
  },
});

export const setFeedback = mutation({
  args: { 
    email: v.string(), 
    status: v.optional(
      v.object({
        feeling: v.string(),
        reason: v.optional(v.string()),
        note: v.optional(v.string()),
        timestamp: v.number(),
      })),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").filter((q) => q.eq(q.field("email"), args.email)).first();
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      feedback: args.status,
      feedbackReason: args.reason,
    });
  },
});

export const setTrialEndDate = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").filter((q) => q.eq(q.field("email"), args.email)).first();
    if (!user) throw new Error("User not found");

    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 7);

    await ctx.db.patch(user._id, { trialEndsAt: trialEnds });

    return trialEnds;
  },
});

export const updateUnitSystem = mutation({
  args: {
    email: v.string(),
    unitSystem: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { unitSystem: args.unitSystem });
  },
});

export const updateFormatTimer = mutation({
  args: {
    email: v.string(),
    restTimer: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { restTimer: args.restTimer });
  },
});

export const updateSubscription = mutation({
  args: {
    userId: v.id("users"),
    subscriptionId: v.string(),
    status: v.string(),
    trialEndsAt: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      subscribed: args.status === "active" || args.status === "trialing",
      subscriptionId: args.subscriptionId,
      trialEndsAt: args.trialEndsAt ?? undefined,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd || false,
    });
  },
});

export const hardDeleteUserData = internalMutation({
  args: {
    userId: v.id("users"),
    uid: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const completed = await ctx.db
      .query("completedWorkouts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const row of completed) {
      await ctx.db.delete(row._id);
    }

    const idAsString = String(args.userId);
    const workoutsById = await ctx.db
      .query("workouts")
      .filter((q) => q.eq(q.field("userId"), idAsString))
      .collect();

    for (const row of workoutsById) {
      await ctx.db.delete(row._id);
    }

    if (args.uid) {
      const userByUid = await ctx.db
        .query("users")
        .withIndex("by_uid", (q) => q.eq("uid", args.uid))
        .first();
      if (userByUid && userByUid._id !== args.userId) {
        await ctx.db.delete(userByUid._id);
      }
    }

    if (args.email) {
      const usersByEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .collect();
      for (const row of usersByEmail) {
        if (row._id !== args.userId) {
          await ctx.db.delete(row._id);
        }
      }
    }

    await ctx.db.delete(args.userId);
    return { ok: true };
  },
});

export const deleteAccountPermanently = action({
  args: {
    userId: v.id("users"),
    uid: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getUserById, { userId: args.userId });
    if (!user) return { ok: true };

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-07-30.basil" });

      if (user.subscriptionId) {
        try {
          await stripe.subscriptions.cancel(user.subscriptionId);
        } catch (error) {
          console.log("Subscription cancellation failed:", error?.message ?? error);
        }
      }

      if (user.stripeCustomerId) {
        try {
          await stripe.customers.del(user.stripeCustomerId);
        } catch (error) {
          console.log("Stripe customer delete failed:", error?.message ?? error);
        }
      }
    }

    await ctx.runMutation(internal.users.hardDeleteUserData, {
      userId: args.userId,
      uid: args.uid,
      email: args.email,
    });

    return { ok: true };
  },
});
