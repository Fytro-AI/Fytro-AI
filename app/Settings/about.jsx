import React from "react";
import { View, Text, StyleSheet, ScrollView, Linking, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import Colors from "../../shared/Colors";
import BackToSettingsButton from "./../../components/BackToSettingsButton";

export default function AboutScreen() {
  const handleLink = (url) => Linking.openURL(url);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <BackToSettingsButton />

      <Text style={styles.title}>About Fytro</Text>

      <View style={styles.card}>
        <Text style={styles.heading}>Our Mission</Text>
        <Text style={styles.text}>
          Fytro AI is built to simplify and improve the way people train.
          Our mission is to provide clear, effective and intelligent training support through, without unnecessary complexity or distractions.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>What We Offer</Text>
        <Text style={styles.text}>
          • AI-generated personalized programs based on your actual preferences
        </Text>
        <Text style={styles.text}>
          • Workout tracking with saved & updated weights, reps, and sets
        </Text>
        <Text style={styles.text}>
          • Adaptive logic that evolves with your body
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Version & Credits</Text>
        <Text style={styles.text}>App Version: 1.0.0</Text>
        <Text style={styles.text}>Built with love by the original creator of Fytro AI</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Contact & Support</Text>
        <Text style={styles.text}>
          Got feedback, bug reports, or ideas?{"\n"}
          Reach us at{" "}
          <Text
            style={styles.link}
            onPress={() => handleLink("mailto:fytroai@gmail.com")}
          >
            fytroai@gmail.com
          </Text>
        </Text>
      </View>

      <Text style={styles.footer}>© 2025 Fytro. All rights reserved.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5", padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.DARK,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 30,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: Colors.PRIMARY,
  },
  text: {
    fontSize: 15,
    color: Colors.CHARCOAL,
    lineHeight: 22,
  },
  link: {
    fontSize: 15,
    color: Colors.PRIMARY,
    marginTop: 4,
    textDecorationLine: "underline",
  },
  footer: {
    fontSize: 13,
    textAlign: "center",
    color: Colors.GRAY,
    marginTop: 30,
  },
});
