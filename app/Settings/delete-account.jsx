import React, { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAction } from "convex/react";
import { deleteUser, signOut } from "firebase/auth";
import { router } from "expo-router";
import BackToSettingsButton from "../../components/BackToSettingsButton";
import { UserContext } from "../../context/UserContext";
import { api } from "../../convex/_generated/api";
import { auth } from "../../services/FirebaseConfig";
import Colors from "../../shared/Colors";

const CONFIRM_PHRASE = "DELETE";

export default function DeleteAccountScreen() {
  const { user, setUser } = useContext(UserContext);
  const deleteAccountPermanently = useAction(api.users.deleteAccountPermanently);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = useMemo(
    () => confirmationText.trim().toUpperCase() === CONFIRM_PHRASE && !isDeleting,
    [confirmationText, isDeleting]
  );

  const executePermanentDeletion = async () => {
    if (!user?._id) {
      Alert.alert("Error", "No active account found.");
      return;
    }

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      Alert.alert("Error", "Please sign in again and retry deletion.");
      return;
    }

    setIsDeleting(true);

    const userId = user._id;
    const uid = firebaseUser.uid || user.uid;
    const email = firebaseUser.email || user.email;

    try {
      await deleteUser(firebaseUser);

      let lastError = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await deleteAccountPermanently({ userId, uid, email });
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (lastError) {
        throw lastError;
      }

      try {
        await signOut(auth);
      } catch (_error) {
        // Ignore: account is already removed from auth.
      }

      setUser(null);
      router.replace("/auth/SignIn");
      Alert.alert("Account deleted", "Your account and training data were permanently deleted.");
    } catch (error) {
      const code = error?.code || "";
      if (code === "auth/requires-recent-login") {
        Alert.alert(
          "Re-authentication needed",
          "For security, sign out and sign in again, then retry deletion in Settings."
        );
      } else {
        Alert.alert("Deletion failed", "Could not complete account deletion. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeletion = () => {
    Alert.alert(
      "Delete account permanently?",
      "This cannot be undone. Your app profile and workout data will be erased.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete permanently", style: "destructive", onPress: executePermanentDeletion },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BackToSettingsButton />

      <Text style={styles.title}>Delete Account</Text>
      <Text style={styles.warning}>
        This permanently deletes your account. This action cannot be reversed.
      </Text>

      <View style={styles.card}>
        <Text style={styles.heading}>What will be deleted immediately</Text>
        <Text style={styles.body}>- Profile data (name, email, onboarding preferences)</Text>
        <Text style={styles.body}>- Workout logs, PRs, goals, and progression history</Text>
        <Text style={styles.body}>- Stored plan/adaptation data in Convex</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>What may be retained and why</Text>
        <Text style={styles.body}>
          - Stripe billing records (invoice and payment data) may be retained to meet legal and tax obligations.
        </Text>
        <Text style={styles.body}>
          - We attempt to cancel active subscriptions and remove Stripe customer objects during deletion.
        </Text>
      </View>

      <Text style={styles.helper}>
        To confirm, type <Text style={styles.helperStrong}>{CONFIRM_PHRASE}</Text> below.
      </Text>
      <TextInput
        value={confirmationText}
        onChangeText={setConfirmationText}
        autoCapitalize="characters"
        placeholder={CONFIRM_PHRASE}
        placeholderTextColor="#9A9A9A"
        style={styles.input}
      />

      <Pressable
        onPress={confirmDeletion}
        style={[styles.deleteButton, !canDelete && styles.deleteButtonDisabled]}
        disabled={!canDelete}
      >
        {isDeleting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.deleteButtonText}>Delete Account Permanently</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 30,
  },
  content: {
    paddingBottom: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.DARK,
    marginBottom: 10,
  },
  warning: {
    fontSize: 15,
    color: "#B3261E",
    fontWeight: "600",
    lineHeight: 21,
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: Colors.DARK,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.CHARCOAL,
    marginBottom: 6,
  },
  helper: {
    marginTop: 6,
    marginBottom: 10,
    color: Colors.CHARCOAL,
    fontSize: 14,
  },
  helperStrong: {
    fontWeight: "700",
    color: "#B3261E",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 10,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: Colors.DARK,
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: "#B3261E",
    minHeight: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
