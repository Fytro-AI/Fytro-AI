import MEDIA_MAP from "./freeExerciseDbMediaMap.json";
import ALIASES from "./freeExerciseDbAliases.json";

const IMG_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

function mediaKey(name) {
  let key = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (ALIASES[key]) key = ALIASES[key];

  return key;
}

function fallbackKeys(originalName) {
  const name = String(originalName || "").toLowerCase();

  const variants = [];

  const stripped = name
    .replace(/\b(seated|standing|lying|incline|decline|neutral|close|wide|narrow)\b/g, "")
    .replace(/\b(grip|machine|barbell|dumbbell|cable|smith)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (stripped && stripped !== name) variants.push(stripped);

  if (name.includes("overhead press")) variants.push("shoulder press");
  if (name.includes("shoulder press")) variants.push("overhead press");

  if (name.includes("pull-ups") || name.includes("pull ups") || name.includes("pullup"))
    variants.push("pullup");

  return variants
    .map((v) => v.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);
}

export function getExerciseImageUrls(exerciseName) {
  if (!exerciseName) return [];

  const key = mediaKey(exerciseName);
  const entry = MEDIA_MAP[key];
  if (entry?.images?.length) {
    return entry.images.map((rel) => IMG_BASE + encodeURI(rel));
  }

  const candidates = fallbackKeys(exerciseName);
  for (const k of candidates) {
    const e = MEDIA_MAP[k];
    if (e?.images?.length) {
      return e.images.map((rel) => IMG_BASE + encodeURI(rel));
    }
  }

  return [];
}

export function getExerciseMedia(exerciseName) {
  if (!exerciseName) return { imageUrls: [], instructions: [] };

  const key = mediaKey(exerciseName);
  const entry = MEDIA_MAP[key];
  if (!entry) return { imageUrls: [], instructions: [] };

  return {
    imageUrls: (entry.images || []).map((rel) => IMG_BASE + encodeURI(rel)),
    instructions: Array.isArray(entry.instructions) ? entry.instructions : [],
  };
}

