import { ALL_EXERCISES } from "../constants/allExercises.js";
import aliases from "../constants/exercises/freeExerciseDbAliases.json" with { type: "json" };
import mediaMap from "../constants/exercises/freeExerciseDbMediaMap.json" with { type: "json" };

function mediaKey(name) {
  let key = String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (aliases[key]) key = aliases[key];
  return key;
}

const missing = [];
const found = [];

for (const ex of ALL_EXERCISES) {
  const k = mediaKey(ex);
  if (mediaMap[k]?.images?.length) found.push(ex);
  else missing.push({ ex, key: k });
}

console.log("Found:", found.length);
console.log("Missing:", missing.length);
console.log("\n--- Missing list ---");
for (const m of missing) console.log(`${m.ex}  ->  ${m.key}`);
