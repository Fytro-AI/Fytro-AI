import React, { useMemo, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import styles from "../../styles/WorkoutStyles";
import { getExerciseMedia } from "../../constants/exercises/media";

function cleanStep(step) {
  return String(step || "")
    .replace(/^tip:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function InstructionModal({ visible, onClose, exerciseInfo }) {
  const { imageUrls, instructions } = useMemo(() => {
    return getExerciseMedia(exerciseInfo?.name);
  }, [exerciseInfo?.name]);

  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? instructions : instructions.slice(0, 3);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: "85%" }]}>

          {/* SCROLLABLE CONTENT */}
          <ScrollView contentContainerStyle={{ gap: 20, paddingBottom: 10 }}>
            <Text style={styles.modalTitle}>{exerciseInfo?.name}</Text>

            {/* Images */}
            {imageUrls.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {imageUrls.map((url) => (
                  <View key={url} style={{ marginRight: 12 }}>
                    <Image
                      source={{ uri: url }}
                      style={{ width: 260, height: 260, borderRadius: 16 }}
                      contentFit="cover"
                      cachePolicy="disk"
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.modalDescription}>
                No instruction images found for this exercise. More instructions coming soon!
              </Text>
            )}

            {/* Instructions */}
            {instructions.length > 0 && (
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: "700" }}>How to</Text>

                <View style={{ gap: 10 }}>
                  {shown.map((step, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        padding: 12,
                        borderRadius: 14,
                        backgroundColor: "#f3f3f3",
                      }}
                    >
                      <Text
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          textAlign: "center",
                          lineHeight: 26,
                          fontWeight: "800",
                          backgroundColor: "#ddd",
                        }}
                      >
                        {i + 1}
                      </Text>

                      <Text style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>
                        {cleanStep(step)}
                      </Text>
                    </View>
                  ))}
                </View>

                {instructions.length > 3 && (
                  <Pressable onPress={() => setExpanded((v) => !v)}>
                    <Text style={{ textAlign: "center", fontWeight: "700" }}>
                      {expanded
                        ? "Show less"
                        : `Show ${instructions.length - 3} more`}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>

          {/* STICKY CLOSE */}
          <Pressable
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: "#ccc",
              marginTop: 10,
            }}
            onPress={onClose}
          >
            <Text style={{ textAlign: "center", fontWeight: "700" }}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
