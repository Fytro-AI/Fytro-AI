import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "../shared/Colors";

export default function BackToSettingsButton({ label = "Back" }) {
  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.backBtn} onPress={() => router.back('/(tabs)/Settings')}>
        <Feather name="arrow-left" size={20} color={Colors.DARK} />
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
    marginTop: 10,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.DARK,
  },
});
