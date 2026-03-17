import React from "react";
import { ScrollView, Text, StyleSheet, View, Platform } from "react-native";
import Colors from "../../shared/Colors";
import BackToSettingsButton from "../../components/BackToSettingsButton";

export default function PrivacyAndTermsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <BackToSettingsButton />

      <Text style={styles.title}>Privacy & Terms of Service</Text>
      <Text style={styles.updated}>Last updated: March 4, 2026</Text>

      <View style={styles.section}>
        <Text style={styles.heading}>1. Who We Are</Text>
        <Text style={styles.text}>
          Fytro AI is operated by FytroAI, a sole proprietorship registered in Finland.
          For any questions regarding privacy or terms, please contact us at info@fytroai.com.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>2. Data We Collect</Text>
        <Text style={styles.text}>
          To personalize your training, we collect:
          {"\n\n"}- Account info: name, email and password
          {"\n"}- Onboarding info: age, gender, goal, fitness level, training days
          {"\n"}- Workout logs and progress history
          {"\n\n"}We also receive confirmation of your subscription status from Stripe after secure checkout.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>3. How We Use Your Data</Text>
        <Text style={styles.text}>
          We use your data to:
          {"\n\n"}- Generate your AI-based workout plan
          {"\n"}- Save and track your training progress
          {"\n"}- Manage your subscription access
          {"\n"}- Improve app performance and features
          {"\n\n"}We never sell or rent your information to anyone.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>4. Data Storage & Security</Text>
        <Text style={styles.text}>
          - Workout and onboarding data are stored securely in Convex.
          {"\n"}- Email and login credentials are handled by Firebase Authentication.
          {"\n"}- Payments are processed by Stripe; we never see or store card details.
          {"\n\n"}All data is transmitted over encrypted connections. While we use industry-standard security,
          no system can guarantee 100% protection.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>5. AI Use</Text>
        <Text style={styles.text}>
          Workout plans are generated using OpenAI models through OpenRouter.
          Your onboarding information is sent to this service to create your plan.
          By using Fytro, you consent to this processing.
          {"\n\n"}More info: OpenRouter Privacy Policy - https://openrouter.ai/privacy
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>6. Legal Basis for Processing</Text>
        <Text style={styles.text}>
          We process your data because it is necessary to provide the service you requested (your workouts and subscription),
          and with your consent for AI processing and analytics.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>7. Your Rights</Text>
        <Text style={styles.text}>
          You can at any time:
          {"\n\n"}- Permanently delete your account and app data directly in Settings, then tap Delete Account
          {"\n"}- Request a copy of the data we hold
          {"\n"}- Cancel your subscription via Stripe
          {"\n\n"}When you delete your account in-app, profile and training data are removed immediately.
          Billing records may be retained by Stripe where required by law.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>8. Subscriptions</Text>
        <Text style={styles.text}>
          - Monthly: 9-day free trial, then EUR 3.99 per month.
          {"\n"}Subscriptions renew automatically unless cancelled.
          Payments are handled securely by Stripe (https://stripe.com/privacy).
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>9. Age Requirements</Text>
        <Text style={styles.text}>
          Fytro AI is not intended for users under 16 years old.
          We do not knowingly collect information from minors.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>10. Terms of Use</Text>
        <Text style={styles.text}>
          By using Fytro AI, you agree to:
          {"\n\n"}- Use the workouts responsibly and at your own risk
          {"\n"}- Be truthful in your onboarding answers
          {"\n"}- Not misuse or attempt to reverse-engineer the app
          {"\n\n"}Fytro AI provides general fitness guidance, not medical advice.
          Always consult a healthcare professional before beginning any training program.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>11. Updates</Text>
        <Text style={styles.text}>
          We may update this Privacy Policy and Terms occasionally.
          Continued use after an update means you accept the new version.
        </Text>
      </View>

      <Text style={styles.footer}>Copyright 2025 Fytro. All rights reserved.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FDFDFD",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 30,
    flex: 1,
  },
  title: { fontSize: 26, fontWeight: "bold", color: Colors.DARK, marginBottom: 4 },
  updated: { color: Colors.GRAY, marginBottom: 20 },
  section: { marginBottom: 24 },
  heading: { fontSize: 17, fontWeight: "bold", color: Colors.PRIMARY, marginBottom: 8 },
  text: { fontSize: 15, lineHeight: 22, color: Colors.CHARCOAL },
  footer: { fontSize: 13, textAlign: "center", color: Colors.GRAY, marginTop: 30 },
});
