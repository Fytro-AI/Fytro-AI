import { 
  Modal, View, Text, ScrollView, Pressable, 
  TouchableWithoutFeedback, Keyboard, Alert 
} from "react-native";
import { useState } from "react";
import Colors from "../../shared/Colors";
import styles from "../../styles/WorkoutStyles";
import Input from "../shared/Input";

export default function ReplaceExerciseModal({
  visible,
  exercises,
  onReplace,
  onCancel,
  searchTerm,
  onSearchChange
}) {
  const [selectedExercise, setSelectedExercise] = useState(null);

  const handleAdd = () => {
    if (!selectedExercise) return;

    Alert.alert(
      "Are you sure?",
      "This change will affect all future workouts.",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => {
            onReplace(selectedExercise);
            setSelectedExercise(null);
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { gap: 12 }]}>
            <Text style={styles.modalTitle}>Replace with:</Text>

            <Input
              placeholder="Search exercises..."
              placeholderTextColor="#000"
              value={searchTerm}
              onChangeText={onSearchChange}
              style={styles.modalInput}
            />

            <ScrollView style={{ maxHeight: 400 }}>
              {exercises.map((exercise, idx) => {
                const name = typeof exercise === "string" ? exercise : exercise.name;
                const isSelected = selectedExercise?.name === name;

                return (
                  <Pressable
                    key={`${name}-${idx}`}
                    style={[
                      styles.modalOption,
                      isSelected && { backgroundColor: Colors.LIGHTGRAY },
                    ]}
                    onPress={() =>
                      setSelectedExercise({
                        ...exercise,
                        name,
                        type: exercise.type || "reps",
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && { fontWeight: "bold", color: Colors.PRIMARY },
                      ]}
                    >
                      {name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              disabled={!selectedExercise}
              style={[
                styles.modalOption,
                { 
                  backgroundColor: selectedExercise ? Colors.PRIMARY : Colors.GRAY, 
                  borderRadius: 10 
                },
              ]}
              onPress={handleAdd}
            >
              <Text style={{ 
                fontSize: 20,
                textAlign: "center",
                fontWeight: "bold",
                color: Colors.WHITE,
              }}>
                Add
              </Text>
            </Pressable>

            <Pressable
              style={[styles.modalOption, { backgroundColor: Colors.GRAY, borderRadius: 10 }]}
              onPress={() => {
                setSelectedExercise(null);
                onCancel();
              }}
            >
              <Text style={{ 
                fontSize: 20,
                textAlign: "center",
                fontWeight: "bold",
                color: Colors.WHITE,
              }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
