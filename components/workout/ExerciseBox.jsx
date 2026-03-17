import { View, Text, Pressable, Animated, StyleSheet, ScrollView } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { MoreVerticalCircle01FreeIcons } from "@hugeicons/core-free-icons";
import styles from '../../styles/WorkoutStyles';
import Colors from "../../shared/Colors";
import SetButton from "./SetButton";

export default function ExerciseBox({
  exercise,
  exIndex,
  handleSetPress,
  getSetLabel,
  setShowInstructionModal,
  setCurrentExerciseInfo,
  setExerciseOptionsFor,
  restTimer,
  formatTimer,
  setModalVisible,
  setShowWeightModalFor,
  menuVisibleFor,
  setMenuVisibleFor,
  weights,
  setWeights,
  setsData,
  setSetsData,
  updateWeight,
  user,
  convex
}) {
    
  return (
    <Pressable
      onPress={() => {
        setCurrentExerciseInfo(exercise);
        setShowInstructionModal(true);
      }}
    >
      <View style={styles.exerciseBox}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Pressable style={{ marginTop: 10,}} onPress={() => setExerciseOptionsFor(exIndex)}>
            <HugeiconsIcon icon={MoreVerticalCircle01FreeIcons} size={25} color={Colors.PRIMARY}/>
          </Pressable>
        </View>

        <ScrollView
          style={styles.setRow}
          horizontal
          showsHorizontalScrollIndicator={false}
          >
          {exercise.sets.map((set, setIndex) => (
            <SetButton
              key={`${exercise.name}-${setIndex}`}
              label={getSetLabel(exercise, set)}
              done={set.done}
              target={set.target}
              type={exercise.type}
              onPress={() => {
                const setWeight = exercise.sets?.[setIndex]?.weight ?? exercise.weight;
                if (setWeight === null || setWeight === undefined || setWeight === "") {
                  setShowWeightModalFor(exIndex);
                } else {
                  handleSetPress(exIndex, setIndex);
                }
              }}
            />
          ))}
        </ScrollView>


        <Text style={styles.restTimer}>
        {" "}
        <Pressable onPress={() => setModalVisible(true)}>
          {restTimer > 0 ? (
            <Text style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={styles.minutesText}>
                {Math.floor(restTimer / 60)}
              </Text>
              <Text style={styles.colonText}>:</Text>
              <Text style={styles.secondsText}>
                {String(restTimer % 60).padStart(2, "0")}
              </Text>
            </Text>
          ) : (
            <Text style={styles.readyText}>Ready</Text>
          )}
        </Pressable>
        </Text>
      </View>
    </Pressable>
  );
}