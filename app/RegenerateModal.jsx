import React from "react";
import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "expo-router";

export default function RegenerateModal({ visible, onClose, credits }) {
  const navigation = useNavigation();

  const confirm = () => {
    if (credits < 3) {
      alert("Not enough credits");
      return;
    }

    onClose();
    navigation.replace("/onboarding");
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Regenerate Workout?</Text>
          <Text style={styles.text}>
            This will cost 3 credits and delete your current workout plan.
          </Text>
          <View style={styles.actions}>
            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.text}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.confirm} onPress={confirm}>
              <Text style={styles.text}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000a" },
  modal: { backgroundColor: "#1e1e1e", padding: 20, borderRadius: 12, width: "80%" },
  title: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 10 },
  text: { color: "#ccc", marginBottom: 10 },
  actions: { flexDirection: "row", justifyContent: "space-between" },
  cancel: { padding: 10 },
  confirm: { padding: 10, backgroundColor: "#4B89DC", borderRadius: 6 },
});
