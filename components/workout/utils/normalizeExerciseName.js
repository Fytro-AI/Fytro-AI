export function normalizeExerciseName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/s$/, "")
    .trim();
}
