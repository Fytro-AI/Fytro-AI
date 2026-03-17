export function autoAdjustWorkout(currentExercise, nextProgression) {
  const { weight, sets, repRange } = nextProgression;

  const updatedExercise = {
    ...currentExercise,
    weight: weight ?? currentExercise.weight,
    sets: [],
  };

  const isTimeBased = currentExercise.type === "time";

  for (let i = 0; i < sets; i++) {
    updatedExercise.sets.push({
      target: {
        min: repRange?.min ?? currentExercise.sets?.[i]?.target?.min ?? 8,
        max: repRange?.max ?? currentExercise.sets?.[i]?.target?.max ?? 10,
      },
      done: null,
      weight: isTimeBased ? null : weight,
    });
  }

  updatedExercise.type = currentExercise.type;

  return updatedExercise;
}
