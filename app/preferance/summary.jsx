import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeInLeft, FadeInUp } from 'react-native-reanimated';
import { OnboardingContext } from '../../context/OnboardingContext';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAction } from 'convex/react';
import { Alert } from 'react-native';

import { UserContext } from '../../context/UserContext';
import Colors from '../../shared/Colors';
import Prompt from '../../shared/Prompt';

export default function Summary() {
  const { prefs, setPrefs } = useContext(OnboardingContext);
  const { user, setUser } = useContext(UserContext);
  const updatePref = useMutation(api.users.updateUserPref);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const generateWorkout = useAction(api.generateWorkout.generateWorkout);

  const finish = async () => {
    setLoading(true);
    try {
      const numeric = {
        age: Number(prefs.age),
        weight: Number(prefs.weight),
        gender: prefs.gender,
        level: prefs.level,
        goal: prefs.goal,
        trainingDays: prefs.trainingDays,
        split: prefs.split,
        motivation: prefs.motivation,
        sleep: prefs.sleep,
        commitment: prefs.commitment,
        access: prefs.access,
        injuries: prefs.injuries,
        custom: prefs.custom,
      };

      const prompt = Prompt.WORKOUT_PROMPT(numeric);

      const plan = await generateWorkout({ prompt });

      await updatePref({ uid: user._id, ...numeric, workout: plan });
      setUser({ ...user, ...numeric, workout: plan });

      console.log('This is the Prompt:', prompt)

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/Home');
    } catch (e) {
      console.error(e);
      Alert.alert('Error generating plan', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.Text entering={FadeInDown.duration(500)} style={styles.title}>
        Your Journey, Summarized
      </Animated.Text>

      <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.card}>
        <Pressable onPress={router.back} style={styles.back}>
          <Animated.Text entering={FadeInLeft.duration(800)} style={styles.backText}>←</Animated.Text>
        </Pressable>
        {[
          ['Age', prefs.age],
          ['Weight', prefs.weight],
          ['Gender', prefs.gender],
          ['Goal', prefs.goal],
          ['Level', prefs.level],
          ['Access', prefs.access],
          ['Training Days', (prefs.trainingDays || []).join(', ')],
          ['Split', prefs.split],
          // ['Injuries', prefs.injuries || 'None'],
          // ['Sleep', prefs.sleep],
          // ['Motivation', (prefs.motivation || []).join(', ')],
          ['Anything Else?', prefs.custom || 'None'],
          // ['Commitment Level', prefs.commitment / 5],
          ].map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </Animated.View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginTop: 30 }} />
      ) : (
        <AnimatedTouchable style={styles.finishButton} entering={FadeInUp.delay(800).duration(400)} onPress={finish}>
          <Text style={styles.finishText}>Generate My Personal Plan</Text>
        </AnimatedTouchable>
      )}
    </View>
  );
}

const { width } = Dimensions.get('window');
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#EEEEEE' },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.DARK,
    textAlign: 'center',
    marginVertical: 20,
  },
  card: {
    backgroundColor: '#f8f9fb',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    color: Colors.GRAY,
    fontWeight: '600',
  },
  value: {
    color: Colors.DARK,
    fontWeight: '700',
    maxWidth: 200,
    textAlign: 'right'
  },
  finishButton: {
    marginTop: 36,
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: width - 48,
    alignSelf: 'center',
  },
  finishText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  back: {
    marginBottom: 20,
  },
  backText: {
    fontSize: 20,
    color: '#222',
  },
});
