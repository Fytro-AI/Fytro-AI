import React, { useMemo } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import * as Animatable from "react-native-animatable";
import Animated, { FadeInLeft, FadeInUp } from "react-native-reanimated";
import FytroHeader from "../FytroHeader";
import Colors from "../../shared/Colors";

function normalizeDay(val) {
  if (!val) return null;
  const s = String(val).trim().toLowerCase();
  const map = {
    sun: "Sun", sunday: "Sun",
    mon: "Mon", monday: "Mon",
    tue: "Tue", tues: "Tue", tuesday: "Tue",
    wed: "Wed", wednesday: "Wed",
    thu: "Thu", thur: "Thu", thurs: "Thu", thursday: "Thu",
    fri: "Fri", friday: "Fri",
    sat: "Sat", saturday: "Sat",
  };
  const k = s.slice(0, 3);
  return map[s] ?? map[k] ?? null;
}

export default function CompletedWorkoutsContainer({
  styles,
  allLogs,
  WEEK_DAYS,
  onBack,
}) {
  const completedByDay = useMemo(() => {
    // we count by programDay so it matches your "Completed" logic
    const map = new Map(); // "Mon" -> log
    for (const w of allLogs ?? []) {
      const day = normalizeDay(w?.programDay);
      if (!day) continue;

      // keep latest log per program day
      const existing = map.get(day);
      if (!existing || (w?.timestamp ?? 0) > (existing?.timestamp ?? 0)) {
        map.set(day, w);
      }
    }
    return map;
  }, [allLogs]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <FytroHeader />
      <View style={styles.separator} />

      <Pressable onPress={onBack} style={styles.back}>
        <Animated.Text entering={FadeInLeft.duration(400)} style={styles.backText}>
          ←
        </Animated.Text>
      </Pressable>

      <Animated.Text entering={FadeInUp.duration(200)} style={styles.header}>
        Completed Workouts
      </Animated.Text>

      <Animatable.View animation="fadeInUp" delay={100} style={styles.selectedWorkoutContainer}>
        <Text style={[styles.subheader, { marginBottom: 12 }]}>
          Your completed workouts this week:
        </Text>

        {WEEK_DAYS.map(({ key, label }) => {
          const log = completedByDay.get(key);

          if (!log) return null;

          const exerciseCount = Array.isArray(log.exercises) ? log.exercises.length : 0;

          return (
            <View key={key} style={styles.exerciseContainer}>
              <Text style={styles.exerciseName}>
                ✅ {label}
              </Text>
              <Text style={styles.exerciseDetails}>
                {exerciseCount} exercises • {new Date(log.timestamp).toLocaleString()}
              </Text>
            </View>
          );
        })}

        {completedByDay.size === 0 && (
          <Text style={[styles.restMessage, { color: Colors.CHARCOAL }]}>
            No completed workouts yet this week.
          </Text>
        )}
      </Animatable.View>
    </ScrollView>
  );
}
