import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* =========================
   QUERIES
========================= */

export const getHistory = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("workouts")
      .filter(q => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();
  },
});

export const getLoggedWorkouts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const now = new Date();

    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diffToMonday = (day + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    return await ctx.db
      .query("completedWorkouts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("timestamp"), startOfWeek.getTime()))
      .order("desc")
      .collect();
  },
});

export const getLatestWorkoutForDay = query({
  args: {
    userId: v.optional(v.id("users")),
    day: v.string(),
  },
  handler: async (ctx, { userId, day }) => {
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user?.workout?.[day]) return null;

    const plan = user.workout[day];

    const all = await ctx.db
      .query("workouts")
      .filter(q => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();

    return (
      all.find(entry =>
        entry.workoutData.some(e =>
          plan.some(p => p.exercise === e.name)
        )
      ) ?? null
    );
  },
});

export const getByUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("workouts")
      .filter(q => q.eq(q.field("userId"), userId))
      .collect();
  },
});

/* =========================
   MUTATIONS
========================= */

export const saveAdjustedPlan = mutation({
  args: {
    userId: v.id("users"),
    fullPlan: v.object({
      Mon: v.optional(v.array(v.any())),
      Tue: v.optional(v.array(v.any())),
      Wed: v.optional(v.array(v.any())),
      Thu: v.optional(v.array(v.any())),
      Fri: v.optional(v.array(v.any())),
      Sat: v.optional(v.array(v.any())),
      Sun: v.optional(v.array(v.any())),
    }),
  },
  handler: async (ctx, { userId, fullPlan }) => {
    await ctx.db.patch(userId, {
      adjustedWorkout: fullPlan,
    });
  },
});

export const logCompletedWorkout = mutation({
  args: {
    userId: v.id("users"),
    timestamp: v.number(),
    programDay: v.string(),
    exercises: v.array(
      v.object({
        name: v.string(),
        weight: v.optional(v.union(v.string(), v.float64())),
        sets: v.array(
          v.object({
            done: v.optional(v.union(v.float64(), v.null())),
            target: v.object({ min: v.float64(), max: v.float64() }),
            weight: v.optional(v.union(v.string(), v.float64())),
          })
        ),
      })
    ),
  },
  handler: async (ctx, { userId, timestamp, programDay, exercises }) => {
    const user = await ctx.db.get(userId);
    if (!user) return;

    const toNum = (x) =>
      x === undefined || x === null || x === ""
        ? undefined
        : parseFloat(String(x));

    /* -------- completedWorkouts -------- */

    const startOfWeek = new Date(timestamp);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const previousThisWeek = await ctx.db
      .query("completedWorkouts")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("programDay"), programDay))
      .filter(q => q.gte(q.field("timestamp"), startOfWeek.getTime()))
      .first();

    const isFirstThisWeek = !previousThisWeek;

    const exercisesForCompleted = exercises.map(e => {
      const meta = user.weights?.[e.name];

      return {
        name: e.name,
        weight: toNum(e.weight),
        blockId: meta?.blockId ?? "block-initial",
        blockWeek: isFirstThisWeek
          ? (meta?.blockWeek ?? 1)
          : meta?.blockWeek ?? 1,
        sets: e.sets.map(s => ({
          done: s.done ?? null,
          target: s.target,
          weight: toNum(s.weight),
        })),
      };
    });

    await ctx.db.insert("completedWorkouts", {
      userId,
      timestamp,
      programDay,
      exercises: exercisesForCompleted,
    });

    /* -------- workouts (NO block fields) -------- */

    const exercisesForWorkouts = exercisesForCompleted.map(
      ({ blockId, blockWeek, ...rest }) => rest
    );

    await ctx.db.insert("workouts", {
      userId,
      workoutData: exercisesForWorkouts,
      createdAt: timestamp,
    });

    return { success: true };
  },
});

export const rotateExercisesIfNeeded = mutation({
  args: {
    userId: v.id("users"),
    day: v.string(),
  },
  handler: async (ctx, { userId, day }) => {
    const user = await ctx.db.get(userId);
    if (!user?.adjustedWorkout?.[day]) return;

    const exercises = user.adjustedWorkout[day];
    const eligible = exercises.filter(e => e.blockWeek >= 8);
    if (!eligible.length) return;

    const rotateCount = Math.min(2, Math.ceil(exercises.length * 0.3));
    const toRotate = eligible.slice(0, rotateCount);

    const updated = exercises.map(ex =>
      toRotate.includes(ex)
        ? {
            exercise: ex.exercise,
            reps: ex.reps,
            sets: ex.sets,
            type: ex.type,
          }
        : ex
    );

    await ctx.db.patch(userId, {
      adjustedWorkout: {
        ...user.adjustedWorkout,
        [day]: updated,
      },
    });
  },
});
