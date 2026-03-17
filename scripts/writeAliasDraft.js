import fs from "fs";
import { ALL_EXERCISES } from "../constants/allExercises.js";
import currentAliases from "../constants/exercises/freeExerciseDbAliases.json" with { type: "json" };
import mediaMap from "../constants/exercises/freeExerciseDbMediaMap.json" with { type: "json" };

function keyify(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function trigrams(s) {
  const t = [];
  for (let i = 0; i < s.length - 2; i++) t.push(s.slice(i, i + 3));
  return new Set(t);
}
function simPre(a, bTri) {
  const A = trigrams(a);
  let inter = 0;
  for (const x of A) if (bTri.has(x)) inter++;
  const union = A.size + bTri.size - inter;
  return union === 0 ? 0 : inter / union;
}

const mediaKeys = Object.keys(mediaMap);
const mediaKeySet = new Set(mediaKeys);
const mediaTri = mediaKeys.map((k) => ({ k, tri: trigrams(k) }));

const THRESH = 0.62; // slightly stricter, you can lower later

const draft = { ...currentAliases };

for (const ex of ALL_EXERCISES) {
  const k = keyify(ex);

  const finalKey = draft[k] ? draft[k] : k;
  if (mediaKeySet.has(finalKey)) continue;

  let best = null;
  for (const item of mediaTri) {
    const score = simPre(k, item.tri);
    if (!best || score > best.score) best = { key: item.k, score };
  }

  if (best && best.score >= THRESH) {
    // don't overwrite existing aliases
    if (!draft[k]) draft[k] = best.key;
  }
}

fs.writeFileSync(
  "./constants/exercises/freeExerciseDbAliases.draft.json",
  JSON.stringify(draft, null, 2),
  "utf8"
);

console.log("✅ Wrote draft aliases to constants/exercises/freeExerciseDbAliases.draft.json");
