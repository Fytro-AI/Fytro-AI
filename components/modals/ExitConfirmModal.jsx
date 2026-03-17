import { View, Text, Modal, Pressable } from "react-native";
import Button from "../shared/Button";
import Colors from "../../shared/Colors";
import styles from "../../styles/WorkoutStyles";

export default function ExitConfirmModal({ visible, onCancel, onLeave }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { gap: 20 }]}>
          <Text style={styles.modalTitle}>Leave workout?</Text>
          <Text style={{ textAlign: "center", fontSize: 18 }}>
            Are you sure you want to leave? Your progress will not be saved.
          </Text>
          <Button title="Leave Without Saving" onPress={onLeave} />
          <Pressable style={styles.modalButtonSecondary} onPress={onCancel}>
            <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}