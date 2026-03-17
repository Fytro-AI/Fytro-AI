import React, { useMemo, useRef, useEffect } from "react";
import { Animated, Pressable, Text, Easing } from "react-native";
import styles from "../../styles/WorkoutStyles";

const COLORS = {
  DEFAULT: "#000000",
  PERFECT: "#3a8a3cff",
  OK: "#e38503ff",
  BAD: "#cd1104ff",
};

const isMaxTarget = (target) => {
  if (!target) return false;
  if (typeof target === "string") return target.trim().toLowerCase() === "max";
  if (typeof target === "object") {
    return (
      target.isMax === true ||
      (typeof target.min === "string" && target.min?.toLowerCase?.() === "max") ||
      (typeof target.max === "string" && target.max?.toLowerCase?.() === "max")
    );
  }
  return false;
};

const parseTargetValue = (v, fallback) => {
  if (v === undefined || v === null) return fallback;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return fallback;
    if (s.toLowerCase() === "max") return "max";
    const n = Number(s);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
};

const getNumericTarget = (target, type = "reps") => {
  if (isMaxTarget(target)) return { min: null, max: "max" };

  if (typeof target === "number") return { min: target, max: target };
  if (typeof target === "string") {
    const s = target.trim();
    if (s.includes("-")) {
      const [a, b] = s.split("-").map(x => parseInt(x, 10));
      return {
        min: Number.isNaN(a) ? (type === "time" ? 30 : 8) : a,
        max: Number.isNaN(b) ? (type === "time" ? 60 : 12) : b,
      };
    }
    const n = Number(s);
    return {
      min: Number.isNaN(n) ? (type === "time" ? 30 : 8) : n,
      max: Number.isNaN(n) ? (type === "time" ? 60 : 12) : n,
    };
  }
  if (typeof target === "object") {
    const minVal = parseTargetValue(target.min, type === "time" ? 30 : 8);
    const maxVal = parseTargetValue(target.max, type === "time" ? 60 : 12);
    if (minVal === "max" || maxVal === "max") return { min: null, max: "max" };
    return { min: minVal, max: maxVal };
  }
  return { min: type === "time" ? 30 : 8, max: type === "time" ? 60 : 12 };
};

const classifyColor = (done, target, type) => {
  if (done == null) return COLORS.DEFAULT;
  if (isMaxTarget(target)) return COLORS.PERFECT;

  const { min, max } = getNumericTarget(target, type);
  if (typeof min === "number" && typeof max === "number" && done >= min && done <= max) {
    return COLORS.PERFECT;
  }
  if (typeof min === "number" && done >= Math.floor(min * 0.75)) {
    return COLORS.OK;
  }
  return COLORS.BAD;
};

export default function SetButton({
  label,
  done,
  target,
  type = "reps",
  onPress,
}) {
  const desiredColor = useMemo(() => classifyColor(done, target, type), [done, target, type]);

  const prevColorRef = useRef(desiredColor);
  const colorAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (prevColorRef.current === desiredColor) return;

    colorAnim.stopAnimation();
    colorAnim.setValue(0);
    Animated.timing(colorAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start(() => {
      prevColorRef.current = desiredColor;
    });
  }, [desiredColor, colorAnim]);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [prevColorRef.current, desiredColor],
  });

  const [firstLine, ...rest] = label.split(" ");
  const secondLine = rest.join(" ");

  return (
    <Pressable onPress={onPress} style={styles.setContainer}>
      <Animated.View style={[styles.setButton, { backgroundColor }]}>
        <Text style={[styles.setButtonText, { textAlign: "center", fontSize: 16 }]}>
          {firstLine}
        </Text>
        <Text style={[styles.setButtonText, { textAlign: "center", fontWeight: 'bold' }]}>
          {secondLine}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
