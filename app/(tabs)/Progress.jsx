import {
  Text, View, ScrollView, StyleSheet, Dimensions,
  Platform
} from 'react-native';
import Colors from './../../shared/Colors';
import { useContext } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { UserContext } from '../../context/UserContext';
import { LineChart, ProgressChart } from 'react-native-chart-kit';
import FytroHeader from '../../components/FytroHeader';
import ProgressRing from '../../components/ProgressRing';

function toDate(v) {
  if (!v && v !== 0) return null;
  if (v instanceof Date) return isNaN(v) ? null : v;
  const n = typeof v === 'number' ? v : Date.parse(v);
  if (!Number.isFinite(n)) return null;
  const d = new Date(n);
  return isNaN(d) ? null : d;
}

function getISOYearWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const year = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return [year, weekNo];
}
function weekKeyFromDate(date) {
  const [y, w] = getISOYearWeek(date);
  const ww = String(w).padStart(2, '0');
  return `${y}-W${ww}`;
}
function parseWeekKey(k) {
  const [y, w] = k.split('-W');
  return { year: Number(y), week: Number(w) };
}
function compareWeekKeys(a, b) {
  const A = parseWeekKey(a);
  const B = parseWeekKey(b);
  if (A.year !== B.year) return A.year - B.year;
  return A.week - B.week;
}
function startOfISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 1 - dayNum);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function buildProgressTimeline(logs) {
  if (!logs.length) return [];
  const firstDate = toDate(logs[logs.length - 1].timestamp || logs[logs.length - 1].createdAt || logs[logs.length - 1]._creationTime);
  const lastDate  = toDate(logs[0].timestamp           || logs[0].createdAt           || logs[0]._creationTime);
  if (!firstDate || !lastDate) return [];

  const start = startOfISOWeek(firstDate);
  const end   = startOfISOWeek(lastDate);
  const weeks = [];
  for (let cur = new Date(start); cur <= end; cur.setUTCDate(cur.getUTCDate() + 7)) {
    weeks.push(weekKeyFromDate(cur));
  }
  return weeks;
}

function safeNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

function getSetWeight(ex, set) {
  const setWeight = safeNum(set?.weight);
  if (setWeight && setWeight > 0) return setWeight;
  const exWeight = safeNum(ex?.weight);
  if (exWeight && exWeight > 0) return exWeight;
  return null;
}

function getSetReps(set) {
  const done = safeNum(set?.done);
  if (done && done > 0) return done;
  const targetMin = safeNum(set?.target?.min);
  if (targetMin && targetMin > 0) return targetMin;
  return null;
}

