import {
  Home03Icon,
  PulseRectangle02Icon,
  Settings02Icon,
  TransactionHistoryIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Tabs, Redirect } from "expo-router";
import { Platform } from "react-native";
import { useContext } from "react";
import Colors from "./../../shared/Colors";
import { UserContext } from "../../context/UserContext";

export default function TabLayout() {
  const { user } = useContext(UserContext);

  // ✅ No useEffect, no useState, no router.replace, no null return.
  if (!user) {
    return <Redirect href="/auth/SignIn" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.PRIMARY,
        tabBarStyle: {
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          elevation: 5,
          backgroundColor: "#ffffffee",
          borderRadius: 20,
          height: 70,
          borderTopWidth: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          paddingBottom: Platform.OS === "android" ? 10 : 20,
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <HugeiconsIcon icon={Home03Icon} size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="History"
        options={{
          tabBarIcon: ({ color, size }) => (
            <HugeiconsIcon icon={TransactionHistoryIcon} size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="Progress"
        options={{
          tabBarIcon: ({ color, size }) => (
            <HugeiconsIcon icon={PulseRectangle02Icon} size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="Settings"
        options={{
          tabBarIcon: ({ color, size }) => (
            <HugeiconsIcon icon={Settings02Icon} size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
