import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { UserContext } from "../../context/UserContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import * as Haptics from "expo-haptics";
import Colors from "../../shared/Colors";
import { Feather } from "@expo/vector-icons";
import BackToSettingsButton from "../../components/BackToSettingsButton";
import { signOut } from "firebase/auth";
import { auth } from "../../services/FirebaseConfig";
import { router } from "expo-router";

export default function ProfileSettings() {
  const { user, setUser } = useContext(UserContext);
  const dbUser = useQuery(api.users.GetUser, user?.email ? { email: user.email } : "skip");
  const updatePref = useMutation(api.users.updateUserPref);
  const [unitSystem, setUnitSystem] = useState("metric");
  const [weightKg, setWeightKg] = useState(54);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to sign out');
    }
    router.replace("/SignIn")
  };

  const [profile, setProfile] = useState({
    name: "",
    age: "",
    gender: "",
    level: "",
    access: "",
    commitment: 0,
    custom: "",
    injuries: "",
    motivation: [],
    sleep: "",
  });

  useEffect(() => {
    if (dbUser?.weight) {
      const parsed = Number(dbUser.weight);
      setWeightKg(isNaN(parsed) ? 54 : parsed);
    }

    if (dbUser) {
      setProfile({
        name: dbUser.name || "",
        age: String(dbUser.age || ""),
        gender: dbUser.gender || "",
        weight: String(dbUser.weight || ""),
        level: dbUser.level || "",
        access: dbUser.access || "",
        commitment: dbUser.commitment ?? 0,
        custom: dbUser.custom || "",
        injuries: dbUser.injuries || "",
        motivation: dbUser.motivation || [],
        sleep: dbUser.sleep || "",
      });
    }
  }, [dbUser]);

  const handleWeightChange = (val) => {
    const numeric = parseInt(val);
    if (isNaN(numeric)) return;

    setWeightKg(unitSystem === "metric" ? numeric : Math.round(numeric / 2.20462));
  };

  const weightOptions = () => {
    const values = [];
    if (unitSystem === "metric") {
      for (let i = 30; i <= 200; i++) {
        values.push({ label: `${i} kg`, value: i });
      }
    } else {
      for (let i = 66; i <= 440; i++) {
        values.push({ label: `${i} lb`, value: i });
      }
    }
    return values;
  };

  const handleSave = async () => {
    if (!dbUser?._id) return;

    const updatedFields = {
      uid: dbUser._id,
      name: profile.name,
      age: profile.age !== "" ? Number(profile.age) : dbUser.age,
      weight: weightKg,
      level: profile.level || dbUser.level,
      access: profile.access || dbUser.access,
    };

    if (profile.commitment !== "") {
      updatedFields.commitment = Number(profile.commitment);
    }

    if (
      Array.isArray(profile.motivation) ||
      (typeof profile.motivation === "string" && profile.motivation.length > 0)
    ) {
      updatedFields.motivation = Array.isArray(profile.motivation)
        ? profile.motivation
        : [profile.motivation];
    }

    if (profile.sleep && profile.sleep.length > 0) {
      updatedFields.sleep = profile.sleep;
    }

    if (dbUser.workout) updatedFields.workout = dbUser.workout;
    if (dbUser.goal) updatedFields.goal = dbUser.goal;
    if (dbUser.trainingDays) updatedFields.trainingDays = dbUser.trainingDays;

    try {
      await updatePref(updatedFields);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("✅ Saved", "Profile updated successfully.");
      setUser({ ...user, ...updatedFields });
    } catch (e) {
      Alert.alert("Error", "Something went wrong. Try again.");
    }
  };


  const handleChange = (key, value) => {
    if (key === "age" || key === "weight") {
      value = value.replace(/[^0-9]/g, "");
    }
    if (key === "name") {
      value = value.replace(/[^a-zA-ZäöÄÖ\s]/g, "");
    }
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  if (!dbUser) {
    return <Text style={styles.loading}>Loading...</Text>;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <BackToSettingsButton />
        <Text style={styles.title}>👤 Edit Profile</Text>

        <View style={styles.card}>
          <Field label="Name">
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              placeholderTextColor={Colors.GRAY}
              value={profile.name}
              onChangeText={(val) => handleChange("name", val)}
            />
          </Field>

          <Field label="Age">
            <TextInput
              style={styles.input}
              placeholder="e.g. 23"
              placeholderTextColor={Colors.GRAY}
              value={profile.age}
              keyboardType="numeric"
              onChangeText={(val) => handleChange("age", val)}
            />
          </Field>

          <Field label="Gender">
            
          </Field>

          <Field label="Weight">
            <View style={styles.row}>
              <Pressable
                style={[
                  styles.toggleContainer,
                  unitSystem === "imperial" && styles.toggleContainerActive,
                ]}
                onPress={() => setUnitSystem((prev) => (prev === "metric" ? "imperial" : "metric"))}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    unitSystem === "imperial" ? styles.thumbRight : styles.thumbLeft,
                  ]}
                />
              </Pressable>
              <Text style={styles.unitLabel}>
                {unitSystem === "metric" ? "Metric (kg)" : "Imperial (lb)"}
              </Text>
            </View>

            <PickerWrapper
              selected={unitSystem === "metric" ? weightKg : Math.round(weightKg * 2.20462)}
              onChange={handleWeightChange}
              options={weightOptions()}
            />
          </Field>

          <Field label="Training Level">
            <PickerWrapper
              selected={profile.level}
              onChange={(val) => handleChange("level", val)}
              options={[
                { label: "Select level...", value: "" },
                { label: "Beginner", value: "beginner" },
                { label: "Intermediate", value: "intermediate" },
                { label: "Advanced", value: "advanced" },
              ]}
            />
          </Field>

          <Field label="Gym Access">
            <PickerWrapper
              selected={profile.access}
              onChange={(val) => handleChange("access", val)}
              options={[
                { label: "Select access...", value: "" },
                { label: "Home", value: "home" },
                { label: "Gym", value: "gym" },
              ]}
            />
          </Field>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Feather name="save" size={18} color="#fff" />
            <Text style={styles.saveText}>Save Changes</Text>
          </Pressable>

          <Pressable
            onPress={handleSignOut}
            style={[styles.saveButton, { backgroundColor: Colors.RED, marginTop: 10 }]}
          >
            <Feather name="log-out" size={18} color='red' />
            <Text style={styles.logOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

function Field({ label, children }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function PickerWrapper({ selected, onChange, options }) {
  return (
    <View style={styles.pickerWrapper}>
      <Picker
        selectedValue={selected}
        onValueChange={onChange}
        style={styles.picker}
        dropdownIconColor={Colors.DARK}
        mode={Platform.OS === "ios" ? "dialog" : "dropdown"}
      >
        {options.map((opt) => (
          <Picker.Item
            key={opt.value}
            label={opt.label}
            value={opt.value}
            color={opt.value === "" ? Colors.GRAY : Colors.DARK}
          />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#EEEEEE",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 30,
    flex: 1,
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
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.CHARCOAL,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.LIGHTGRAY,
    borderRadius: 8,
    padding: 12,
    color: Colors.DARK,
    backgroundColor: "#F6F6F6",
    fontSize: 15,
  },
  picker: {
    maxHeight: 200,
    color: Colors.DARK,
  },
  toggleContainer: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DADADA",
    justifyContent: "center",
    padding: 2,
    marginTop: 6,
  },
  toggleContainerActive: {
    backgroundColor: Colors.PRIMARY,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    position: "absolute",
  },
  thumbLeft: {
    left: 2,
  },
  thumbRight: {
    right: 2,
  },
  unitLabel: {
    marginTop: 4,
    color: Colors.CHARCOAL,
    fontSize: 13,
    textAlign: 'center'
  },
  timestamp: {
    textAlign: "right",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 10,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: Colors.PRIMARY,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  logOutText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loading: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: Colors.GRAY,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
