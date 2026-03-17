import { query } from "./_generated/server";

export const getAll = query({
  handler: async ({ db }) => {
    return await db.query("exercises").collect();
  }
});
