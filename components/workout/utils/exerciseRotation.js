import { ALL_EXERCISES } from "../../../constants/allExercises";
import { MUSCLE_GROUPS } from "../../../constants/exercises/muscleGroups";
import { EXERCISE_EQUIPMENT } from "../../../constants/exercises/equipment";
import { ROTATION_GROUPS } from "../../../constants/exercises/rotationGroups";

const WEEK = 1000 * 60 * 60 * 24 * 7;

function isStalled(meta) {
  if (!meta) return false;

  const failStreak = meta.failStreak ?? 0;
  const partialStreak = meta.partialStreak ?? 0;

  if (failStreak >= 2) return true;

  if (partialStreak >= 2) return true;

  return false;
}

export function shouldRotateExercise(meta) {
  if (!meta) return false;

  const blockWeek = meta.blockWeek ?? 1;

  if (blockWeek < 8) return false;

  if (!isStalled(meta)) return false;

  if (meta.lastRotatedAt) {
    const weeksSinceRotate =
      (Date.now() - meta.lastRotatedAt) / WEEK;
    if (weeksSinceRotate < 4) return false;
  }

  return true;
}

export function getRotationGroupForExercise(name) {
  for (const [group, exercises] of Object.entries(ROTATION_GROUPS)) {
    if (exercises.includes(name)) return group;
  }
  return null;
}

export function findSimilarExercise(currentExercise) {
  const group = getRotationGroupForExercise(currentExercise);
  if (!group) return currentExercise;

  const pool = ROTATION_GROUPS[group].filter(
    ex => ex !== currentExercise
  );

  if (pool.length === 0) return currentExercise;

  return pool[Math.floor(Math.random() * pool.length)];
}