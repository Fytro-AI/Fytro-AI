import React, { useContext, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { OnboardingContext } from '../../context/OnboardingContext';
import { useRouter } from 'expo-router';
import Animated, { FadeInLeft, FadeInUp } from 'react-native-reanimated';
import Colors from '../../shared/Colors';
import { SPLITS_BY_DAYS } from '../../shared/splits';

export default function SplitScreen() {
  const { prefs, setPrefs } = useContext(OnboardingContext);
  const router = useRouter();

  const dayCount = prefs.trainingDays?.length || 0;
  const splitOptions = useMemo(() => {
    return SPLITS_BY_DAYS[dayCount] || [];
  }, [dayCount]);

  const selectSplit = (splitLabel) => {
    setPrefs(p => ({ ...p, split: splitLabel }));
    router.push('/preferance/custom');
  };

  const skip = () => {
    setPrefs(p => ({ ...p, split: 'auto' }));
    router.push('/preferance/custom');
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={router.back} style={styles.back}>
        <Animated.Text entering={FadeInLeft.duration(800)} style={styles.backText}>←</Animated.Text>
      </Pressable>

      <Animated.View entering={FadeInUp.delay(100).duration(500)}>
        <Text style={styles.title}>Do you have a preferred split?(optional)</Text>
        <Text style={styles.subtitle}>
          Optional, we’ll still build the best plan if you skip.
        </Text>
      </Animated.View>

      <View style={{ width: '100%' }}>
        {splitOptions.map((opt, index) => (
          <Animated.View
            key={opt.label}
            entering={FadeInUp.delay(200 + index * 100).duration(400)}
          >
            <TouchableOpacity
              style={styles.option}
              onPress={() => selectSplit(opt.label)}
            >
              <Text style={styles.optionLabel}>{opt.label}</Text>
              <Text style={styles.optionDesc}>{opt.desc}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInUp.delay(200 + splitOptions.length * 100).duration(400)}>
          <TouchableOpacity style={[styles.option, styles.autoOption]} onPress={skip}>
            <Text style={[styles.optionLabel, { color: Colors.PRIMARY }]}>
              Let Fytro Decide (Recommended)
            </Text>
            <Text style={styles.optionDesc}>
              We’ll optimize your split for recovery and results.
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
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
  option: {
    padding: 20,
    borderRadius: 14,
    backgroundColor: '#F4F4F4',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  autoOption: {
    backgroundColor: Colors.PRIMARY + '10',
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
  back: {
    marginBottom: 10,
  },
  backText: {
    fontSize: 24,
    color: '#222',
  },
});
