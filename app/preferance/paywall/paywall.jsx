import React, { useContext, useEffect, useRef, useState } from "react";
import { StyleSheet, View, Text, InteractionManager, AppState } from "react-native";
import { useRouter } from "expo-router";
import { UserContext } from "../../../context/UserContext";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import * as Haptics from "expo-haptics";
import { Linking } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../../components/shared/Button";
import StepDots from "../../../components/shared/StepDots";
import * as Animatable from "react-native-animatable";

export default function Paywall() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useContext(UserContext);

  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);

  // Refresh user when returning from Stripe
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setRefreshKey((k) => k + 1);
    });
    return () => sub.remove();
  }, []);

  // Fetch DB user
  const dbUser = useQuery(
    api.users.GetUser,
    user?.email ? { email: user.email } : "skip",
    { key: refreshKey }
  );

  // Entitlement check
  const entitled = (() => {
    if (!dbUser?.subscribed) return false;
    if (!dbUser?.trialEndsAt) return true;
    return Date.now() < dbUser.trialEndsAt;
  })();

  const hasNavigated = useRef(false);

  // Auto-enter app when entitled
  useEffect(() => {
    if (entitled && !hasNavigated.current) {
      hasNavigated.current = true;
      InteractionManager.runAfterInteractions(() => {
        router.replace("/(tabs)/Home");
      });
    }
  }, [entitled]);

  // Stripe checkout
  const startCheckout = useAction(api.stripe.startCheckout);

  const handleSubscribe = async () => {
    if (!dbUser?._id) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setLoading(true);

      const url = await startCheckout({
        userId: dbUser._id,
        billing: "monthly", // minimal UI → fixed plan
      });

      await Linking.openURL(url);
    } finally {
      setLoading(false);
    }
  };

  // Background video
  const player = useVideoPlayer(
    require("../../../assets/videos/Paywall_3.mp4"),
    (p) => {
      p.loop = false;
      p.muted = true;
      p.play();
    }
  );

  // Loading / unlocking states (logic preserved)
  if (!dbUser || entitled) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>
          {entitled ? "Unlocking premium…" : "Activating your subscription…"}
        </Text>
      </View>
    );
  }

  // Minimal visual screen (same as ProofScreen)
  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
      />

      <Animatable.View animation="fadeInLeft" delay={100} style={[styles.cta, { paddingBottom: 24 + insets.bottom }]}>
        <Button
          title="Start 9-Day Free Trial"
          onPress={handleSubscribe}
          loading={loading}
        />
      </Animatable.View>
      <View style={styles.cta}>
        <StepDots total={3} index={2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEEEEE",
  },
  cta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 80,
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: "center",
  },
  loading: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
});
