import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function ProgressRing({
  value = 79,
  max = 100,
  size = 140,
  strokeWidth = 12,
  trackColor = "rgba(0,0,0,0.12)",
  progressColor = "#5A3FFF",
  textColor = "#5A3FFF",
  subText,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const clamped = Math.max(0, Math.min(value, max));
  const progress = max > 0 ? clamped / max : 0;

  const dashOffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>

      {/* Center text */}
      <View style={styles.center}>
        <Text style={[styles.mainText, { color: textColor }]}>
          {clamped}/{max}
        </Text>
        {!!subText && <Text style={styles.subText}>{subText}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  mainText: {
    fontSize: 34,
    fontWeight: "800",
  },
  subText: {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.6,
  },
});
