import React from "react";
import { View, StyleSheet } from "react-native";

export default function StepDots({ total = 3, index = 0 }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === index && styles.dotActive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8, // if this causes issues on your RN version, use marginHorizontal instead (below)
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    opacity: 0.35,
    backgroundColor: "#6D5EF7", // inactive
    // If you can't use `gap`, remove it and use:
    // marginHorizontal: 4,
  },
  dotActive: {
    opacity: 1,
    width: 8,
    height: 8,
    backgroundColor: "#6D5EF7",
  },
});