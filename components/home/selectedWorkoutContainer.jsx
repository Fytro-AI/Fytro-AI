import React from "react";
import { ScrollView, View, Text, Pressable, Button, Modal } from "react-native";
import { BlurView } from "expo-blur";
import * as Animatable from "react-native-animatable";
import Animated, { FadeInLeft, FadeInUp } from "react-native-reanimated";
import Colors from "../../shared/Colors";
import FytroHeader from "../../components/FytroHeader";

export default function SelectedWorkoutContainer({
  styles,
  workout,
  selectedDay,
  setSelectedDay,
  WEEK_DAYS,
  isDayUsed,
  isWorkoutCompleted,
  formatExerciseDetails,
  router,
  showWorkoutModal,
  setShowWorkoutModal,
  expandedDay,
  setExpandedDay,
  subscribed,
  openPaywall,
}) {
  const exercises = workout[selectedDay] || [];
  const isRestDay = exercises.length === 0;
  const dayMeta = WEEK_DAYS.find((d) => d.key === selectedDay);
  const dayLabel = dayMeta ? dayMeta.label : selectedDay;

  const blockedAsCalendarDay = isDayUsed(selectedDay);
  const blockedAsWorkout = isWorkoutCompleted(selectedDay);

  const goStartWorkoutOrPaywall = (dayKey) => {
    if (subscribed) {
      router.push({
        pathname: "/WorkoutScreen/WorkoutScreen",
        params: { day: dayKey },
      });
    } else {
      openPaywall(dayKey);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <FytroHeader />
      <View style={styles.separator} />

      <Pressable onPress={() => setSelectedDay(null)} style={styles.back}>
        <Animated.Text entering={FadeInLeft.duration(400)} style={styles.backText}>
          ←
        </Animated.Text>
      </Pressable>

      <Animated.Text entering={FadeInUp.duration(200)} style={styles.header}>
        {dayLabel}
      </Animated.Text>

      <Animatable.View
        animation="fadeInUp"
        delay={100}
        style={styles.selectedWorkoutContainer}
      >
        {!isRestDay && blockedAsWorkout && (
          <Text style={[styles.restMessage, { color: Colors.CHARCOAL }]}>
            You already completed {dayLabel}'s workout this week ✅
          </Text>
        )}

        {isRestDay && blockedAsCalendarDay && (
          <Text style={[styles.restMessage, { color: Colors.CHARCOAL }]}>
            You've already trained on {dayLabel} this week ✅
          </Text>
        )}

        {isRestDay ? (
          <>
            {!blockedAsCalendarDay ? (
              <Text style={styles.restMessage}>
                You have a rest day on {dayLabel}. Feel like working out today?
                {"\n"}Start a workout on a rest day by clicking the day you want to do on the main page.
              </Text>
            ) : null}
          </>
        ) : (
          <>
            {exercises.map((exercise, index) => (
              <View
                key={index}
                style={[
                  styles.exerciseContainer,
                  !subscribed && { opacity: 0.55 }
                ]}
              >
                <Text style={styles.exerciseName}>
                  • {exercise.exercise ?? exercise.name ?? "Unnamed Exercise"}
                </Text>
                <Text style={styles.exerciseDetails}>
                  {formatExerciseDetails(exercise)}
                </Text>
              </View>
            ))}

            {!blockedAsWorkout && (
              <View style={styles.buttonContainer}>
                <Button
                  title={subscribed ? "Start Workout" : "Unlock full plan"}
                  color={Colors.PRIMARY}
                  onPress={() => goStartWorkoutOrPaywall(selectedDay)}
                />
              </View>
            )}
          </>
        )}
      </Animatable.View>

      <Modal
        animationType="fade"
        transparent
        visible={showWorkoutModal}
        onRequestClose={() => setShowWorkoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={60} tint="dark" style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                Choose a workout to do on {dayLabel}.
              </Text>

              {WEEK_DAYS.map(({ key, label }) => {
                const hasExercises = !!workout[key]?.length;
                if (!hasExercises) return null;

                const workoutDone = isWorkoutCompleted(key);
                const calendarDayUsed = isDayUsed(key);
                const blocked = workoutDone || calendarDayUsed;
                const isExpanded = expandedDay === key;

                if (blocked) {
                  return (
                    <View key={key} style={{ marginBottom: 10, opacity: 0.6 }}>
                      <View
                        style={[
                          styles.modalOption,
                          { backgroundColor: "rgba(255,255,255,0.06)" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalOptionText,
                            { textDecorationLine: "line-through" },
                          ]}
                        >
                          {label} (Done)
                        </Text>
                      </View>
                    </View>
                  );
                }

                return (
                  <View key={key} style={{ marginBottom: 10 }}>
                    <Pressable
                      onPress={() => setExpandedDay(isExpanded ? null : key)}
                      style={styles.modalOption}
                    >
                      <Text style={styles.modalOptionText}>{label}</Text>
                    </Pressable>

                    {isExpanded && (
                      <View style={{ marginTop: 8, paddingHorizontal: 10 }}>
                        {workout[key].map((exercise, idx) => (
                          <View key={idx} style={{ marginBottom: 4 }}>
                            <Text style={{ fontWeight: "bold", color: "#fff" }}>
                              {exercise.exercise ?? exercise.name}
                            </Text>
                            <Text style={{ fontStyle: "italic", color: "#eee" }}>
                              {formatExerciseDetails(exercise)}
                            </Text>
                          </View>
                        ))}

                        <Pressable
                          style={styles.modalStartButton}
                          onPress={() => {
                            setShowWorkoutModal(false);
                            goStartWorkoutOrPaywall(key);
                          }}
                        >
                          <Text style={styles.modalStartText}>
                            Start {label} Workout
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}

              <Pressable
                onPress={() => setShowWorkoutModal(false)}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </BlurView>
        </View>
      </Modal>
    </ScrollView>
  );
}
