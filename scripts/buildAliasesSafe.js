import fs from "fs";

// Sun appin nimet
import { ALL_EXERCISES } from "../constants/allExercises.js";

// FreeDB keyt (objektin avaimet)
import mediaMap from "../constants/exercises/freeExerciseDbMediaMap.json" with { type: "json" };

// Halutessa luetaan jo olemassa olevat aliasit ja pidetään ne
let existing = {};
try {
  existing = (await import("../constants/exercises/freeExerciseDbAliases.json", { with: { type: "json" } })).default;
} catch (_) {}

function keyify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Tokenit, joiden pitää täsmätä “turvallisesti”
const STRICT_TOKENS = [
  "incline","decline",
  "barbell","dumbbell","cable","smith","machine","kettlebell","band",
  "onearm","singlearm","twoarm",
  "widegrip","closegrip","neutralgrip","reversegrip","hammergrip"
];

function hasToken(k, t) { return k.includes(t); }

function tokenSignature(k) {
  // palauttaa vain tokenit jotka oikeasti esiintyy
  return STRICT_TOKENS.filter(t => hasToken(k, t));
}

function signatureCompatible(src, dst) {
  // Jos lähteessä on token, kohteessa pitää olla sama token
  const srcSig = tokenSignature(src);
  const dstSig = tokenSignature(dst);

  for (const t of srcSig) {
    if (!dstSig.includes(t)) return false;
  }
  // lisäksi: jos kohteessa on incline/decline mutta lähteessä ei, hylky
  for (const t of ["incline","decline"]) {
    if (!hasToken(src, t) && hasToken(dst, t)) return false;
  }
  return true;
}

// “perusliikeperheet” (varmistaa ettei fly -> row jne)
const CORE = [
  "squat","deadlift","benchpress","press","row","pulldown","pullup","chinup",
  "curl","extension","raise","fly","lunge","shrug","crunch","plank","dip",
  "hipthrust","calfraise","legpress","legextension","legcurl","goodmorning",
  "pullover","clean","snatch","jerk","stepup","carry","thruster"
];

function coreHits(k) {
  return CORE.filter(c => k.includes(c));
}

function sameCoreFamily(src, dst) {
  const a = coreHits(src);
  const b = coreHits(dst);
  // vaadi vähintään 1 yhteinen core
  return a.some(x => b.includes(x));
}

// Turvalliset variantit: monikko/singulaari + ups->up + flyes/fl ies
function safeVariants(k) {
  const out = new Set([k]);

  if (k.endsWith("s")) out.add(k.slice(0, -1));
  else out.add(k + "s");

  if (k.includes("pullups")) out.add(k.replace("pullups", "pullup"));
  if (k.includes("chinups")) out.add(k.replace("chinups", "chinup"));

  if (k.includes("flyes")) out.add(k.replace("flyes", "flies"));
  if (k.includes("flies")) out.add(k.replace("flies", "flyes"));

  if (k.includes("triceps")) out.add(k.replace("triceps", "tricep"));
  if (k.includes("tricep")) out.add(k.replace("tricep", "triceps"));

  return [...out];
}

// trigram similarity vain review-ehdotuksiin
function trigrams(s) {
  const set = new Set();
  for (let i = 0; i < s.length - 2; i++) set.add(s.slice(i, i + 3));
  return set;
}
const freeKeys = Object.keys(mediaMap);
const freeKeySet = new Set(freeKeys);
const freeTri = freeKeys.map(k => ({ k, tri: trigrams(k) }));

function sim(a, bTri) {
  const A = trigrams(a);
  let inter = 0;
  for (const x of A) if (bTri.has(x)) inter++;
  const union = A.size + bTri.size - inter;
  return union === 0 ? 0 : inter / union;
}

const safeAliases = { ...existing };
const review = [];
const noMatch = [];

for (const name of ALL_EXERCISES) {
  const src = keyify(name);
  if (!src) continue;

  // jos jo löytyy joko alias tai suora key, jatka
  const already = safeAliases[src];
  if (already && freeKeySet.has(already)) continue;
  if (!already && freeKeySet.has(src)) continue;

  // 1) exact/safe variant match
  let picked = null;
  for (const v of safeVariants(src)) {
    if (!freeKeySet.has(v)) continue;
    if (!signatureCompatible(src, v)) continue;
    if (!sameCoreFamily(src, v)) continue;
    picked = v;
    break;
  }

  if (picked) {
    if (picked !== src) safeAliases[src] = picked;
    continue;
  }

  // 2) EI automaattisesti fuzzy-match — mutta tehdään review-ehdotus
  const srcCore = coreHits(src);
  let best = null;
  for (const item of freeTri) {
    // guardrails myös reviewssä:
    if (!signatureCompatible(src, item.k)) continue;
    if (!srcCore.some(c => item.k.includes(c))) continue;

    const score = sim(src, item.tri);
    if (!best || score > best.score) best = { key: item.k, score };
  }

  if (best && best.score >= 0.78) {
    review.push({ name, srcKey: src, suggestion: best.key, score: Number(best.score.toFixed(2)) });
  } else {
    noMatch.push({ name, srcKey: src });
  }
}

fs.writeFileSync(
  "./constants/exercises/freeExerciseDbAliases.safe.json",
  JSON.stringify(safeAliases, null, 2),
  "utf8"
);
fs.writeFileSync(
  "./scripts/alias_review_needed.json",
  JSON.stringify(review, null, 2),
  "utf8"
);
fs.writeFileSync(
  "./scripts/alias_no_match.json",
  JSON.stringify(noMatch, null, 2),
  "utf8"
);

console.log("✅ Wrote: constants/exercises/freeExerciseDbAliases.safe.json");
console.log("✅ Wrote: scripts/alias_review_needed.json");
console.log("✅ Wrote: scripts/alias_no_match.json");
console.log("Safe aliases total:", Object.keys(safeAliases).length);
console.log("Needs manual review:", review.length);
console.log("No match:", noMatch.length);
