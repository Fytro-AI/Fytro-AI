import { PROGRESSION } from "../../../constants/exercises/progression";
import { EXERCISE_PROGRESSION } from "../../../constants/exercises/progressionMapping";

export function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function getSetLabel(exercise, set) {
  const isValidWeight = (w) =>
  (typeof w === "number" && !isNaN(w)) ||
  (typeof w === "string" && w.trim() !== "" && w !== "undefined");

  
  const weight =
    isValidWeight(set.weight) ? set.weight :
    isValidWeight(exercise.weight) ? exercise.weight :
    null;
  const weightLabel = isValidWeight(weight) ? `${weight}kg ` : "";
  const target = set.target;

  if (typeof target === "string") {
    return `${weightLabel}${target}`;
  }

  if (set.done == null) {
    if (typeof target === "object" && target.min !== undefined && target.max !== undefined) {
      return `${weightLabel}${target.min}-${target.max}`;
    } else {
      return `${weightLabel}${target}`;
    }
  }

  if (typeof target === "object" && target.max !== undefined) {
    return `${weightLabel}${set.done}/${target.max}`;
  } else {
    return `${weightLabel}${set.done}/${target}`;
  }
}


export function getSetStyle(done, target) {
  if (done === null) return "setDefault";

  const { min, max } = target;
  if (done >= min && done <= max) return "setPerfect";
  if (done >= Math.floor(min * 0.75)) return "setOk";
  return "setBad";
}

export function analyzeProgressSmart(exercise, previousMeta = {}) {
  const { sets = [] } = exercise;

  const totalSets = sets.length;
  const repRange = previousMeta.repRange || sets[0]?.target || { min: 10, max: 12 };
  const weight = parseFloat(exercise.weight) || 0;

  const doneReps = sets.map(set => set.done ?? 0);
  const allAtTop = doneReps.every(reps => reps >= repRange.max);
  const allInRange = doneReps.every(reps => reps >= repRange.min && reps <= repRange.max);
  const allBelow = doneReps.every(reps => reps < repRange.min);
  const mostBelow = doneReps.filter(r => r < repRange.min).length >= Math.ceil(totalSets * 0.66);

  let result = "partial";

  if (allAtTop) result = "complete";
  else if (allInRange) result = "in_range";
  else if (allBelow) result = "fail";
  else if (mostBelow) result = "fail";

  return result;
}


export function parseRawWorkout(rawWorkout, weights) {
  return rawWorkout.map((exercise) => {
    const name = exercise.exercise;
    const prog = EXERCISE_PROGRESSION[name] || PROGRESSION.DEFAULT;

    const defaultWeight = weights?.[name]?.weight ?? null;

    let target;
    if (typeof exercise.reps === "string" && exercise.reps.trim().toLowerCase() === "max") {
      target = { min: null, max: "Max" };
    } else {
      const [min, max] = exercise.reps
        .split("-")
        .map((r) => parseInt(r.trim(), 10));

      target = {
        min: isNaN(min) ? 0 : min,
        max: isNaN(max) ? min : max,
      };
    }

    return {
      name,
      type: prog.type,
      weight: defaultWeight === null ? null : String(defaultWeight),
      sets: Array.from({ length: exercise.sets }).map(() => ({
        weight: prog.type === "time" ? null : (defaultWeight === null ? null : String(defaultWeight)),
        target,
        done: null,
      })),
    };
  });
}


export function getActualUsedWeight(exercise) {
  const weights = exercise.sets
    .map((s) => parseFloat(s.weight))
    .filter((w) => !isNaN(w));
  return weights.length ? weights[weights.length - 1] : parseFloat(exercise.weight);
}

export function roundToClosestLoadableWeight(target, barWeight = 20) {
  const plates = [2.5, 5, 10, 15, 20, 25];
  const possibleWeights = new Set([barWeight]);

  for (let a of plates) {
    for (let i = 0; i <= 20; i++) {
      const total = barWeight + a * 2 * i;
      if (total <= 400) possibleWeights.add(total);
    }
  }

  let closest = barWeight;
  let minDiff = Infinity;
  for (let w of possibleWeights) {
    const diff = Math.abs(w - target);
    if (diff < minDiff) {
      minDiff = diff;
      closest = w;
    }
  }
  return closest;
}
