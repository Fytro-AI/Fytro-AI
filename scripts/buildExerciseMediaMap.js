// scripts/buildExerciseMediaMap.js
const fs = require("fs");
const path = require("path");

const { normalizeExerciseName } = require("../components/workout/utils/normalizeExerciseName");

const INPUT = path.join(__dirname, "../data/exercises.json");
const OUTPUT = path.join(__dirname, "../constants/exercises/freeExerciseDbMediaMap.json");

const db = JSON.parse(fs.readFileSync(INPUT, "utf8"));

const map = {};
for (const ex of db) {
  const key = String(ex.name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
    
  if (!key) continue;

  map[key] = { name: ex.name, id: ex.id, images: ex.images, instructions: ex.instructions || [] };
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(map, null, 2), "utf8");

console.log("✅ Wrote:", OUTPUT);
console.log("Entries:", Object.keys(map).length);
