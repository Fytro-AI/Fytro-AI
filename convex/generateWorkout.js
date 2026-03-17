import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export const generateWorkout = action({
  args: {
    prompt: v.string(),
  },
  handler: async (_, { prompt }) => {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content;

    let workout;
    try {
      workout = JSON.parse(raw);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    return {
      Mon: workout.Mon ?? [],
      Tue: workout.Tue ?? [],
      Wed: workout.Wed ?? [],
      Thu: workout.Thu ?? [],
      Fri: workout.Fri ?? [],
      Sat: workout.Sat ?? [],
      Sun: workout.Sun ?? [],
    };
  },
});
