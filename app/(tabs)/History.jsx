import { useState, useMemo, useContext } from "react";
import {
  Text,
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { auth } from '../../services/FirebaseConfig';
import FytroHeader from "../../components/FytroHeader";
import { Feather } from "@expo/vector-icons";
import Colors from "../../shared/Colors";
import { UserContext } from "../../context/UserContext";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function safeNum(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function groupWorkoutsByDay(workouts) {
  const groups = {};
  workouts.forEach((w) => {
    const ts = w.createdAt ?? w.timestamp ?? Date.now();
    const d = new Date(ts);
    const key = d.toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(w);
  });
  return groups;
}

const weightUnit = (unitSystem) => {
  const u = String(unitSystem || "").toLowerCase().trim();
  return u === "imperial" ? "lbs" : "kgs";
};

export default function History() {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const email = auth.currentUser?.email;

  const { user } = useContext(UserContext);
  if (!user) return null;

  const workouts = useQuery(
    api.workouts.getHistory,
    user?._id ? { userId: user._id } : "skip"
  );

  const unit = useMemo(
    () => weightUnit(user?.unitSystem),
    [user?.unitSystem]
  );

  const grouped = useMemo(() => groupWorkoutsByDay(workouts || []), [workouts]);

  if (!user || !workouts) {
    return <Text style={styles.loading}>Loading workout history...</Text>;
  }

  if (!workouts.length) {
    return (
      <View style={styles.emptyWrapper}>
        <Text style={styles.noData}>No workout history yet 💤</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.screenTitle}>Workout History</Text>

      {Object.entries(grouped).map(([day, workouts], dayIndex) => (
        <View key={dayIndex} style={styles.dayGroup}>
          <Text style={styles.dayLabel}>{day}</Text>
          {workouts.map((workout, index) => {
            const globalIndex = `${dayIndex}-${index}`;
            const isExpanded = expandedIndex === globalIndex;

            const ts = workout.createdAt ?? workout.timestamp ?? Date.now();
            const d = new Date(ts);
            const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            const exercises = Array.isArray(workout.workoutData)
              ? workout.workoutData
              : Array.isArray(workout.exercises)
              ? workout.exercises
              : [];

            const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0);
            const totalVolume = exercises.reduce(
              (sum, ex) =>
                sum +
                (ex.sets || []).reduce((s, set) => s + (safeNum(set.done) || 0) * (safeNum(set.weight) || 0), 0),
              0
            );

            return (
              <View key={globalIndex} style={styles.card}>
                <Pressable
                  onPress={() => {
                    LayoutAnimation.easeInEaseOut();
                    setExpandedIndex(isExpanded ? null : globalIndex);
                  }}
                >
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.date}>{timeStr}</Text>
                      <Text style={styles.statsText}>
                        {totalSets} sets • {totalVolume} {unit} lifted
                      </Text>
                    </View>
                    <Feather
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={22}
                      color={Colors.CHARCOAL}
                    />
                  </View>
                </Pressable>

                {isExpanded && (
                  <View style={styles.exerciseList}>
                    {exercises.length === 0 ? (
                      <Text style={styles.noExercise}>No exercises logged</Text>
                    ) : (
                      exercises.map((exercise, i) => (
                        <View key={i} style={styles.exerciseBlock}>
                          <Text style={styles.exerciseName}>{exercise.name}</Text>
                          {(exercise.sets || []).map((set, sIdx) => {
                            const done = safeNum(set.done);
                            const target = safeNum(set.target);
                            const weight = safeNum(set.weight);
                            return (
                              <View key={sIdx} style={styles.setBox}>
                                <Text style={styles.setText}>
                                  Set {sIdx + 1}: {done ?? "-"} reps @ {weight ?? "N/A"}{unit}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEEEEE",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 30,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "900",
    marginVertical: 20,
    color: Colors.CHARCOAL,
  },
  loading: {
    padding: 20,
    fontSize: 18,
    color: "#888"
  },
  noData: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 40
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  dayGroup: {
    marginBottom: 24
  },
  dayLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.PRIMARY,
    marginBottom: 12
  },
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  date: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.CHARCOAL
  },
  statsText: {
    fontSize: 14,
    color: "#555"
  },
  exerciseList: {
    marginTop: 10
  },
  exerciseBlock: {
    marginTop: 12
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.PRIMARY,
    marginBottom: 6
  },
  setBox: {
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
    backgroundColor: "#F4F4F4",
  },
  setPerfect: {
    backgroundColor: "#4caf50",
  },
  setOk: {
    backgroundColor: "#352a17ff",
  },
  setBad: {
    backgroundColor: "#f44336",
  },
  setText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.CHARCOAL
  },
  noExercise: {
    color: "#777",
    fontStyle: "italic"
  },
  separator: {
    height: 1,
    width: "120%",
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
    borderRadius: 10,
    marginBottom: 10,
  },
});
