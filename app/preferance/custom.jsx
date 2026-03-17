import React, { useContext, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Pressable } from 'react-native';
import { OnboardingContext } from '../../context/OnboardingContext';
import { useRouter } from 'expo-router';
import Animated, { FadeInLeft, FadeInUp } from 'react-native-reanimated';
import Colors from '../../shared/Colors';

export default function CustomScreen() {
  const { prefs, setPrefs } = useContext(OnboardingContext);
  const [input, setInput] = useState(prefs.custom || '');
  const router = useRouter();

  const next = () => {
    setPrefs((p) => ({ ...p, custom: input.trim() }));
    router.push('/preferance/summary');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={styles.container}>

      <Pressable onPress={router.back} style={styles.back}>
        <Animated.Text entering={FadeInLeft.duration(800)} style={styles.backText}>←</Animated.Text>
      </Pressable>

      <Animated.Text entering={FadeInUp.delay(100).duration(500)} style={styles.title}>Anything else you'd like to take into account? (Optional)</Animated.Text>
      <Animated.Text entering={FadeInUp.delay(200).duration(500)} style={styles.subtitle}>Optional, but this helps us make your plan more personalized.</Animated.Text>

      <TextInput
        style={styles.input}
        placeholder="E.g. I want to do a lot of core based exercises."
        value={input}
        onChangeText={setInput}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={next}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, backgroundColor: '#EEEEEE', justifyContent: 'center' },
  progressContainer: { marginBottom: 30 },
  progressTrack: { height: 8, backgroundColor: '#eee', borderRadius: 20, overflow: 'hidden' },
  progressFill: { width: '64%', height: '100%', backgroundColor: Colors.PRIMARY },
  stepText: { marginTop: 6, fontSize: 14, color: Colors.GRAY, fontWeight: '500' },
  title: { fontSize: 32, fontWeight: '700', color: Colors.CHARCOAL, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.GRAY, marginBottom: 20 },
  input: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 30,
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
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
