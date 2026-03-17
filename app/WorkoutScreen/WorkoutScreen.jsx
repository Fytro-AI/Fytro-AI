import { useEffect, useState, useRef } from "react";
import { Animated, Modal, LayoutAnimation, UIManager, Platform, View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { auth } from "../../services/FirebaseConfig";
import Colors from "../../shared/Colors";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { CancelSquareIcon, Door01FreeIcons } from "@hugeicons/core-free-icons";
import { ALL_EXERCISES, findExerciseMeta } from "../../constants/exercises";
import FinishWorkoutButton from "../../components/workout/FinishWorkoutButton";
import ExerciseBox from "../../components/workout/ExerciseBox";
import ExitConfirmModal from "../../components/modals/ExitConfirmModal";
import RestTimerModal from "../../components/modals/RestTimerModal";
import ReplaceExerciseModal from "../../components/modals/ReplaceExerciseModal";
import styles from "../../styles/WorkoutStyles";
import EditWeightModal from "../../components/modals/EditWeightModal";
import InitialWeightModal from "../../components/modals/InitialWeightModal";
import FytroHeader from "../../components/FytroHeader";
import { useRestTimer } from "../../hooks/useRestTimer";
import { EXERCISE_PROGRESSION } from "../../constants/exercises/progressionMapping";
import InstructionModal from "../../components/modals/InstructionModal";

  export function hydrateExerciseIfNeeded(exercise) {
    if (Array.isArray(exercise.sets)) {
    return {
      name: exercise.name ?? exercise.exercise,
      type: exercise.type,
      weight: null,
      sets: exercise.sets.map(s => ({
        ...s,
        done: null,
      })),
    };
  }

  const [min, max] = exercise.reps
    ? exercise.reps.split("-").map(Number)
    : [8, 12];

  const setsCount = Number(exercise.sets) || 3;

  return {
    name: exercise.exercise,
    type: exercise.type,
    weight: null,
    sets: Array.from({ length: setsCount }, () => ({
      done: null,
      target: { min, max },
      weight: null,
    })),
  };
}

const LB_PER_KG = 2.20462;

const toKg = (v) => +(v / LB_PER_KG).toFixed(1);
const fromKg = (v) => +(v * LB_PER_KG).toFixed(0);

export default function WorkoutScreen() {

  if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const convex = useConvex();

  const router = useRouter();
  const { day } = useLocalSearchParams();
  
  const [setsData, setSetsData] = useState([]);
  const [pendingWeightUpdates, setPendingWeightUpdates] = useState([]);
  const updateFormatTimer = useMutation(api.users.updateFormatTimer);

  const [menuVisibleFor, setMenuVisibleFor] = useState(null);
  const [editWeightModalFor, setEditWeightModalFor] = useState(null);
  const [tempWeight, setTempWeight] = useState("");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exerciseOptionsFor, setExerciseOptionsFor] = useState(null);
  const [replaceExerciseIndex, setReplaceExerciseIndex] = useState(null);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [currentExerciseInfo, setCurrentExerciseInfo] = useState(null);
  const latestWorkoutForDay = useQuery(api.workouts.getLatestWorkoutForDay, {
    userId: user?._id,
    day,
  }, {
    skip: !user?._id || !day
  });
  
  const { remaining: restTimer, running: timerRunning, start: startRestTimer, reset: resetRestTimer } = useRestTimer(120);
  const [initialRestTime, setInitialRestTime] = useState(120);

  const [modalVisible, setModalVisible] = useState(false);

  const [showWeightModalFor, setShowWeightModalFor] = useState(null);

  const [showExerciseModal, setShowExerciseModal] = useState(false);

  const updateWeight = useMutation(api.users.updateWeight);
  const updateWeightProgression = useMutation(api.users.updateWeightProgression);

  const [weights, setWeights] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const firebaseUser = auth.currentUser;
  const email = firebaseUser?.email;
  
  const [userData, setUserData] = useState(null);
    useEffect(() => {
      if (!email) return;
      convex.query(api.users.GetUser, { email }).then(setUserData);
    }, [email]);

  const [recentlyUpdatedExercise, setRecentlyUpdatedExercise] = useState(null);
  const [setsDataInitialized, setSetsDataInitialized] = useState(false);

  const user = useQuery(api.users.GetUser, { email }, {
    skip: !email,
  });

  const completed = useQuery(
    api.workouts.getLoggedWorkouts,
    user?._id ? { userId: user._id } : "skip"
  );


  const animationRefs = useRef([]);

  const filteredExercises = ALL_EXERCISES.filter((ex) =>
    ex.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [lastWorkoutData, setLastWorkoutData] = useState([]);

  const handleStartWorkout = () => {
    setActiveWorkout({
      day,
      exercises: setsData,
    });
  };

  useEffect(() => {
    if (!user) return;

    const defaultRest = user?.restTimer
      ? parseRestTimerString(user.restTimer)
      : 120;

    setInitialRestTime(defaultRest);
  }, [user]);

  function parseRestTimerString(str) {
    if (!str) return 120;
    const [mins, secs] = str.split(":").map(Number);
    return (mins * 60) + (secs || 0);
  }

  useEffect(() => {
    if (!user?._id || !day || !completed || setsDataInitialized) return;
    if (!setsData.length) return;

    let updated = [...setsData];
    let changed = false;

    updated = setsData.map((exercise) => {
      if (exercise.name === recentlyUpdatedExercise) return exercise;

      const recentEntry = [...completed]
        .reverse()
        .find((entry) =>
          entry.workoutData?.some((e) => e.name === exercise.name)
        );

      const lastMatch = recentEntry?.workoutData?.find((e) => e.name === exercise.name);
      if (!lastMatch) return exercise;

      const updatedSets = exercise.sets.map((set) => {
        const weightFromSet = parseFloat(set.weight);
        const meta = userData?.weights?.[exercise.name];
        const fallbackWeight = typeof meta?.weight === "number" ? meta.weight : exercise.weight ?? "";


        return {
          ...set,
          weight:
            !isNaN(weightFromSet) && weightFromSet > 0
              ? weightFromSet.toFixed(1)
              : fallbackWeight,
        };
      });


      const newWeight = lastMatch.weight || exercise.weight || "";
      if (exercise.weight !== newWeight) changed = true;

      return {
        ...exercise,
        sets: updatedSets,
        weight: String(newWeight),
      };
    });

    if (changed) {
      setSetsData(updated);
    }
  }, [user?._id, day, completed, userData]);

  useEffect(() => {
    if (!user || !day || setsDataInitialized) return;

    const todayPlan =
      user.adjustedWorkout?.[day] || user.workout?.[day];

    if (!todayPlan) return;

    const hydrated = todayPlan.map(hydrateExerciseIfNeeded);

    setSetsData(hydrated);
    setSetsDataInitialized(true);
  }, [user, day, setsDataInitialized]);

  useEffect(() => {
    if (!setsData.length) return;

    animationRefs.current = setsData.map((exercise) =>
      exercise.sets.map(() => new Animated.Value(0))
    );
  }, [setsData]);


  const parseWorkoutDay = (dayWorkout) => {
    return (dayWorkout ?? []).map((item) => {
      const name = item.exercise;
      const setsCount = Number(item.sets) || 3;
      const type = item.type?.toLowerCase?.() || (
        toLowerCase().includes("plank") ? "time" : "reps"
      );

      let min = 0;
      let max = 0;
      const repsStr = item.reps?.trim?.() ?? "";

      if (type === "time") {
        min = 30;
        max = 60;
      } else if (repsStr.includes("-")) {
        const [rawMin, rawMax] = repsStr.split("-").map(Number);
        min = isNaN(rawMin) ? 8 : rawMin;
        max = isNaN(rawMax) ? 12 : rawMax;
      } else if (repsStr.toLowerCase() === "max") {
        min = null;
        max = "max";
      } else {
        const single = Number(repsStr);
        min = max = isNaN(single) ? 10 : single;
      }

      const lastLog = lastWorkoutData?.find((e) => e.name === name);

      const sets = Array.from({ length: setsCount }, (_, i) => {
        const previousWeight = lastLog?.sets?.[i]?.weight || item.weight || "";
        return {
          target: { min, max },
          done: null,
          weight: String(previousWeight),
        };
      });

      return { name, sets, weight: String(item.weight) || "", type };
    });
  };

  const handleEditWeightOnlyUndoneSets = (exerciseIndex, newWeight) => {
    const updated = [...setsData];

    updated[exerciseIndex].sets = updated[exerciseIndex].sets.map((set) =>
      set.done === null ? { ...set, weight: String(newWeight) } : set
    );

    setSetsData(updated);
    setRecentlyUpdatedExercise(setsData[exerciseIndex].name);
  };



  useEffect(() => {
    if (!pendingWeightUpdates.length || !user?.email || !updateWeightProgression) return;

    const applyUpdates = async () => {
      for (const update of pendingWeightUpdates) {
        const { exerciseName, newWeight } = update;

        try {
          await updateWeightProgression({
            email: user.email,
            exercise: exerciseName,
            newWeight: String(newWeight),
            result: "manual",
          });
        } catch {}
      }

      setPendingWeightUpdates([]);
    };

    applyUpdates();
  }, [pendingWeightUpdates, user?.email, updateWeightProgression]);

  const parseTargetValue = (v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const s = v.trim();
      if (!s) return null;
      if (s.toLowerCase() === "max") return "max";
      const n = Number(s);
      return Number.isNaN(n) ? null : n;
    }
    return null;
  };

  const isMaxTarget = (target) => {
    if (!target) return false;
    if (typeof target === "string") return target.trim().toLowerCase() === "max";
    if (typeof target === "object") {
      if (target.isMax === true) return true;
      if (typeof target.min === "string" && target.min.toLowerCase?.() === "max") return true;
      if (typeof target.max === "string" && target.max.toLowerCase?.() === "max") return true;
    }
    return false;
  };

  const getNumericTarget = (target, type = "reps") => {
    if (isMaxTarget(target)) return { min: null, max: "max" };

    if (typeof target === "number") return { min: target, max: target };
    if (typeof target === "string") {
      const s = target.trim();
      if (s.includes("-")) {
        const [a, b] = s.split("-").map(x => parseInt(x, 10));
        return { min: Number.isNaN(a) ? (type === "time" ? 30 : 8) : a,
                max: Number.isNaN(b) ? (type === "time" ? 60 : 12) : b };
      }
      const n = Number(s);
      return { min: Number.isNaN(n) ? (type === "time" ? 30 : 8) : n,
              max: Number.isNaN(n) ? (type === "time" ? 60 : 12) : n };
    }
    if (typeof target === "object") {
      const minVal = parseTargetValue(target.min);
      const maxVal = parseTargetValue(target.max);

      if (minVal === "max" || maxVal === "max") {
        return { min: null, max: "max" };
      }

      const min = minVal ?? (type === "time" ? 30 : 8);
      const max = maxVal ?? (type === "time" ? 60 : 12);
      return { min, max };
    }


    return { min: type === "time" ? 30 : 8, max: type === "time" ? 60 : 12 };
  };

  const getSetLabel = (exercise, set) => {
    const isValidWeight = (w) =>
    (typeof w === "number" && !isNaN(w)) ||
    (typeof w === "string" && w.trim() !== "" && w !== "undefined");


    const weightRaw =
      isValidWeight(set.weight) ? set.weight :
      isValidWeight(exercise.weight) ? exercise.weight :
      null;

    const unit = user?.unitSystem === "imperial" ? "lb" : "kg";

    const displayWeight =
      user?.unitSystem === "imperial"
        ? fromKg(Number(weightRaw))
        : Number(weightRaw);

    const weightLabel = `${displayWeight}${unit} `;

    const target = set.target;
    if (isMaxTarget(target)) {
      if (set.done == null) return `${weightLabel}Max`;
      return `${weightLabel}${set.done}/Max`;
    }

    const { min, max } = getNumericTarget(target, exercise.type);

    if (exercise.type === "time") {
      const fmt = (s) => {
        if (s === null || s === undefined) return "0:00";
        if (s >= 60) return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
        return `${s}s`;
      };
      if (set.done == null) {
        if (min === max) return `${weightLabel}${fmt(max)}`;
        return `${weightLabel}${fmt(min)}-${fmt(max)}`;
      }
      return `${weightLabel}${fmt(set.done)}/${fmt(max)}`;
    }

    if (set.done == null) {
      if (min === max) return `${weightLabel}${max}`;
      return `${weightLabel}${min}-${max}`;
    }
    return `${weightLabel}${set.done}/${max}`;
  };


  const getSetAnimatedStyle = (done, target, exerciseIndex, setIndex) => {
    const progress = animationRefs.current?.[exerciseIndex]?.[setIndex];
    if (!progress) return {};

    if (isMaxTarget(target)) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();

      const bgColor = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [Colors.PRIMARY, "#4caf50"],
      });

      return { backgroundColor: bgColor };
    }

    const { min, max } = getNumericTarget(target);
    let targetProgress = 0;
    let fromColor = 'black';
    let toColor = 'black';

    if (done === null) {
      targetProgress = 0;
      fromColor = 'black';
      toColor = 'black';
    } else if (typeof min === "number" && typeof max === "number" && done >= min && done <= max) {
      targetProgress = 1;
      toColor = "#3a8a3cff";
    } else if (typeof min === "number" && done >= Math.floor(min * 0.75)) {
      targetProgress = 1;
      toColor = "#e38503ff";
    } else {
      targetProgress = 1;
      toColor = "#cd1104ff";
    }

    Animated.timing(progress, {
      toValue: targetProgress,
      duration: 400,
      useNativeDriver: false,
    }).start();

    const bgColor = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [fromColor, toColor],
    });

    return { backgroundColor: bgColor };
  };

  const handleSetPress = (exerciseIndex, setIndex) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const updated = [...setsData];
    const set = updated[exerciseIndex].sets[setIndex];
    const exercise = updated[exerciseIndex];

    if (exercise.type === "time") {
      if (set.done === null) {
        set.done = set.target.max;
        if (!set.restStarted) {
          startRestTimer(initialRestTime);
          set.restStarted = true;
        }
      } else {
        set.done -= 5;
        if (set.done <= 0) {
          set.done = null;
        }
      }
      setSetsData(updated);
      return;
    }

    if (set.done === null) {
      set.done = set.target.max;
      if (!set.restStarted) {
        startRestTimer(initialRestTime);
        set.restStarted = true;
      }
    } else {
      set.done -= 1;
      if (set.done < 0) {
        set.done = null;
      }
    }

    setSetsData(updated);
  };


  const handleWeightChange = (exerciseIndex, setIndex, value) => {
    const updated = [...setsData];
    const cleanValue = value.replace(/[^0-9.,]/g, "").replace(",", ".");
    updated[exerciseIndex].sets[setIndex].weight = cleanValue;
    setSetsData(updated);
  };

  const getSetStyle = (done, target) => {
    if (isMaxTarget(target)) return styles.setPerfect;
    if (done === null) return styles.setDefault;

    const { min, max } = getNumericTarget(target);
    if (typeof min === "number" && typeof max === "number" && done >= min && done <= max) return styles.setPerfect;
    if (typeof min === "number" && done >= Math.floor(min * 0.75)) return styles.setOk;
    return styles.setBad;
  };

  const formatTimer = (seconds) => {
    if (typeof seconds !== "number" || isNaN(seconds)) {
      return "Max";
    }

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };


  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Loading workout...</Text>
      </View>
    );
  }

  // const hydrated = setsData.map((exercise) => {
  //   const hasUserWeight = user?.weights?.hasOwnProperty(exercise.name);

  //   return {
  //     ...exercise,
  //     sets: Array.isArray(exercise.sets)
  //       ? exercise.sets.map((set) => ({
  //           ...set,
  //           weight:
  //             set.weight !== undefined && set.weight !== ""
  //               ? set.weight
  //               : hasUserWeight
  //               ? user.weights[exercise.name].weight
  //               : null,
  //         }))
  //       : [],
  //   };
  // });

  return (
    <>
      <ScrollView style={styles.container}>
        <FytroHeader />
        <View style={styles.separator} />

        <View style={styles.someShiIdk2}>
          <Pressable
            style={styles.exitConfirm}
            onPress={() => setShowExitConfirm(true)}
          >
            <View style={{ marginBottom: 20 }}>
              <HugeiconsIcon icon={CancelSquareIcon} size={40} color={Colors.PRIMARY} />
            </View>
          </Pressable>

          <View style={{ marginBottom: 10, borderRadius: 16, width: 'auto'}}>
            <Text style={styles.header}>{day} Workout</Text>
          </View>
        </View>


      {setsData.map((exercise, i) => (
        <ExerciseBox
          key={`${exercise.name}-${i}`}
          exercise={exercise}
          exIndex={i}
          handleSetPress={handleSetPress}
          getSetLabel={getSetLabel}
          getSetAnimatedStyle={getSetAnimatedStyle}
          setShowInstructionModal={setShowInstructionModal}
          setCurrentExerciseInfo={setCurrentExerciseInfo}
          setExerciseOptionsFor={setExerciseOptionsFor}
          animationRefs={animationRefs}
          styles={styles}
          restTimer={restTimer}
          formatTimer={formatTimer}
          setModalVisible={setModalVisible}
          setShowWeightModalFor={setShowWeightModalFor}
          menuVisibleFor={menuVisibleFor}
          setMenuVisibleFor={setMenuVisibleFor}
          weights={weights}
          setWeights={setWeights}
          setsData={setsData}
          setSetsData={setSetsData}
          updateWeight={updateWeight}
          user={user}
          convex={convex}
        />
      ))}

        <FinishWorkoutButton
          setsData={setsData}
          setSetsData={setSetsData}
          user={user}
          day={day}
          router={router}
        />

        {exerciseOptionsFor !== null && (
          <Modal
            transparent
            animationType="fade"
            visible={true}
            onRequestClose={() => setExerciseOptionsFor(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { gap: 16 }]}>
                <Text style={styles.modalTitle}>Exercise Options</Text>

                <Pressable onPress={() => {
                  setEditWeightModalFor(exerciseOptionsFor);
                  setExerciseOptionsFor(null);
                }}>
                  <Text style={styles.modalOptionText}>Adjust Weight</Text>
                </Pressable>

                <Pressable onPress={() => {
                  setSetsData(prev => prev.filter((_, i) => i !== exerciseOptionsFor));
                  setExerciseOptionsFor(null);
                }}>
                  <Text style={styles.modalOptionText}>Remove Exercise</Text>
                </Pressable>

                <Pressable onPress={() => {
                  setReplaceExerciseIndex(exerciseOptionsFor);
                  setExerciseOptionsFor(null);
                }}>
                  <Text style={styles.modalOptionText}>Replace Exercise</Text>
                </Pressable>

                <Pressable onPress={() => setExerciseOptionsFor(null)}>
                  <Text style={[styles.modalOptionText, { color: Colors.GRAY }]}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        )}

        {showExerciseModal && (
          <Modal
            transparent
            animationType="slide"
            visible={true}
            onRequestClose={() => setShowExerciseModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { gap: 12 }]}>
                <Text style={styles.modalTitle}>Select an exercise to add</Text>

                <TextInput
                  placeholder="Search exercises..."
                  placeholderTextColor={'#000'}
                  value={searchTerm}
                  onChangeText={(text) => setSearchTerm(text)}
                  style={{
                    borderWidth: 1,
                    borderColor: Colors.GRAY,
                    padding: 10,
                    borderRadius: 10,
                    marginBottom: 10,
                    backgroundColor: Colors.LIGHTGRAY,
                    fontSize: 16,
                  }}
                />

                <ScrollView style={{ maxHeight: 400 }}>
                  {filteredExercises?.map((exercise, idx) => (
                    <Pressable
                      key={`${exercise.name}-${idx}`}
                      style={styles.modalOption}
                      onPress={() => {
                        const newExercise = {
                          name: exercise.name,
                          type: exercise.type,
                          sets: Array.from({ length: 3 }, () => ({
                            target: {
                              min: exercise.type === "reps" ? 8 : 30,
                              max: exercise.type === "reps" ? 12 : 60,
                            },
                            done: null,
                          })),
                          weight: "",
                        };
                        setSetsData((prev) => [...prev, newExercise]);
                        setShowExerciseModal(false);
                      }}
                    >
                      <Text style={styles.modalOptionText}>{exercise.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Pressable
                  style={[styles.modalOption, { backgroundColor: Colors.GRAY, borderRadius: 10 }]}
                  onPress={() => setShowExerciseModal(false)}
                >
                  <Text style={styles.modalOptionText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        )}

        <InitialWeightModal
          visible={showWeightModalFor !== null}
          onClose={() => setShowWeightModalFor(null)}
          exerciseName={setsData[showWeightModalFor]?.name}
          exIndex={showWeightModalFor}
          user={user}
          setsData={setsData}
          setSetsData={setSetsData}
          weights={weights}
          setWeights={setWeights}
        />
      </ScrollView>

      <RestTimerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={(timeInSeconds) => {
          setInitialRestTime(timeInSeconds);
          startRestTimer(timeInSeconds);
        }}
        onSaveDefault={async (timeInSeconds) => {
          setInitialRestTime(timeInSeconds);
          try {
            await updateFormatTimer({
              email: user.email,
              restTimer: formatTimer(timeInSeconds),
            });
          } catch {}
        }}
      />

      <InstructionModal
        visible={showInstructionModal}
        onClose={() => setShowInstructionModal(false)}
        exerciseInfo={currentExerciseInfo}
      />

      {typeof replaceExerciseIndex === "number" && (
        <ReplaceExerciseModal
          visible={true}
          exercises={filteredExercises}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReplace={(exercise) => {
            const name = exercise.name || exercise;
            const progression = EXERCISE_PROGRESSION[name];
            const type = progression?.type || "reps";

            const hasUserWeight = user?.weights?.hasOwnProperty(name);
            const defaultWeight = null;

            setSetsData((prev) => {
              const newSet = [...prev];
              newSet[replaceExerciseIndex] = {
                name,
                type,
                weight: null,
                sets: Array.from({ length: 3 }, () => ({
                  weight: null,
                  target:
                    type === "reps"
                      ? { min: progression?.repRange?.[0] ?? 8, max: progression?.repRange?.at(-1) ?? 12 }
                      : type === "time"
                      ? { min: progression?.timeRange?.[0] ?? 30, max: progression?.timeRange?.at(-1) ?? 60 }
                      : { min: 8, max: 12 },
                  done: null,
                })),
              };
              return newSet;
            });

            setReplaceExerciseIndex(null);
            setSearchTerm("");
            setExerciseOptionsFor(null);
            setMenuVisibleFor(null);
          }}
          onCancel={() => setReplaceExerciseIndex(null)}
        />
      )}

      <EditWeightModal
        visible={editWeightModalFor !== null}
        onClose={() => setEditWeightModalFor(null)}
        exerciseName={setsData[editWeightModalFor]?.name}
        tempWeight={tempWeight}
        setTempWeight={setTempWeight}
        onSave={(value, unit) => {
          const kg = unit === "imperial" ? toKg(value) : value;

          const exerciseName = setsData[editWeightModalFor]?.name;

          handleEditWeightOnlyUndoneSets(editWeightModalFor, kg);

          setPendingWeightUpdates((prev) => [
            ...prev,
            { exerciseName, newWeight: kg },
          ]);

          setEditWeightModalFor(null);
          setTempWeight("");
        }}
      />

      <ExitConfirmModal
        visible={showExitConfirm}
        onCancel={() => setShowExitConfirm(false)}
        onLeave={() => router.replace("/(tabs)/Home")}
      />
    </>
  )
}