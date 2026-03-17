import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { View, Text, Pressable } from "react-native";

export default function SeedTools() {
  const clear = useMutation(api.seed.clearExercises);
  const seed = useMutation(api.seed.seedExercises);

  return (
    <View style={{ padding: 30 }}>
      <Pressable onPress={async () => {
        await clear();
        alert("Exercises cleared.");
      }}>
        <Text style={{ fontSize: 20, marginBottom: 20 }}>🧹 Clear</Text>
      </Pressable>

      <Pressable onPress={async () => {
        await seed();
        alert("Exercises seeded.");
      }}>
        <Text style={{ fontSize: 20 }}>🌱 Seed</Text>
      </Pressable>
    </View>
  );
}
