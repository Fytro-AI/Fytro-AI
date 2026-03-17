import Button from "../shared/Button";
import { autoAdjustWorkout } from "./utils/autoAdjustWorkout";
import { ActivityIndicator, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import styles from "../../styles/WorkoutStyles";
import { adjustProgression } from "./utils/adjustProgression";
import React, { useContext } from "react";
import { UserContext } from "../../context/UserContext";
import { EXERCISE_INDEX, findExerciseMeta } from "../../constants/exercises";
import Colors from "../../shared/Colors";
import { normalizeExerciseName } from "./utils/normalizeExerciseName";
import { hydrateExerciseIfNeeded } from "../../app/WorkoutScreen/WorkoutScreen";
import { shouldRotateExercise, findSimilarExercise, getRotationGroupForExercise } from "../../components/workout/utils/exerciseRotation";
import { auth } from "../../services/FirebaseConfig";

function shouldResetWeight(prevMeta, nextMeta) {
  if (!prevMeta || !nextMeta) return true;

  if (prevMeta.equipment !== nextMeta.equipment) return true;

  if (prevMeta.equipment === "bodyweight" && nextMeta.loadable) return true;

  return false;
}

export default function FinishWorkoutButton({ setsData, setSetsData, user, day, router }) {
  const logWorkout = useMutation(api.workouts.logCompletedWorkout);
  const saveAdjustedPlan = useMutation(api.workouts.saveAdjustedPlan);
  const updateWeightProgression = useMutation(api.users.updateWeightProgression);
  const refetchUser = useMutation(api.users.RefetchUser);
  const updateUserSummary = useMutation(api.users.updateUserSummary);
  const { setUser } = useContext(UserContext);
  const email = auth.currentUser?.email;
  const [loading, setLoading] = React.useState(false);

  const handleFinish = async () => {
    setLoading(true);

    if (!Array.isArray(setsData)) {
      console.error("❌ setsData is not array", setsData);
      return;
    }

    let summaries = [];

    const payload = setsData.map(ex => {
      const {
        blockId,
        blockWeek,
        ...cleanExercise
      } = ex;

      return {
        name: cleanExercise.name,
        weight: cleanExercise.weight?.toString().replace(",", "."),
        sets: cleanExercise.sets.map(set => ({
          done: set.done,
          target: set.target,
          weight: set.weight?.toString().replace(",", "."),
        })),
      };
    });

    try {
      const result = await logWorkout({
        userId: user._id,
        exercises: payload,
        timestamp: Date.now(),
        programDay: day,
      });

      console.log("✅ logWorkout result:", result);
    } catch (e) {
      console.error("❌ FINISH WORKOUT ERROR", e);
    }

    let nextWeekPlan = [];

    console.log("🔥 FINISH WORKOUT", {
      day,
      exercises: setsData.map(e => e.name),
    });

    let rotatedThisWorkout = false;

    try {
      const rotationPriority = ["isolation", "accessory", "compound"];

      const scored = setsData.map(ex => {
        const meta = findExerciseMeta(ex.name);
        return {
          ex,
          tier: meta.rotationTier,
        };
      });

      scored.sort(
        (a, b) =>
          rotationPriority.indexOf(a.tier) -
          rotationPriority.indexOf(b.tier)
      );

      for (const { ex } of scored) {
        const normalized = normalizeExerciseName(ex.name);
        const canonicalName = EXERCISE_INDEX[normalized] ?? ex.name;

        const userMeta = user.weights?.[canonicalName] || {};

        let willRotate = false;

        const hasRotationPool =
          getRotationGroupForExercise(canonicalName) !== null;

        if (
          !rotatedThisWorkout &&
          hasRotationPool &&
          shouldRotateExercise(userMeta)
        ) {
          willRotate = true;
          rotatedThisWorkout = true;
        }

        const finalExerciseName = willRotate
          ? findSimilarExercise(canonicalName)
          : canonicalName;

        const { result, next, notes, didProgress } = adjustProgression(ex, userMeta);

        if (willRotate) {
          nextWeekPlan.push(
            autoAdjustWorkout(
              {
                ...ex,
                name: finalExerciseName,
                weight: null,
                blockWeek: 1,
              },
              {
                weight: null,
                sets: next.sets ?? 3,
                repRange: next.repRange,
              }
            )
          );
        } else {
          nextWeekPlan.push(
            autoAdjustWorkout(
              { ...ex, name: finalExerciseName },
              next
            )
          );
        }

        await updateWeightProgression({
          email: user.email,
          exercise: finalExerciseName,
          newWeight: willRotate ? null : String(next.weight),
          result,
          repRange: next.repRange ?? null,
          sets: typeof next.sets === "number" ? next.sets : null,
          lastRotatedAt: willRotate ? Date.now() : undefined,
          lastProgressAt: didProgress ? Date.now() : undefined,
        });

        summaries.push(
          `${finalExerciseName} - ${result.toUpperCase()}: ${notes || "No notes."}`
        );
      }
    } catch (e) {
      console.error("❌ FINISH WORKOUT ERROR", e);
    }

    let refreshedUser;

    try {
      refreshedUser = await refetchUser({ email: user.email });
      console.log("🧪 REFETCHED ADJUSTED PLAN DAY", {
        day,
        refetched: refreshedUser.adjustedWorkout?.[day]?.map(e => e.name),
      });

      const previousDayPlan =
        refreshedUser.adjustedWorkout?.[day] ??
        refreshedUser.workout?.[day] ??
        [];

      if (nextWeekPlan.length === 0) {
        throw new Error("Next week plan generation failed");
      }

      const safeNextPlan = nextWeekPlan;

      const basePlan = refreshedUser.workout ?? {};
      const adjusted = refreshedUser.adjustedWorkout ?? {};

      const fullPlan = {
        ...basePlan,
        ...adjusted,
        [day]: safeNextPlan,
      };

      console.log(
        "NEXT WEEK PLAN:",
        nextWeekPlan.map(e => e.name)
      );

      await saveAdjustedPlan({
        userId: user._id,
        fullPlan,
      });

      console.log("🧪 SAVED ADJUSTED PLAN DAY", {
        day,
        saved: fullPlan[day].map(e => e.name),
      });

      setSetsData(nextWeekPlan.map(hydrateExerciseIfNeeded));
    } catch (e) {
      console.error("❌ FINISH WORKOUT ERROR", e);
    }

    await updateUserSummary({
      userId: user._id,
      summary: summaries.join("\n\n"),
    });

    if (setUser && refreshedUser) {
      setUser(refreshedUser);
    }
    setLoading(false);

    router.replace("/(tabs)/Home");
  };

  return (
    loading ? (
      <ActivityIndicator
        size="large"
        color={Colors.PRIMARY}
        style={{ marginBottom: 50, marginTop: 30, }}
      />
    ) : (
      <View style={styles.finishButton}>
        <Button title="Finish Workout" onPress={handleFinish} />
      </View>
    )
  );
}
