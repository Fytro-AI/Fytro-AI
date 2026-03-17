import React, { useState } from "react";
import { Modal, View, Text, Pressable, Vibration } from "react-native";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Colors from "./../../shared/Colors";
import styles from "../../styles/WorkoutStyles";
import Input from "../../components/shared/Input";
import UpdateUnitSystem from "./UpdateUnitSystem";

const LB_PER_KG = 2.20462;

export const toKg = (v) => +(v / LB_PER_KG).toFixed(1);
export const fromKg = (v) => +(v * LB_PER_KG).toFixed(0);


export default function InitialWeightModal({
  visible,
  onClose,
  exerciseName,
  exIndex,
  user,
  setsData,
  setSetsData,
  weights,
  setWeights,
}) {
  const updateWeightMutation = useMutation(api.users.updateWeight);

  const unitSystem = user?.unitSystem ?? "metric";
  const unitLabel = unitSystem === "imperial" ? "lb" : "kg";
  const [showUpdateUnitModal, setShowUpdateUnitModal] = useState(false);

  const handleSubmit = async () => {
    const raw = weights[exIndex] || "";
    const cleaned = raw.replace(",", ".");
    const parsed = parseFloat(cleaned);

    if (isNaN(parsed)) return;

    const weightToSaveKg = unitSystem === "imperial" ? toKg(parsed) : +parsed.toFixed(1);

    const updated = [...setsData];
    updated[exIndex].sets = updated[exIndex].sets.map((set) =>
      set.done === null ? { ...set, weight: weightToSaveKg.toString() } : set
    );
    updated[exIndex].weight = weightToSaveKg.toString();
    setSetsData(updated);

    try {
      await updateWeightMutation({
        email: user.email,
        exercise: setsData[exIndex].name,
        weight: weightToSaveKg,
      });

      Vibration.vibrate(100);
    } catch {}

    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { gap: 20 }]}>
          <Text style={styles.modalTitle}>
            Set starting weight for {exerciseName}{" "}
            <Text
              style={{ textDecorationLine: "underline", color: Colors.PRIMARY }}
              onPress={() => setShowUpdateUnitModal(true)}
            >
              ({unitLabel})
            </Text>
          </Text>

          <Input
            placeholder={`e.g. 50${unitLabel}`}
            keyboardType="numeric"
            value={weights[exIndex] || ""}
            onChangeText={(text) =>
              setWeights((prev) => ({
                ...prev,
                [exIndex]: text.replace(/[^0-9.,]/g, ""),
              }))
            }
            style={styles.modalInput}
          />

          <View style={styles.modalButtonRow}>
            <Pressable style={styles.modalButtonPrimary} onPress={handleSubmit}>
              <Text style={styles.modalButtonPrimaryText}>
                Done
              </Text>
            </Pressable>

            <Pressable onPress={onClose} style={styles.modalButtonSecondary}>
              <Text style={styles.modalButtonSecondaryText}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
      <UpdateUnitSystem
        visible={showUpdateUnitModal}
        currentUnit={unitSystem}
        onClose={(updated) => {
          setShowUpdateUnitModal(false);
          if (updated) {
          }
        }}
      />
    </Modal>
  );
}