export default function Progress() {
  const { user } = useContext(UserContext);
  const userData = useQuery(api.users.GetUser, user?.email ? { email: user.email } : 'skip');

  const workoutLogs = useQuery(
    api.workouts.getHistory,
    user?._id ? { userId: user._id } : 'skip'
  ) || [];

  if (!userData) {
    return (
      <View>
        <Text style={styles.loadingText}>Loading Progress...</Text>
      </View>
    );
  }

  const unitLabel = userData?.unitSystem === 'imperial' ? 'lb' : 'kg';

  const sortedLogs = [...workoutLogs].sort((a, b) => {
    const da = toDate(a.timestamp || a.createdAt || a._creationTime);
    const db = toDate(b.timestamp || b.createdAt || b._creationTime);
    return (db?.getTime() || 0) - (da?.getTime() || 0);
  });

  const lastLog = sortedLogs[0];
  const lastLogDate = toDate(lastLog?.timestamp || lastLog?.createdAt || lastLog?._creationTime);
  const daysSinceLastWorkout = lastLogDate
    ? Math.floor((Date.now() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const weeklyProgress = {};
  const exerciseCounts = {};
  const latestExerciseWeight = {};
  for (const log of sortedLogs) {
    const d = toDate(log.timestamp || log.createdAt || log._creationTime);
    if (!d) continue;
    const wk = weekKeyFromDate(d);
    const exercises = log.workoutData || log.exercises || [];
    let volumeInLog = 0;
    for (const ex of exercises) {
      const exName = ex?.name || ex?.exercise || "Exercise";
      const sets = Array.isArray(ex?.sets) ? ex.sets : [];
      for (const set of sets) {
        const weight = getSetWeight(ex, set);
        const reps = getSetReps(set);
        if (!weight || !reps) continue;
        volumeInLog += weight * reps;
        exerciseCounts[exName] = (exerciseCounts[exName] || 0) + 1;
        if (!latestExerciseWeight[exName]) {
          latestExerciseWeight[exName] = { weight, date: d };
        }
      }
    }
    weeklyProgress[wk] = (weeklyProgress[wk] || 0) + volumeInLog;
  }

  const thisWeekKey = weekKeyFromDate(new Date());
  const weeklyVolume = Math.round(weeklyProgress[thisWeekKey] || 0);

  const loggedExercises = workoutLogs.flatMap(log => log.workoutData || log.exercises || []);
  const totalVolumeAllTime = Math.round(
    loggedExercises.reduce((sum, ex) => {
      const sets = Array.isArray(ex?.sets) ? ex.sets : [];
      for (const set of sets) {
        const weight = getSetWeight(ex, set);
        const reps = getSetReps(set);
        if (!weight || !reps) continue;
        sum += weight * reps;
      }
      return sum;
    }, 0)
  );

  const MAX_WEEKS = 12;
  const timelineAll = buildProgressTimeline(sortedLogs);
  const timeline = timelineAll.slice(-MAX_WEEKS);
  const chartLabels = timeline.map((_, i) => `W${i + 1}`);
  const chartValues = timeline.map(k => Math.round(weeklyProgress[k] || 0));

  const paddedLabels = ["", ...chartLabels];
  const paddedValues = [0, ...chartValues];
  const scaledValues = paddedValues.map(v => v);

  const lineChartData = {
    labels: paddedLabels,
    datasets: [
      {
        data: scaledValues,
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const pieChartData = {
    labels: paddedLabels,
    datasets: [
      {
        data: scaledValues,
        color: (opacity = 1) => `rgbaArrayToRGBAColor(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: Colors.PRIMARY,
    backgroundGradientFrom: "#1C1C1E",
    backgroundGradientTo: "#5A3FFF",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#fff',
      fill: "#00ffcc",
    },
  };

  let streak = 0;
  for (let i = timeline.length - 1; i >= 0; i--) {
    const wk = timeline[i];
    if ((weeklyProgress[wk] || 0) > 0) streak += 1;
    else break;
  }


  const weeklyScore  = Math.min((weeklyVolume / 100) * 4, 60);
  const streakScore  = Math.min(streak * 6, 30);
  const recencyScore = Math.max(0, 10 - Math.min(10, (daysSinceLastWorkout ?? 10)));
  const progressIndex = Math.round(Math.min(weeklyScore + streakScore + recencyScore, 100));

  function getStatus(index) {
    if (index < 30) return 'Beginner';
    if (index < 70) return 'Intermediate';
    return 'BEAST';
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Progress</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Development Index</Text>

        <View style={{ alignItems: "center", marginVertical: 12 }}>
          <ProgressRing
            value={progressIndex}
            max={100}
            size={230}
            strokeWidth={20}
            trackColor="rgba(90,63,255,0.15)"
            progressColor={Colors.PRIMARY}
            textColor={Colors.PRIMARY}
          />
        </View>
        <Text style={styles.progressStatus}>{getStatus(progressIndex)}</Text>
        <Text style={styles.description}>
          Based only on your training volume, weekly streak and recency.
        </Text>
      </View>

      <Text style={styles.cardTitle}>Progress (Weekly Volume)</Text>
      {chartValues.length > 0 && chartValues.some(v => v > 0) ? (
        <LineChart
          style={{ marginBottom: 20, borderRadius: 12, }}
          data={lineChartData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          fromZero
          yAxisInterval={1}
          segments={4}
        />
      ) : (
        <View style={[styles.card, { backgroundColor: '#fafafa' }]}>
          <Text style={styles.noDataText}>
            Log some workouts to see your progress curve.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Volume This Week</Text>
        <Text style={styles.bigStat}>{weeklyVolume} total</Text>
        <Text style={styles.description}>
          Total volume = sets x reps x weight (current week).
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>All-Time Volume</Text>
        <Text style={styles.bigStat}>{totalVolumeAllTime} total</Text>
        <Text style={styles.description}>Cumulative volume across fetched logs.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top Exercises (Weighted)</Text>
        {Object.keys(exerciseCounts).length ? (
          Object.entries(exerciseCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name], i) => {
              const latest = latestExerciseWeight[name];
              return (
                <View key={`${name}-${i}`} style={styles.statRow}>
                  <Text style={styles.statName}>{name}</Text>
                  <Text style={styles.statValue}>
                    {latest?.weight ? `${latest.weight} ${unitLabel}` : '-'}
                  </Text>
                </View>
              );
            })
        ) : (
          <Text style={styles.noDataText}>No workouts logged yet.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Days Since Last Workout</Text>
        <Text style={styles.bigStat}>
          {daysSinceLastWorkout !== null ? `${daysSinceLastWorkout} day(s)` : 'No logs yet'}
        </Text>
        <Text style={styles.description}>Keep stacking wins. Tiny reps, big results.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly Workout Streak</Text>
        <Text style={styles.bigStat}>{streak} week(s) in a row</Text>
        <Text style={styles.description}>Show up. That’s the whole game.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 30,
    marginBottom: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'left',
    marginTop: 40,
    marginBottom: 25,
    color: Colors.CHARCOAL,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'left',
    marginBottom: 25,
    color: Colors.GRAY,
  },
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.CHARCOAL,
  },
  progressNumber: {
    fontSize: 38,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    textAlign: 'center',
  },
  progressStatus: {
    fontSize: 16,
    color: Colors.GREEN,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
  bigStat: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    textAlign: 'center',
    marginTop: 10,
  },
  statRow: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: Colors.LIGHTGRAY,
  },
  statName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.CHARCOAL,
    maxWidth: 200,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    maxWidth: 160,
    textAlign: 'right',
  },
  noDataText: {
    color: Colors.GRAY,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    color: Colors.GRAY,
    marginTop: 50,
  },
  separator: {
    height: 1,
    width: '120%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 10,
  },
});

