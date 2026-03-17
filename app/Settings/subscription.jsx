import React from "react";
import { View, Text, StyleSheet, Pressable, Alert, Linking, ScrollView, Platform } from "react-native";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserContext } from "../../context/UserContext";
import Colors from "../../shared/Colors";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import BackToSettingsButton from "./../../components/BackToSettingsButton";

export default function SubscriptionSettings() {
  const { user } = React.useContext(UserContext);
  const dbUser = useQuery(api.users.GetUser, user?.email ? { email: user.email } : "skip");
  const getPortal = useAction(api.stripe.getCustomerPortalUrl);
  const setTrialEndDate = useMutation(api.users.setTrialEndDate);

  const openStripePortal = async () => {
    try {
        const url = await getPortal({ userId: user._id });
        Linking.openURL(url);
    } catch (err) {
        Alert.alert("Error", "Couldn't open subscription settings.");
    }
    };

  const handleBuyCredits = () => {
    Alert.alert("Buy Credits", "You'll be able to purchase credits via Stripe.");
  };

  if (!dbUser) return <Text style={styles.loading}>Loading...</Text>;

  const credits = dbUser.credits ?? 0;
  const isTrial = dbUser.trialEndsAt && new Date(dbUser.trialEndsAt) > new Date();
  const plan = dbUser.subscribed ? "Paid" : isTrial ? "Trial" : "Free";

  return (
    <ScrollView style={styles.container}>
        <BackToSettingsButton />

      <Text style={styles.title}>💳 Subscription</Text>

      <View style={styles.card}>

        <Pressable style={styles.button} onPress={openStripePortal}>
            <Feather name="settings" size={18} color="#fff" />
            <Text style={styles.buttonText}>Manage Subscription</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#EEEEEE",
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.DARK,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  label: {
    fontSize: 16,
    color: Colors.CHARCOAL,
    marginBottom: 6,
    fontWeight: "600",
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.PRIMARY,
  },
  trial: {
    marginTop: 10,
    color: Colors.GREEN,
    fontSize: 14,
  },
  warning: {
    marginTop: 10,
    color: "#d9534f",
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  creditCount: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.PRIMARY,
    textAlign: "center",
    marginTop: 6,
  },
  note: {
    color: Colors.GRAY,
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
  loading: {
    fontSize: 16,
    color: Colors.GRAY,
    textAlign: "center",
    marginTop: 50,
  },
});
