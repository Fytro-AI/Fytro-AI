import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path, Line } from "react-native-svg";
import Button from "../../components/shared/Button";

function makeSmoothPath(points) {
  if (!points.length) return "";
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y} ${xc} ${yc}`;
  }

  const last = points[points.length - 1];
  d += ` T ${last.x} ${last.y}`;
  return d;
}

export default function AutomaticProgression() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const H_PADDING = 22;
  const cardW = Math.min(520, width - H_PADDING * 2);
  const chartW = cardW - 36;

  // More realistic progression (gradual + natural acceleration)
  const blue = [12, 14, 16, 21, 28, 34, 39, 44, 52, 60];
  const red  = [12, 18, 19, 20, 21, 22, 22.5, 23, 24, 25];

  const chart = useMemo(() => {
    const svgH = 140;

    const padX = 6;
    const padTop = 16;
    const padBottom = 22;

    const innerW = chartW - padX * 2;
    const innerH = svgH - padTop - padBottom;

    const all = [...blue, ...red];
    const min = Math.min(...all);
    const max = Math.max(...all);

    const sx = (i, n) => padX + (innerW * i) / (n - 1);
    const sy = (v) => {
      const t = (v - min) / (max - min);
      return padTop + innerH * (1 - t);
    };

    const bluePts = blue.map((v, i) => ({ x: sx(i, blue.length), y: sy(v) }));
    const redPts = red.map((v, i) => ({ x: sx(i, red.length), y: sy(v) }));

    const gridYs = [
      padTop + innerH * 0.25,
      padTop + innerH * 0.5,
      padTop + innerH * 0.75,
    ];

    return {
      svgH,
      bluePath: makeSmoothPath(bluePts),
      redPath: makeSmoothPath(redPts),
      gridYs,
    };
  }, [chartW]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={[styles.container, { paddingHorizontal: H_PADDING }]}>

        <Text style={styles.title}>
          Automatic{"\n"}progression system
        </Text>

        <View style={[styles.card, { width: cardW }]}>
          <Text style={styles.cardTitle}>Overall strength index</Text>

          <View style={styles.chartWrap}>
            <Svg width={chartW} height={chart.svgH}>
              {chart.gridYs.map((y, i) => (
                <Line
                  key={i}
                  x1={0}
                  y1={y}
                  x2={chartW}
                  y2={y}
                  stroke="#000"
                  strokeWidth={1}
                  strokeDasharray="3 6"
                  opacity={0.35}
                />
              ))}

              <Path
                d={chart.redPath}
                fill="none"
                stroke="#FF375F"
                strokeWidth={3}
                strokeLinecap="round"
              />

              <Path
                d={chart.bluePath}
                fill="none"
                stroke="#4F46FF"
                strokeWidth={3}
                strokeLinecap="round"
              />
            </Svg>

            <View style={styles.xAxis}>
              <Text style={styles.xLabel}>Month 1</Text>
              <Text style={styles.xLabel}>Month 6</Text>
            </View>
          </View>

          <Text style={styles.caption}>
            Fytro AI automatically adjusts your
            plan weekly based on performance
          </Text>
        </View>

        <View style={styles.footer}>
          <Button
            onPress={() => router.push("/preferance/gender")}
            title={"Continue"}
          />
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F3F3F3",
  },

  container: {
    flex: 1,
    paddingTop: 18,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40,
    color: "#0A0A0A",
  },

  card: {
    marginVertical: 100,
    backgroundColor: "#D9D9D9",
    borderRadius: 24,
    padding: 18,
    alignSelf: "center",
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: "600",
    marginBottom: 10,
    color: "#111",
  },

  chartWrap: {
    marginTop: 2,
  },

  xAxis: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  xLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },

  caption: {
    marginTop: 18,
    textAlign: "center",
    alignSelf: 'center',
    fontSize: 14,
    fontWeight: 'medium',
    color: "#36454F",
    width: '85%'
  },

  footer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 24,
  },

  button: {
    height: 60,
    borderRadius: 30,
    backgroundColor: "#5A3CFF",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  buttonText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "600",
  },
});