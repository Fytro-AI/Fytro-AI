import { roundToClosestLoadableWeight } from "./workoutHelpers";
import { EXERCISE_PROGRESSION } from "../../../constants/exercises/progressionMapping";
import { DESCRIPTIONS } from "../../../constants/exercises/descriptions";
import { EXERCISE_EQUIPMENT } from "../../../constants/exercises/equipment";
import { MUSCLE_GROUPS } from "../../../constants/exercises/muscleGroups";
import { PROGRESSION, ROTATION_TIERS, PROGRESSION_ROTATION_MAP } from "../../../constants/exercises/progression";

function safeNum(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function getMinimumLoadableJump(currentWeight, isLowerBody) {
  if (currentWeight < 40) return 2.5;
  if (currentWeight < 160) return isLowerBody ? 2.5 : 2.5;
  return isLowerBody ? 5 : 2.5;
}

function getPreviousDumbbellWeight(current) {
  const weights = [
    1,2,3,4,5,6,7,8,9,10,
    12.5,15,17.5,20,22.5,25,27.5,30,
    32.5,35,37.5,40,42.5,45,47.5,50,
    52.5,55,57.5,60,62.5,65,67.5,70,
    72.5,75,77.5,80,82.5,85,87.5,90,
    92.5,95,97.5,100,102.5,105,107.5,110
  ];
  let prev = current;
  for (let i = weights.length - 1; i >= 0; i--) {
    if (weights[i] < current) { prev = weights[i]; break; }
  }
  return prev;
}


function roundToClosestDumbbellWeight(target) {
  const weights = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30,
    32.5, 35, 37.5, 40, 42.5, 45, 47.5, 50,
    52.5, 55, 57.5, 60, 62.5, 65, 67.5, 70,
    72.5, 75, 77.5, 80, 82.5, 85, 87.5, 90,
    92.5, 95, 97.5, 100, 102.5, 105, 107.5, 110,
  ];
  let closest = weights[0];
  let minDiff = Infinity;
  for (let w of weights) {
    const diff = Math.abs(w - target);
    if (diff < minDiff) {
      minDiff = diff;
      closest = w;
    }
  }
  return closest;
}

function getNextDumbbellWeight(current) {
  const weights = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30,
    32.5, 35, 37.5, 40, 42.5, 45, 47.5, 50,
    52.5, 55, 57.5, 60, 62.5, 65, 67.5, 70,
    72.5, 75, 77.5, 80, 82.5, 85, 87.5, 90,
    92.5, 95, 97.5, 100, 102.5, 105, 107.5, 110,
  ];
  return weights.find((w) => w > current) || current;
}

function baseExerciseMeta(name) {
  const progression = EXERCISE_PROGRESSION[name] || PROGRESSION.DEFAULT;
  const rotationTier = PROGRESSION_ROTATION_MAP.get(progression) ?? ROTATION_TIERS.COMPOUND
  
  const equipment = EXERCISE_EQUIPMENT[name] || "bodyweight";
  const muscleGroups = MUSCLE_GROUPS[name]
    ? [].concat(MUSCLE_GROUPS[name])
    : ["general"];
  const description = DESCRIPTIONS[name] || "";

  const loadable =
    equipment !== "bodyweight" ||
    progression.type === "linear" ||
    progression.type === "weight";

  return { 
    name,
    equipment,
    progression,
    rotationTier,
    muscleGroups,
    description,
    loadable 
  };
}

function resolveEquipmentByName(rawName, equipmentFromMap) {
  const n = String(rawName || "").toLowerCase();

  if (/smith/.test(n)) return "smith";
  if (/cable|pulldown|pec deck|machine|leg extension|leg curl|row machine|hack squat|lever/.test(n))
    return "machine";
  if (/barbell|ez\-?bar/.test(n)) return "barbell";
  if (/dumbbell|db\b/.test(n)) return "dumbbell";

  if (/curl|raise|fly|rear delt|lateral|hammer/.test(n)) return "dumbbell";

  if (/press/.test(n) && !/machine/.test(n)) return "barbell";

  return equipmentFromMap || "bodyweight";
}


