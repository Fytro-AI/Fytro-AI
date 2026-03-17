// scripts/checkExerciseCoverage.js
const path = require("path");

// Your app list
const { ALL_EXERCISES } = require("../constants/allExercises");

// Use the SAME normalizer the app uses
const { normalizeExerciseName } = require("../components/workout/utils/normalizeExerciseName");

// The media map you generated from Free Exercise DB
const MEDIA = require("../constants/exercises/freeExerciseDbMediaMap.json");

// Optional: your alias overrides (start empty, then fill)
const ALIASES = require("../constants/exercises/freeExerciseDbAliases.json");

function keyFor(name) {
  const k = normalizeExerciseName(name);
  const alias = ALIASES[k];
  return alias ? normalizeExerciseName(alias) : k;
}

const missing = [];
const found = [];

for (const name of ALL_EXERCISES) {
  const key = keyFor(name);
  if (MEDIA[key]?.images?.length) found.push(name);
  else missing.push(name);
}

console.log("Found count:", found.length);
console.log("Missing count:", missing.length);
console.log("\n--- Missing ---\n" + missing.join("\n"));
