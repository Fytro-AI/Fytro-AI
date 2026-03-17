export const ROTATION_TIERS = {
  ISOLATION: "isolation",
  ACCESSORY: "accessory",
  COMPOUND: "compound",
};

export const PROGRESSION = {
  
  DEFAULT: {
    type: "reps",
    progression: "linear",
    repRange: [6, 8, 10, 12],
    repStep: 1,
    weightStep: 2.5,
  },

  HIGH_REP: {
    type: "reps",
    progression: "linear",
    repRange: [10, 12, 14, 16],
    repStep: 2,
    weightStep: 2.5,
  },

  HEAVY_MACHINE: {
    type: "reps",
    progression: "linear",
    repRange: [6, 8, 10, 12],
    repStep: 1,
    weightStep: 5,
    roundTo: 5,
  },

  BODYWEIGHT_LOADABLE: {
    type: "reps",
    progression: "linear",
    repRange: [6, 8, 10, 12],
    repStep: 1,
    weightStep: 2.5,
    startWeight: 0,
  },

  BODYWEIGHT_ONLY: {
    type: "reps",
    progression: "repFocused",
    repRange: [8, 10, 12, 15, 20],
    repStep: 2,
    weightStep: 0,
  },

  TIME_BASED: {
    type: "time",
    progression: "duration",
    timeRange: [20, 30, 40, 60, 90, 105, 120],
    timeStep: 5,
  },

  ASSISTANCE_BASED: {
    type: "reps",
    progression: "linear",
    repRange: [6, 8, 10, 12],
    repStep: 1,
    weightStep: -2.5,
  },

  DISTANCE_BASED: {
    type: "distance",
    progression: "linear",
    distanceRange: [100, 200, 400, 1000],
    distanceStep: 50,
  },
};

export const PROGRESSION_ROTATION_MAP = new Map([
  [PROGRESSION.HIGH_REP, ROTATION_TIERS.ISOLATION],
  [PROGRESSION.BODYWEIGHT_ONLY, ROTATION_TIERS.ACCESSORY],
  [PROGRESSION.BODYWEIGHT_LOADABLE, ROTATION_TIERS.ACCESSORY],
  [PROGRESSION.TIME_BASED, ROTATION_TIERS.ACCESSORY],

  [PROGRESSION.DEFAULT, ROTATION_TIERS.COMPOUND],
  [PROGRESSION.HEAVY_MACHINE, ROTATION_TIERS.COMPOUND],
]);