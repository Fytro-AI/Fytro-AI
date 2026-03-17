import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet, Vibration } from 'react-native';
import { OnboardingContext } from '../../context/OnboardingContext';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Colors from '../../shared/Colors';
import { UserContext } from '../../context/UserContext';

export default function AgeScreen() {
  const { setPrefs } = useContext(OnboardingContext);
  const [age, setAge] = useState('');
  const router = useRouter();
  const { user } = useContext(UserContext);

  const next = () => {
    const num = parseInt(age);
    if (!num || num < 12 || num > 100) {
      return alert('Enter a valid age between 12 and 100');
    }

    setPrefs(p => ({ ...p, age: num }));
    router.push('/preferance/automatic-progression');
  };

  console.log("Email:", user.email)

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>

        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <Text style={styles.title}>How old are you?</Text>
          <Text style={styles.subtitle}>Your age helps us tailor your plan accurately.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={{ width: '100%' }}>
          <TextInput
            placeholder="Enter your age"
            placeholderTextColor={Colors.GRAY}
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
            style={styles.input}
            maxLength={3}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ width: '100%' }}>
          <TouchableOpacity style={styles.button} onPress={next}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 20,
    overflow: 'hidden',
  },
  progressFill: {
    width: '9%',
    height: '100%',
    backgroundColor: Colors.PRIMARY,
  },
  stepText: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.GRAY,
    fontWeight: '500',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.CHARCOAL,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.GRAY,
    marginBottom: 30,
  },
  input: {
    borderBottomWidth: 2,
    borderColor: Colors.PRIMARY,
    fontSize: 28,
    paddingVertical: 10,
    color: Colors.CHARCOAL,
    marginBottom: 30,
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
});
