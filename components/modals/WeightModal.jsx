import { Modal, View, Text, Pressable } from "react-native";
import Input from "../shared/Input";
import Colors from "../../shared/Colors";
import styles from "../../styles/WorkoutStyles";

export default function WeightModal({ visible, exerciseName, value, onChange, onSubmit, onCancel }) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { gap: 20 }]}>
          <Text style={styles.modalTitle}>Set the starting weight for {exerciseName} in kg</Text>
          <Input
            placeholder="e.g. 50kg"
            keyboardType="numeric"
            value={value}
            onChangeText={(text) => onChange(text.replace(/[^0-9.,]/g, ""))}
          />
          <Pressable style={{ padding: 14, backgroundColor: Colors.PRIMARY, borderRadius: 10 }} onPress={onSubmit}>
            <Text style={{ fontSize: 18, color: Colors.WHITE, textAlign: "center", fontWeight: "bold" }}>
              Done
            </Text>
          </Pressable>
          <Pressable onPress={onCancel} style={{ padding: 10, borderRadius: 10, backgroundColor: Colors.GRAY }}>
            <Text style={{ textAlign: "center", fontWeight: "bold", fontSize: 16 }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
