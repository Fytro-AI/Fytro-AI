import React, { useState } from "react";
import { Modal, View, Pressable, Text } from "react-native";
import Input from "../../components/shared/Input";
import Colors from "../../shared/Colors";
import styles from "../../styles/WorkoutStyles";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { auth } from "../../services/FirebaseConfig";
import UpdateUnitSystem from "./UpdateUnitSystem";

const LB_PER_KG = 2.20462;

export const toKg = (v) => +(v / LB_PER_KG).toFixed(1);
export const fromKg = (v) => +(v * LB_PER_KG).toFixed(0);


export default function EditWeightModal({
  visible,
  onClose,
  exerciseName,
  tempWeight,
  setTempWeight,
  onSave,
}) {
  const firebaseUser = auth.currentUser;
  const convUser = useQuery(api.users.GetUser, { email: firebaseUser?.email }, { skip: !firebaseUser?.email });
  const [showUpdateUnitModal, setShowUpdateUnitModal] = useState(false);

  const unitSystem = convUser?.unitSystem ?? "metric";
  const unitLabel = unitSystem === "imperial" ? "lb" : "kg";

  const handleSavePress = () => {
    const cleaned = (tempWeight || "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed)) return;

    if (typeof onSave === "function") {
      try {
        onSave(parsed, unitSystem);
      } catch {}
    }

    setTempWeight("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Change weight for {exerciseName}{" "}
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
            value={tempWeight}
            onChangeText={(t) => setTempWeight(t)}
            style={styles.modalInput}
          />

          <View style={styles.modalButtonRow}>
            <Pressable style={styles.modalButtonPrimary} onPress={handleSavePress}>
              <Text style={styles.modalButtonPrimaryText}>Save</Text>
            </Pressable>

            <Pressable
              style={styles.modalButtonSecondary}
              onPress={() => { setTempWeight(""); onClose(); }}
            >
              <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
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
