// scripts/suggestAliases.js
import { ALL_EXERCISES } from "../constants/allExercises.js";
import aliases from "../constants/exercises/freeExerciseDbAliases.json" with { type: "json" };
import mediaMap from "../constants/exercises/freeExerciseDbMediaMap.json" with { type: "json" };

function keyify(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// nopea fuzzy-score: Jaccard trigram similarity (0..1)
function trigrams(s) {
  const t = [];
  for (let i = 0; i < s.length - 2; i++) t.push(s.slice(i, i + 3));
  return new Set(t);
}
function similarity(a, b) {
  if (!a || !b) return 0;
  const A = trigrams(a), B = trigrams(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

const mediaKeys = Object.keys(mediaMap);
const mediaKeySet = new Set(mediaKeys);

// Precompute trigram sets for speed
const mediaTri = mediaKeys.map((k) => ({ k, tri: trigrams(k) }));

function similarityWithPre(a, bTri) {
  const A = trigrams(a);
  let inter = 0;
  for (const x of A) if (bTri.has(x)) inter++;
  const union = A.size + bTri.size - inter;
  return union === 0 ? 0 : inter / union;
}

const results = [];
for (const ex of ALL_EXERCISES) {
  const k = keyify(ex);

  // already explicitly aliased?
  const aliased = aliases[k];
  const finalKey = aliased ? aliased : k;

  if (mediaKeySet.has(finalKey)) continue; // already covered

  // find best candidates
  let best = null;
  let second = null;

  for (const item of mediaTri) {
    const score = similarityWithPre(k, item.tri);
    if (!best || score > best.score) {
      second = best;
      best = { key: item.k, score };
    } else if (!second || score > second.score) {
      second = { key: item.k, score };
    }
  }

  results.push({
    exercise: ex,
    key: k,
    suggestion: best?.key,
    score: best?.score ?? 0,
    second: second?.key,
    secondScore: second?.score ?? 0,
  });
}

// sort: highest confidence first (helpful to batch-accept)
results.sort((a, b) => b.score - a.score);

console.log("Missing exercises needing aliases:", results.length);
console.log("");

// Print only “good” suggestions first:
const GOOD_THRESHOLD = 0.55; // adjust if needed
const good = results.filter((r) => r.score >= GOOD_THRESHOLD);
const meh = results.filter((r) => r.score < GOOD_THRESHOLD);

console.log("=== HIGH CONFIDENCE SUGGESTIONS ===");
for (const r of good.slice(0, 150)) {
  console.log(
    `${r.exercise}  ->  ${r.suggestion}   (score ${r.score.toFixed(2)})`
  );
}

console.log("\n=== LOW CONFIDENCE (REVIEW) ===");
for (const r of meh.slice(0, 80)) {
  console.log(
    `${r.exercise}  ->  ${r.suggestion} / ${r.second}   (scores ${r.score.toFixed(
      2
    )}, ${r.secondScore.toFixed(2)})`
  );
}