export function adjustProgression(exercise = {}, userMeta = {}) {
  const metaWeightRaw = userMeta?.weight;
  const metaRepRange = userMeta?.repRange;
  const metaSets = userMeta?.sets;
  const metaStreak = Number(userMeta?.streak || 0);
  const metaSetsCooldown = Number(userMeta?.setsCooldown || 0);
  const metaFail = Number(userMeta?.failStreak || 0);
  const metaPartial = Number(userMeta?.partialStreak || 0);
  const progressionHistory = Array.isArray(userMeta?.progressionHistory)
    ? userMeta.progressionHistory
    : [];

  const rawName = String(exercise?.name || "");
  const nameLower = rawName.toLowerCase();

  const exerciseWeightRaw = exercise?.weight;
  const exerciseRepRange =
    metaRepRange ??
    exercise?.repRange ??
    exercise?.sets?.[0]?.target ??
    { min: 8, max: 10 };

  const exerciseSetsCount = Number.isFinite(Number(exercise.sets?.length))
    ? exercise.sets.length
    : 3;

  const baseWeight =
    safeNum(metaWeightRaw) !== null ? safeNum(metaWeightRaw) :
    safeNum(exerciseWeightRaw) !== null ? safeNum(exerciseWeightRaw) :
    0;

  const repRange = {
    min:
      typeof exerciseRepRange?.min === "number"
        ? exerciseRepRange.min
        : parseInt(exerciseRepRange?.min) || 8,
    max:
      typeof exerciseRepRange?.max === "number"
        ? exerciseRepRange.max
        : parseInt(exerciseRepRange?.max) || 10,
  };

  const prevWeight = baseWeight;
  const prevRepMax = repRange.max;

  const sets =
    Number.isFinite(Number(metaSets)) && metaSets > 0
      ? Math.max(1, Math.floor(metaSets))
      : exerciseSetsCount;

  const reps = (exercise.sets || []).map((set) => {
    const v =
      set?.done ??
      set?.reps ??
      set?.repsDone ??
      set?.reps_done ??
      set?.completed ??
      null;
    const n = safeNum(v);
    return typeof n === "number" ? n : null;
  });

  const exMetaBase = baseExerciseMeta(rawName);
  const equipType = exMetaBase.equipment;
  const isDumbbell = equipType === "dumbbell";
  const isMachine = equipType === "machine" || equipType === "cable" || equipType === "smith";
  const isBarbell = equipType === "barbell";
  const muscleGroups = exMetaBase.muscleGroups.map((g) => String(g).toLowerCase());
  const isLowerBody = muscleGroups.some((g) => g.includes("leg") || g.includes("quad") || g.includes("glute") || g.includes("hamstring"));
  const isBodyweightLift = /pull\-?up|chin\-?up|dip/.test(nameLower) && baseWeight === 0;

  const isAccessory =
    exMetaBase.progression === PROGRESSION.HIGH_REP ||
    /curl|raise|fly|lateral|rear delt|extension|pushdown|pullover|calf|shrug/.test(nameLower);

  const isBWLoadable =
    exMetaBase.progression === PROGRESSION.BODYWEIGHT_LOADABLE ||
    /pull\-?up|chin\-?up|dip|muscle ?up|ring dip|weighted pull/.test(nameLower);

  const isLoadable =
    equipType !== "bodyweight" ||
    isBWLoadable;

  const maxAllowed = isAccessory ? 15 : 12;
  const minAllowed = isAccessory ? 8 : 5;
  const loadJumpPct = isLowerBody ? 0.05 : 0.025;
  const MAX_SETS = isAccessory ? 4 : 5;

  const repMin = repRange.min;
  const repMax = repRange.max;

  const isTime = exercise?.type === "time" || exMetaBase.progression?.type === "time";

  if (isTime) {
    const timeSteps = exMetaBase.progression?.timeRange || PROGRESSION.TIME_BASED.timeRange;

    const doneTimes = reps.filter((r) => r !== null);
    const allAtTopTime = doneTimes.length > 0 && doneTimes.every((t) => t >= repRange.max);
    const manyBelowBottomTime =
      doneTimes.filter((t) => t < repRange.min).length >= Math.ceil(doneTimes.length / 2);

    let newRepRange = { ...repRange };
    let notes = "";

    const currentMax = repRange.max;
    const idx = timeSteps.findIndex((t) => t === currentMax);

    if (allAtTopTime) {
      if (idx >= 0 && idx < timeSteps.length - 1) {
        newRepRange = { min: repRange.min, max: timeSteps[idx + 1] };
        notes += `Increased hold time to ${newRepRange.min}-${newRepRange.max}s. `;
      } else if (idx === -1) {
        const next = timeSteps.find((t) => t > currentMax) || currentMax;
        newRepRange = { min: repRange.min, max: next };
        notes += `Increased hold time to ${newRepRange.min}-${newRepRange.max}s. `;
      }
    } else if (manyBelowBottomTime) {
      notes += "Maintaining time until base hold is consistent. ";
    }

    return {
      result: allAtTopTime ? "complete" : manyBelowBottomTime ? "fail" : "partial",
      next: { weight: null, sets, repRange: newRepRange },
      meta: { streak: 0, failStreak: 0, partialStreak: 0, setsCooldown: 0 },
      notes: notes.trim() || "No change.",
      summary: `${exercise.name || "Exercise"} — ${notes.trim() || "No change."}`,
    };
  }

  const allAtTop = reps.length > 0 && reps.every((r) => r !== null && r >= repMax); 
  const belowMinSets = reps.filter((r) => r !== null && r < repMin).length;
  const trueFail = belowMinSets >= Math.ceil(reps.length / 2); 

  let result = "partial";
  if (allAtTop) result = "complete";
  else if (trueFail) result = "fail";

  let newWeight = baseWeight;
  let newSets = sets;
  let newRepRange = { ...repRange };
  let newStreak = metaStreak;
  let newFailStreak = metaFail;
  let newPartialStreak = metaPartial;
  let newSetsCooldown = metaSetsCooldown;
  let notes = "";

  const minJump = isDumbbell
  ? (baseWeight < 10 ? 1 : 2.5)
  : getMinimumLoadableJump(baseWeight, isLowerBody);

  if (result === "complete") {
    newStreak += 1;
    newFailStreak = 0;
    newPartialStreak = 0;

    if (isLoadable && newStreak >= 2) {
      newWeight = baseWeight + minJump;

      newRepRange = {
        min: Math.max(minAllowed, repMin),
        max: Math.max(minAllowed + 2, repMin + 2),
      };

      notes += `↑ Increased weight by ${minJump}kg, reset reps to ${newRepRange.min}-${newRepRange.max}. `;
      newStreak = 0;
    } else {
      const step = (exercise.type === "time")
        ? (exMetaBase.progression?.timeStep ?? PROGRESSION.TIME_BASED.timeStep ?? 5)
        : 1;

      newRepRange = { min: repMin, max: repMax + step };

      notes += `Increased rep range to ${newRepRange.min}-${newRepRange.max}. `;
    }

    if (newStreak >= 4 && newSets < MAX_SETS && newSetsCooldown === 0) {
      newSets += 1;
      newStreak = 0;
      newSetsCooldown = 4;
      notes += "Added 1 set as plateau breaker. ";
    }
  } else if (result === "fail") {
    newFailStreak += 1;
    newStreak = 0;
    newPartialStreak = 0;
    notes += "Missed minimum reps. ";

    if (newFailStreak >= 2 && isLoadable && baseWeight > 0) {
      if (isDumbbell) {
        newWeight = getPreviousDumbbellWeight(baseWeight);
      } else {
        newWeight = Math.max(0, baseWeight - minJump);
      }
      notes += `Additional deload step due to repeated fails. `;
    }

    const validReps = reps.filter((r) => r !== null);
    const avgReps =
      validReps.length ? validReps.reduce((a, b) => a + b, 0) / validReps.length : 0;
    const worstSet = validReps.length ? Math.min(...validReps) : repMin - 5;

    let drop = 1;
    if (worstSet < repMin - 3 || avgReps < repMin - 2) drop = 2;

    if (repMin > minAllowed) {
      newRepRange = {
        min: Math.max(minAllowed, repMin - drop),
        max: Math.max(minAllowed + 2, repMax - drop),
      };
      notes += `Reduced rep range by ${drop}. `;
    }
  } else {
    newPartialStreak += 1;
    newStreak = 0;
    newFailStreak = 0;
    notes += "Maintaining weight. ";
  }

  const historyLen = progressionHistory.length || 0;
  if (historyLen > 0 && historyLen % 6 === 0) {
    if (isLoadable && (newWeight > 0 || baseWeight > 0)) {
      const anchor = newWeight > 0 ? newWeight : baseWeight;
      newWeight = anchor * 0.9;
      notes += "Scheduled deload: reduced weight by 10%. ";
    } else {
      notes += "Scheduled deload. ";
    }
  }

  if (newSetsCooldown > 0) {
    newSetsCooldown = Math.max(0, newSetsCooldown - 1);
  }

  let roundedWeight = newWeight;
  if (isLoadable && newWeight > 0) {
    if (isDumbbell) {
      const db = roundToClosestDumbbellWeight(newWeight);
      roundedWeight = (newWeight < baseWeight && db > newWeight)
        ? getPreviousDumbbellWeight(baseWeight)
        : db;
    } else if (isMachine) {
      roundedWeight = (newWeight < baseWeight)
        ? Math.floor(newWeight / 2.5) * 2.5
        : Math.round(newWeight / 2.5) * 2.5;
        } else if (isBarbell) {
      roundedWeight = Math.round(newWeight / 2.5) * 2.5;
    } else if (/pull\-?up|chin\-?up|dip/.test(nameLower)) {
      roundedWeight = parseFloat(newWeight.toFixed(1));
    }
  }

  const didProgress =
  (typeof roundedWeight === "number" &&
    typeof prevWeight === "number" &&
    roundedWeight > prevWeight) ||
  (newRepRange?.max > prevRepMax);

  const next = {
    weight: roundedWeight,
    sets: Math.max(1, Math.floor(newSets)),
    repRange: newRepRange,
  };

  const meta = {
    streak: newStreak,
    failStreak: newFailStreak,
    partialStreak: newPartialStreak,
    setsCooldown: newSetsCooldown || 0,
  };

  const summaryNote = (notes || "No change.").trim();

  return {
    result,
    next,
    meta,
    didProgress,
    notes: summaryNote,
    summary: `${exercise.name || "Exercise"} — ${result.toUpperCase()}: ${summaryNote}`,
  };
}
