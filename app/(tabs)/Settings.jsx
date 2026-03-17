import React, { useContext } from "react";
import { ScrollView, Text, Pressable, StyleSheet, Alert, Platform } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Colors from "../../shared/Colors";
import { signOut } from "firebase/auth";
import { auth } from "../../services/FirebaseConfig";
import { UserContext } from "../../context/UserContext";

export default function Settings() {
  const router = useRouter();
  const { setUser } = useContext(UserContext);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.replace("/auth/SignIn");
    } catch (_error) {
      Alert.alert("Error", "Failed to sign out");
    }
  };

  const confirmSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: handleSignOut }
      ]
    );
  };

  const settings = [
    {
      icon: "log-out-outline",
      label: "Sign Out",
      onPress: confirmSignOut,
    },
    {
      icon: "card-outline",
      label: "Subscription",
      onPress: () => router.push("/Settings/subscription"),
    },
    {
      icon: "lock-closed-outline",
      label: "Privacy & Terms",
      onPress: () => router.push("/Settings/privacy"),
    },
    {
      icon: "information-circle-outline",
      label: "About Fytro",
      onPress: () => router.push("/Settings/about"),
    },
    {
      icon: "trash-outline",
      label: "Delete Account",
      onPress: () => router.push("/Settings/delete-account"),
      destructive: true,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={styles.screenTitle}>Settings</Text>

      {settings.map((item, index) => (
        <Pressable key={index} onPress={item.onPress} style={styles.item}>
          <Ionicons
            name={item.icon}
            size={22}
            color={item.destructive ? "#B3261E" : "#1C1C1E"}
            style={styles.icon}
          />
          <Text style={[styles.label, item.destructive && styles.destructiveLabel]}>{item.label}</Text>
          <Feather name="chevron-right" size={22} color="#A0A0A0" />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEEEEE",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 30,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 40,
    marginBottom: 25,
    color: Colors.CHARCOAL,
  },
  item: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  icon: {
    marginRight: 16,
    width: 26,
    textAlign: "center",
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#1C1C1E",
  },
  destructiveLabel: {
    color: "#B3261E",
    fontWeight: "700",
  },
  separator: {
    height: 1,
    width: "120%",
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
    borderRadius: 10,
    marginBottom: 10,
  },
});
