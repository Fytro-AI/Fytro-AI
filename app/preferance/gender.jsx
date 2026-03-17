import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, Pressable } from 'react-native';
import { OnboardingContext } from '../../context/OnboardingContext';
import { useRouter } from 'expo-router';
import Animated, { FadeInLeft, FadeInUp } from 'react-native-reanimated';
import Colors from '../../shared/Colors';

export default function GenderScreen() {
  const { setPrefs, prefs } = useContext(OnboardingContext);
  const router = useRouter();

  const selectGender = (gender) => {
    setPrefs((p) => ({ ...p, gender }));
    router.push('/preferance/goal');
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={router.back} style={styles.back}>
        <Animated.Text entering={FadeInLeft.duration(800)} style={styles.backText}>←</Animated.Text>
      </Pressable>

      <Animated.View entering={FadeInUp.delay(100).duration(500)}>
        <Text style={styles.title}>What’s your gender?</Text>
        <Text style={styles.subtitle}>We use this to personalize your workout & stats.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={{ width: '100%' }}>
        {['Male', 'Female', 'I prefer not to say'].map((gender) => (
          <TouchableOpacity
            key={gender}
            style={[
              styles.option,
              prefs.gender === gender && styles.optionSelected,
            ]}
            onPress={() => selectGender(gender)}
          >
            <Text style={[
              styles.optionText,
              prefs.gender === gender && styles.optionTextSelected,
            ]}>{gender}</Text>
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
  progressFill: { width: '27%', height: '100%', backgroundColor: Colors.PRIMARY },
  stepText: { marginTop: 6, fontSize: 14, color: Colors.GRAY, fontWeight: '500' },
  title: { fontSize: 32, fontWeight: '700', color: Colors.CHARCOAL, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.GRAY, marginBottom: 30 },
  option: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: Colors.PRIMARY + '15',
    borderColor: Colors.PRIMARY,
  },
  optionText: {
    fontSize: 18,
    color: Colors.CHARCOAL,
    fontWeight: '600',
    textAlign: 'center',
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
