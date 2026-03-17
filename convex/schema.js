import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    uid: v.optional(v.string()),
    name: v.string(),
    email: v.optional(v.string()),
    picture: v.optional(v.string()),
    credits: v.number(),
    adjustmentSummary: v.optional(v.string()),
    subscribed: v.boolean(),
    unitSystem: v.optional(v.string()),
    restTimer: v.optional(v.string()),
    trialEndsAt: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),

    isGuest: v.optional(v.boolean()),

    age: v.optional(v.float64()),
    weight: v.optional(v.float64()),
    gender: v.optional(v.string()),
    goal: v.optional(v.string()),
    level: v.optional(v.string()),
    trainingDays: v.optional(v.array(v.string())),
    split: v.optional(v.string()),
    access: v.optional(v.string()),
    sleep: v.optional(v.string()),
    motivation: v.optional(v.array(v.string())),
    commitment: v.optional(v.float64()),
    injuries: v.optional(v.string()),
    custom: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),

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

    adjustedWorkout: v.optional(
      v.object({
        Mon: v.optional(v.array(v.any())),
        Tue: v.optional(v.array(v.any())),
        Wed: v.optional(v.array(v.any())),
        Thu: v.optional(v.array(v.any())),
        Fri: v.optional(v.array(v.any())),
        Sat: v.optional(v.array(v.any())),
        Sun: v.optional(v.array(v.any())),
      })
    ),

    onBreak: v.optional(v.boolean()),
    feedback: v.optional(
      v.object({
        feeling: v.string(),
        reason: v.optional(v.string()),
        note: v.optional(v.string()),
        timestamp: v.number(),
      })
    ),
    feedbackReason: v.optional(v.string()),
    prs: v.optional(v.any()),
    weights: v.optional(
      v.record(
        v.string(),
        v.object({
          weight: v.optional(v.union(v.string(), v.null())),
          streak: v.optional(v.number()),
          failStreak: v.optional(v.number()),
          partialStreak: v.optional(v.number()),
          lastResult: v.optional(v.string()),
          blockWeek: v.optional(v.number()),
          blockId: v.optional(v.string()),
          lastRotatedAt: v.optional(v.number()),
          lastProgressAt: v.optional(v.float64()),
          repRange: v.optional(
            v.object({
              min: v.float64(),
              max: v.float64(),
            })
          ),
          sets: v.optional(v.number()),
          fatigue: v.optional(v.string()),
          progressionHistory: v.optional(v.array(v.any())),
        })
      )
    ),
    goals: v.optional(
      v.array(
        v.object({
          text: v.string(),
          completed: v.boolean(),
        })
      )
    ),
  })
  .index("by_email", ["email"])
  .index("by_uid", ["uid"]),

  workouts: defineTable({
    userId: v.string(),
    workoutData: v.array(
      v.object({
        name: v.string(),
        weight: v.optional(v.float64()),
        sets: v.array(
          v.object({
            done: v.union(v.float64(), v.null()),
            target: v.object({
              min: v.float64(),
              max: v.float64(),
            }),
            weight: v.optional(v.float64()),
          })
        ),
      })
    ),
    createdAt: v.number(),
  }),

  exercises: defineTable({
    name: v.string(),
    type: v.string(),
    description: v.string(),
  }),

  completedWorkouts: defineTable({
    userId: v.id("users"),
    timestamp: v.number(),
    programDay: v.string(),
    exercises: v.array(
      v.object({
        name: v.string(),
        weight: v.optional(v.float64()),
        blockId: v.string(),
        blockWeek: v.number(),
        sets: v.array(
          v.object({
            done: v.optional(v.union(v.float64(), v.null())),
            target: v.object({ min: v.float64(), max: v.float64() }),
            weight: v.optional(v.float64()),
          })
        ),
      })
    ),
  }).index("by_userId", ["userId"]),
});

function workoutObj() {
  return v.object({
    exercise: v.string(),
    reps: v.string(),
    sets: v.float64(),
    type: v.string(),
  });
}