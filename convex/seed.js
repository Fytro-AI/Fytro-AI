import { mutation } from "./_generated/server";
import { ALL_EXERCISES } from "../constants/exercises";

export const seedExercises = mutation({
  handler: async (ctx) => {
    for (const ex of ALL_EXERCISES) {
      await ctx.db.insert("exercises", {
        name: ex.name,
        type: ex.type,
        description: ex.description ?? null,
      });
    }
  },
});

export const clearExercises = mutation({
  handler: async (ctx) => {
    const all = await ctx.db.query("exercises").collect();
    for (const ex of all) {
      await ctx.db.delete(ex._id);
    }
  },
});
