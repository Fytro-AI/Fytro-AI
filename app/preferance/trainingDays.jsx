import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, Pressable } from 'react-native';
import { OnboardingContext } from '../../context/OnboardingContext';
import { useRouter } from 'expo-router';
import Animated, { FadeInLeft, FadeInUp } from 'react-native-reanimated';
import Colors from '../../shared/Colors';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TrainingDaysScreen() {
  const { prefs, setPrefs } = useContext(OnboardingContext);
  const [selected, setSelected] = useState(prefs.trainingDays || []);
  const router = useRouter();

  const toggleDay = (day) => {
    setSelected((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const next = () => {
    if (selected.length === 0) {
      return alert('Select at least one training day.');
    }
    setPrefs((p) => ({ ...p, trainingDays: selected }));
    router.push('/preferance/split');
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={router.back} style={styles.back}>
        <Animated.Text entering={FadeInLeft.duration(800)} style={styles.backText}>←</Animated.Text>
      </Pressable>

      <Animated.View entering={FadeInUp.delay(100).duration(500)}>
        <Text style={styles.title}>What days will you train?</Text>
        <Text style={styles.subtitle}>Pick the days that work best for your routine.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.daysGrid}>
        {weekDays.map((day) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.day,
              selected.includes(day) && styles.daySelected,
            ]}
            onPress={() => toggleDay(day)}
          >
            <Text
              style={[
                styles.dayText,
                selected.includes(day) && styles.dayTextSelected,
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ width: '100%' }}>
        <TouchableOpacity style={styles.button} onPress={next}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 28, 
    backgroundColor: '#EEEEEE', 
    justifyContent: 'center' 
  },
  progressContainer: { 
    marginBottom: 30 
  },
  progressTrack: { 
    height: 8, 
    backgroundColor: '#eee', 
    borderRadius: 20, 
    overflow: 'hidden' 
  },
  progressFill: { 
    width: '45%', 
    height: '100%', 
    backgroundColor: Colors.PRIMARY 
  },
  stepText: { 
    marginTop: 6, 
    fontSize: 14, 
    color: Colors.GRAY, 
    fontWeight: '500' 
  },
  title: { 
    fontSize: 32, 
    fontWeight: '700', 
    color: Colors.CHARCOAL, 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 16, 
    color: Colors.GRAY, 
    marginBottom: 30 
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 40,
    justifyContent: 'space-between',
  },
  day: {
    width: '30%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  daySelected: {
    backgroundColor: Colors.PRIMARY + '15',
    borderColor: Colors.PRIMARY,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.CHARCOAL,
  },
  dayTextSelected: {
    color: Colors.PRIMARY,
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: '600' 
  },
  back: {
    marginBottom: 10,
  },
  backText: {
    fontSize: 24,
    color: '#222',
  },
});
