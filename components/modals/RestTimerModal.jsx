import { Modal, View, FlatList, Pressable, Text, Alert } from "react-native";
import Colors from "../../shared/Colors";
import styles from "../../styles/WorkoutStyles";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { auth } from "../../services/FirebaseConfig";

export default function RestTimerModal({ visible, onClose, onSelect, onSaveDefault }) {
  const options = [30, 45, 60, 90, 120, 150, 180, 210];

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const firebaseUser = auth.currentUser;
  const updateFormatTimerMutation = useMutation(api.users.updateFormatTimer);

  const handleChangeTimer = (seconds) => {
    Alert.alert(
      "Set as default?",
      `Do you want to set ${formatTimer(seconds)} as your default rest time?`,
      [
        {
          text: "No",
          style: "cancel",
          onPress: () => {
            onSelect?.(seconds);
            onClose?.();
          },
        },
        {
          text: "Yes",
          onPress: async () => {
            try {
              onSaveDefault?.(seconds);

              if (firebaseUser?.email) {
                await updateFormatTimerMutation({
                  email: firebaseUser.email,
                  restTimer: formatTimer(seconds),
                });
              }

              onSelect?.(seconds);
              onClose?.();
            } catch {}
          },
        },
      ]
    );
  };


  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Rest Time</Text>

          <FlatList
            data={options}
            keyExtractor={(item) => item.toString()}
            renderItem={({ item }) => (
              <Pressable
                style={styles.modalOption}
                onPress={() => handleChangeTimer(item)}
              >
                <Text style={styles.modalOptionText}>{formatTimer(item)}</Text>
              </Pressable>
            )}
          />

          <Pressable
            style={[styles.modalOption, { backgroundColor: Colors.GRAY, marginTop: 10, borderRadius: 10 }]}
            onPress={onClose}
          >
            <Text style={styles.modalOptionText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

