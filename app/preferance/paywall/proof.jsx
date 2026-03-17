import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../../components/shared/Button";
import StepDots from "../../../components/shared/StepDots";

export default function ProofScreen() {
  const insets = useSafeAreaInsets();

  const player = useVideoPlayer(
    require("../../../assets/videos/Paywall_2.mp4"),
    (p) => {
      p.loop = false;
      p.muted = true;
      p.play();
    }
  );

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
      />

      {/* CTA pinned above home indicator */}
      <View style={[styles.cta, { paddingBottom: 24 + insets.bottom }]}>
        <Button
          title="See plans"
          onPress={() => router.push("/preferance/paywall/paywall")}
        />
        <StepDots total={3} index={1} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEEEEE' },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: 'center'
  },
});
