import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, Pressable } from 'react-native';
import { OnboardingContext } from '../../context/OnboardingContext';
import { useRouter } from 'expo-router';
import Animated, { FadeInLeft, FadeInUp } from 'react-native-reanimated';
import Colors from '../../shared/Colors';

const levels = [
  { label: 'Beginner', description: 'I’ve just started or it’s been a long time.' },
  { label: 'Intermediate', description: 'I train a few times per week.' },
  { label: 'Advanced', description: 'Gym is a lifestyle.' },
];

export default function LevelScreen() {
  const { prefs, setPrefs } = useContext(OnboardingContext);
  const router = useRouter();

  const selectLevel = (level) => {
    setPrefs((p) => ({ ...p, level }));
    router.push('/preferance/access');
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={router.back} style={styles.back}>
        <Animated.Text entering={FadeInLeft.duration(800)} style={styles.backText}>←</Animated.Text>
      </Pressable>

      <Animated.View entering={FadeInUp.delay(100).duration(500)}>
        <Text style={styles.title}>What’s your fitness level?</Text>
        <Text style={styles.subtitle}>This helps us scale your workouts accordingly.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={{ width: '100%' }}>
        {levels.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.option,
              prefs.level === item.label && styles.optionSelected,
            ]}
            onPress={() => selectLevel(item.label)}
          >
            <Text style={[
              styles.optionTitle,
              prefs.level === item.label && styles.optionTextSelected,
            ]}>{item.label}</Text>
            <Text style={[
              styles.optionDescription,
              prefs.level === item.label && styles.optionTextSelected,
            ]}>{item.description}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, backgroundColor: '#EEEEEE', justifyContent: 'center' },
  progressContainer: { marginBottom: 30 },
  progressTrack: { height: 8, backgroundColor: '#eee', borderRadius: 20, overflow: 'hidden' },
  progressFill: { width: '36%', height: '100%', backgroundColor: Colors.PRIMARY },
  stepText: { marginTop: 6, fontSize: 14, color: Colors.GRAY, fontWeight: '500' },
  title: { fontSize: 32, fontWeight: '700', color: Colors.CHARCOAL, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.GRAY, marginBottom: 30 },
  option: {
    backgroundColor: '#F5F5F5',
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: Colors.PRIMARY + '15',
    borderColor: Colors.PRIMARY,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    color: Colors.CHARCOAL,
  },
  optionDescription: {
    fontSize: 15,
    color: Colors.GRAY,
  },
  optionTextSelected: {
    color: Colors.PRIMARY,
  },
  back: {
    marginBottom: 10,
  },
  backText: {
    fontSize: 24,
    color: '#222',
  },
});
