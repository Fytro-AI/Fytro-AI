import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { OnboardingContext } from '../../context/OnboardingContext';
import { useRouter } from 'expo-router';
import Animated, { FadeInLeft, FadeInUp } from 'react-native-reanimated';
import Colors from '../../shared/Colors';

const options = [
  { label: 'Gym', desc: 'Access to full gym equipment and machines.' },
  { label: 'Home', desc: 'Limited equipment like dumbbells or bodyweight.' },
];

export default function AccessScreen() {
  const { prefs, setPrefs } = useContext(OnboardingContext);
  const router = useRouter();

  const select = (access) => {
    setPrefs((p) => ({ ...p, access }));
    router.push('/preferance/trainingDays');
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={router.back} style={styles.back}>
        <Animated.Text entering={FadeInLeft.duration(800)} style={styles.backText}>←</Animated.Text>
      </Pressable>

      <Animated.Text entering={FadeInUp.delay(100).duration(500)} style={styles.title}>What kind of equipment do you have access to?</Animated.Text>
      <Animated.Text entering={FadeInUp.delay(200).duration(500)} style={styles.subtitle}>This helps us personalize your workout plan.</Animated.Text>

      {options.map((opt, index) => (
        <Animated.View entering={FadeInUp.delay(300 + index * 100).duration(400)} key={opt.label}>
          <TouchableOpacity
            style={[
              styles.option,
              prefs.access === opt.label && styles.optionSelected,
            ]}
            onPress={() => select(opt.label)}
          >
            <Text style={[
              styles.optionLabel,
              prefs.access === opt.label && styles.selectedText,
            ]}>
              {opt.label}
            </Text>
            <Text style={[
              styles.optionDesc,
              prefs.access === opt.label && styles.selectedText,
            ]}>
              {opt.desc}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, backgroundColor: '#EEEEEE', justifyContent: 'center' },
  progressContainer: { marginBottom: 30 },
  progressTrack: { height: 8, backgroundColor: '#eee', borderRadius: 20, overflow: 'hidden' },
  progressFill: { width: '55%', height: '100%', backgroundColor: Colors.PRIMARY },
  stepText: { marginTop: 6, fontSize: 14, color: Colors.GRAY, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: '700', color: Colors.CHARCOAL, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.GRAY, marginBottom: 30 },
  option: {
    padding: 20,
    borderRadius: 14,
    backgroundColor: '#F4F4F4',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: Colors.PRIMARY + '15',
    borderColor: Colors.PRIMARY,
  },
  optionLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.CHARCOAL,
  },
  optionDesc: {
    fontSize: 15,
    marginTop: 4,
    color: Colors.GRAY,
  },
  selectedText: {
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
    fontWeight: '600',
  },
  back: {
    marginBottom: 10,
  },
  backText: {
    fontSize: 24,
    color: '#222',
  },
});
