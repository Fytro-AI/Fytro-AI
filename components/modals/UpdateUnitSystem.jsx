import React, { useState, useEffect } from "react";
import { Modal, View, Text, Pressable, Platform, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import Colors from "../../shared/Colors";
import styles from "../../styles/WorkoutStyles";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { auth } from "../../services/FirebaseConfig";

export default function UpdateUnitSystem({ visible, onClose, currentUnit }) {
  const [selectedUnit, setSelectedUnit] = useState(currentUnit || "metric");

  const updateUnitSystem = useMutation(api.users.updateUnitSystem);
  const firebaseUser = auth.currentUser;

  useEffect(() => {
    if (visible) {
      setSelectedUnit(currentUnit || "metric");
    }
  }, [visible, currentUnit]);

  const handleConfirm = async () => {
    try {
      if (!firebaseUser?.email) return;
      await updateUnitSystem({
        email: firebaseUser.email,
        unitSystem: selectedUnit,
      });
      onClose(true);
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => onClose(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { gap: 20, paddingVertical: 24 }]}>
          <Text style={[styles.modalTitle, { fontSize: 20 }]}>
            Choose Unit System
          </Text>

          <View style={localStyles.pickerWrapper}>
            <Picker
              selectedValue={selectedUnit}
              onValueChange={(val) => setSelectedUnit(val)}
              mode={Platform.OS === "ios" ? "dialog" : "dropdown"}
            >
              <Picker.Item label="Metric (kg)" value="metric" color={Colors.DARK} />
              <Picker.Item label="Imperial (lb)" value="imperial" color={Colors.DARK} />
            </Picker>
          </View>

          <Pressable
            style={localStyles.confirmBtn}
            onPress={handleConfirm}
          >
            <Text style={localStyles.confirmText}>Confirm</Text>
          </Pressable>

          <Pressable
            style={localStyles.cancelBtn}
            onPress={() => onClose(false)}
          >
            <Text style={localStyles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  pickerWrapper: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.GRAY,
  },
  confirmBtn: {
    padding: 14,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmText: {
    color: Colors.WHITE,
    fontSize: 18,
    fontWeight: "bold",
  },
  cancelBtn: {
    padding: 12,
    backgroundColor: Colors.GRAY,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: "bold",
  },
});
