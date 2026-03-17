import { useContext, useEffect, useMemo, useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  Pressable,
  Button,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Animated, { FadeInUp, FadeInLeft, SlideInDown, } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import styles from "../../styles/HomeStyles";
import { UserContext } from '../../context/UserContext';
import Colors from '../../shared/Colors';
import FytroHeader from '../../components/FytroHeader';
import { api } from '../../convex/_generated/api';
import useRefreshUserOnFocus from '../../hooks/useRefreshUserOnFocus';
import { ALL_EXERCISES } from '../../constants/allExercises';
import { BedDoubleIcon, CheckmarkCircle02Icon, Dumbbell02Icon, SettingDone01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import AnimatedCard from '../../components/shared/TapAnimation';
import SelectedWorkoutContainer from '../../components/home/selectedWorkoutContainer';
import CompletedWorkoutsContainer from '../../components/home/completedWorkoutsContainer';

const WEEK_START = 0;

const DAY_KEYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const WEEK_DAYS = [
  { key: 'Mon', label: 'Monday' },
  { key: 'Tue', label: 'Tuesday' },
  { key: 'Wed', label: 'Wednesday' },
  { key: 'Thu', label: 'Thursday' },
  { key: 'Fri', label: 'Friday' },
  { key: 'Sat', label: 'Saturday' },
  { key: 'Sun', label: 'Sunday' },
];

function getDayKeyFromDate(d) {
  return DAY_KEYS[d.getDay()];
}

function startOfWeek(date = new Date(), weekStartsOn = WEEK_START) {
  const d = new Date(date);
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0,0,0,0);
  return d;
}

function endOfWeek(date = new Date(), weekStartsOn = WEEK_START) {
  const start = startOfWeek(date, weekStartsOn);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return end;
}

function isInCurrentWeek(ts) {
  const t = new Date(ts);
  const start = startOfWeek();
  const end = endOfWeek();
  return t >= start && t < end;
}

function normalizeDay(val) {
  if (!val) return null;
  const s = String(val).trim().toLowerCase();
  const map = {
    sun: "Sun", sunday: "Sun",
    mon: "Mon", monday: "Mon",
    tue: "Tue", tues: "Tue", tuesday: "Tue",
    wed: "Wed", wednesday: "Wed",
    thu: "Thu", thur: "Thu", thurs: "Thu", thursday: "Thu",
    fri: "Fri", friday: "Fri",
    sat: "Sat", saturday: "Sat",
  };
  const k = s.slice(0,3);
  return map[s] ?? map[k] ?? null;
}

function getWorkoutDayFromLog(w) {
  const candidates = [w?.workoutDay, w?.day, w?.dayKey, w?.programDay, w?.planDay];
  return normalizeDay(candidates.find(Boolean));
}

function formatRepRange(repRange) {
  if (typeof repRange === 'object' && repRange?.min !== undefined && repRange?.max !== undefined) {
    return `${repRange.min}–${repRange.max}`;
  }
  return repRange;
}

function formatExerciseDetails(exercise) {
  const sets = Array.isArray(exercise.sets)
    ? exercise.sets.length
    : exercise.sets ?? '-';

  const repRange = formatRepRange(exercise.repRange ?? exercise.reps ?? '-');

  const isTimeBased =
    exercise.type === 'time' ||
    ALL_EXERCISES.find(e => e.name === (exercise.name ?? exercise.exercise))?.type === 'time';

  return `${sets} sets x ${repRange} ${isTimeBased ? 'sec' : 'reps'}`;
}

const getFollowUpOptions = (feeling) => {
  if (feeling === "Tough") return ["Recovery", "Motivation", "Too intense", "Schedule"];
  if (feeling === "Great") return ["Strength", "Consistency", "Energy", "Motivation"];
  if (feeling === "Okay") return ["Intensity", "Time", "Sleep", "Motivation"];
  return [];
};

export default function Home() {
  useRefreshUserOnFocus();

  const [activeStatsModal, setActiveStatsModal] = useState(null); 

  const now = new Date();
  const { user } = useContext(UserContext);
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showCompletedDays, setShowCompletedDays] = useState(false);
  const [showFullSummary, setShowFullSummary] = useState(false);

  const openPaywall = (dayKey) => {
    router.push({
      pathname: "/preferance/paywall/previewScreen",
      params: {
        day: dayKey,
        returnTo: "/(tabs)/Home", // so you can come back cleanly
      },
    });
  };

  const dbUser = useQuery(api.users.GetUser, user?.email ? { email: user.email } : "skip");
  const subscribed = !!dbUser?.subscribed;
  const onBreak = dbUser?.onBreak ?? false;
  const setBreak = useMutation(api.users.setBreakStatus);
  const setFeedback = useMutation(api.users.setFeedback);

  const allLogs = useQuery(
    api.workouts.getLoggedWorkouts,
    user?._id ? { userId: user._id } : "skip"
  ) || [];

  // useEffect(() => { 
  //   if (dbUser && !dbUser.subscribed) {
  //     router.replace('/(tabs)/Home')
  //   }
  // }, [dbUser]);
  useEffect(() => { if (user && !user.workout) router.replace('/preferance/age'); });
  useEffect(() => { if (user && !user.gender) router.replace('/preferance/age'); }, [user]);

  if (!user) return null;
  if (!user?.workout) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Generating your plan...</Text>
      </View>
    );
  }

  const workout = user.adjustedWorkout || user.workout;
  const currentDay = getDayKeyFromDate(new Date());

  const { usedCalendarDays, completedWorkoutDays } = useMemo(() => {
    const used = new Set();
    const done = new Set();

    for (const w of allLogs) {
      const ts = w?.timestamp ?? w?._creationTime ?? w?.createdAt;
      if (!ts) continue;
      if (!isInCurrentWeek(ts)) continue;

      const performedOn = getDayKeyFromDate(new Date(ts));
      used.add(performedOn);

      const programDay = getWorkoutDayFromLog(w);
      if (programDay) done.add(programDay);
    }

    return { usedCalendarDays: used, completedWorkoutDays: done };
  }, [allLogs]);

  useEffect(() => {
    console.log("allLogs length:", allLogs?.length);
    console.log("latest log:", allLogs?.[0]);
  }, [allLogs]);

  const isDayUsed = (key) => usedCalendarDays.has(key);
  const isWorkoutCompleted = (key) => completedWorkoutDays.has(key);
  const isBlocked = (key) => {
    const isTrainingDay = user.trainingDays?.includes(key);
    const hasWorkout = !!workout[key]?.length;
    const isRestDay = !isTrainingDay || !hasWorkout;

    if (isRestDay) {
      return false;
    }

    return isDayUsed(key) || isWorkoutCompleted(key);
  };

  const plannedDays = WEEK_DAYS.filter(day => workout[day.key]?.length).length;
  const completedDays = completedWorkoutDays.size;
  const remainingDays = Math.max(plannedDays - completedDays, 0);
  const trainedDays = usedCalendarDays.size;

  const subHeaders = [
    "Are you motivated or are you going to do it anyway?",
    "You only fail when you stop trying.",
    "Big dreams need big sacrifices.",
    "Time for a workout?",
    "Crush it today!",
    "Let's lift heavy!",
    "Consistency beats motivation.",
    "Strong body, strong mind.",
    "Push your limits.",
    "One more rep!",
    "Earn your progress.",
    "Your future self will thank you.",
    "Progress, not perfection.",
    "Dominate the day.",
    "Be proud, but never satisfied.",
    "Trust the process.",
    "Level up!",
    "Crush the weights!"
  ];

  const [randomWord, setRandomWord] = useState('');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * subHeaders.length);
    setRandomWord(subHeaders[randomIndex]);
  }, []);

  const submitFeedback = (text) => {
    setFeedback({ email: user.email, status: text });
  };


  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [feedbackReason, setFeedbackReason] = useState('');

  const [feedbackStep, setFeedbackStep] = useState(0);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    feeling: null,
    reason: null,
    note: '',
  });


  {showFeedback && feedbackVisible && (
    <View style={styles.floatingFeedback}>
      <Text style={styles.feedbackHeader}>How did training feel last week?</Text>

      {["Feeling great!", "Feeling good.", "Feeling okay.", "Feeling bad.", "I didn't train last week."].map((option) => (
        <Pressable
          key={option}
          onPress={() => {
            submitFeedback(option);
            setFeedbackVisible(false);
          }}
          style={styles.feedbackPressable}
        >
          <Text style={{ color: Colors.WHITE, textAlign: 'center', fontWeight: 'bold' }}>
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  )}

  // const feedbackForm = () => (
  //   <ScrollView animation="fadeInUp" style={styles.floatingFeedback} showsVerticalScrollIndicator={true}>

  //     <Text style={styles.feedbackHeader}>How did training feel last week?</Text>

  //     <Pressable onPress={() => submitFeedback("Feeling great!")} style={styles.feedbackPressable} >
  //       <Text style={{ color: Colors.WHITE, textAlign: 'center', fontWeight: 'bold' }}>
  //         Feeling great!
  //       </Text>
  //     </Pressable>

  //     <Pressable onPress={() => submitFeedback("Feeling good.")} style={styles.feedbackPressable} >
  //       <Text style={{ color: Colors.WHITE, textAlign: 'center', fontWeight: 'bold' }}>
  //         Feeling good.
  //       </Text>
  //     </Pressable>

  //     <Pressable onPress={() => submitFeedback("Feeling okay.")} style={styles.feedbackPressable} >
  //       <Text style={{ color: Colors.WHITE, textAlign: 'center', fontWeight: 'bold' }}>
  //         Feeling okay.
  //       </Text>
  //     </Pressable>

  //     <Pressable onPress={() => submitFeedback("Feeling bad.")} style={styles.feedbackPressable} >
  //       <Text style={{ color: Colors.WHITE, textAlign: 'center', fontWeight: 'bold' }}>
  //         Feeling bad.
  //       </Text>
  //     </Pressable>

  //   </ScrollView>
  // );


  const renderDayList = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <FytroHeader />
      <View style={styles.separator} />

      {user?.isGuest ? (
        <View style={{ padding: 10, backgroundColor: "#fff3cd", borderRadius: 10, marginBottom: 10 }}>
          <Text style={{ fontWeight: "700" }}>Guest mode</Text>
          <Text>
            Create an account to protect your progress and any purchases.
          </Text>
          <TouchableOpacity onPress={() => router.push("/auth/SignUp")}>
            <Text style={{ color: Colors.PRIMARY, fontWeight: "700", marginTop: 6 }}>
              Create account
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <LinearGradient
        colors={['#1C1C1E', '#2D2A50', '#5A3FFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroContainer}
      >
        <View style={styles.heroTop}>
          <Text style={styles.heroTitle}>
            Welcome back, {user?.name?.split(' ')[0] || 'champ'}
          </Text>
          <Text style={styles.heroQuote}>
            {randomWord}
          </Text>
        </View>

        <View style={styles.heroMetaRow}>
          <View style={styles.heroChip}>
            <Text style={styles.heroChipText}>{currentDay}</Text>
          </View>
          <Text style={styles.heroStatus}>
            {(() => {
              const isTrainingDay = user.trainingDays?.includes(currentDay);
              const hasWorkout = !!workout[currentDay]?.length;
              const isRestDay = !isTrainingDay || !hasWorkout;
              return isRestDay ? "Rest Day" : "Workout Day";
            })()}
          </Text>
        </View>

        <View style={styles.heroCtaRow}>
          {(() => {
            const isTrainingDay = user.trainingDays?.includes(currentDay);
            const hasWorkout = !!workout[currentDay]?.length;
            const isRestDay = !isTrainingDay || !hasWorkout;
            const blocked = isDayUsed(currentDay) || isWorkoutCompleted(currentDay);
            const ctaText = isRestDay ? "Choose Workout" : "Start Workout";

            return (
              <Pressable
                disabled={blocked}
                onPress={() => {
                  if (isRestDay) {
                    setShowWorkoutModal(true);
                  }
                  if (!blocked) {
                    setSelectedDay(currentDay);
                  }
                }}
                style={[
                  styles.primaryCta,
                  blocked && styles.primaryCtaDisabled,
                ]}
              >
                <Text style={styles.primaryCtaText}>
                  {blocked ? "Completed" : ctaText}
                </Text>
              </Pressable>
            );
          })()}
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        <Pressable
          onPress={() => completedDays > 0 && setActiveStatsModal("completed")}
          style={styles.statCard}
        >
          <Text style={styles.statValue}>{completedDays}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveStatsModal("remaining")}
          style={styles.statCard}
        >
          <Text style={styles.statValue}>{remainingDays}</Text>
          <Text style={styles.statLabel}>Remaining</Text>
        </Pressable>

        <Pressable
          onPress={() => trainedDays > 0 && setActiveStatsModal("trained")}
          style={styles.statCard}
        >
          <Text style={styles.statValue}>{trainedDays}</Text>
          <Text style={styles.statLabel}>Days Trained</Text>
        </Pressable>
      </View>

      <Animatable.View
        animation="fadeInUp"
        delay={100}
        style={styles.weekStrip}
      >
        <Text style={styles.sectionTitle}>Week Overview</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true} indicatorStyle='black'>
          <View style={styles.weekStripInner}>
            {WEEK_DAYS.map(({ key, label }, index) => {
              const isTrainingDay = user.trainingDays?.includes(key);
              const hasWorkout = !!workout[key]?.length;
              const isRestDay = !isTrainingDay || !hasWorkout;
              const today = key === currentDay;
              const blocked = isDayUsed(key) || isWorkoutCompleted(key);

              return (
                <Animatable.View
                  animation="fadeInUp"
                  delay={80 + index * 30}
                  key={key}
                  style={styles.weekPillItem}
                >
                  <AnimatedCard
                    onPress={() => {
                      if (!blocked) setSelectedDay(key);
                    }}
                  >
                    <View
                      style={[
                        styles.dayPill,
                        isRestDay && styles.dayPillRest,
                        today && styles.dayPillActive,
                        blocked && styles.dayPillDone,
                      ]}
                    >
                      <View style={[
                        styles.dayPillIcon,
                        blocked && styles.dayPillIconDone,
                      ]}>
                        {blocked ? (
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color={Colors.WHITE} />
                        ) : isRestDay ? (
                          <HugeiconsIcon icon={BedDoubleIcon} size={18} color="#888" />
                        ) : (
                          <HugeiconsIcon icon={Dumbbell02Icon} size={18} color={Colors.PRIMARY} />
                        )}
                      </View>
                      <Text style={styles.dayPillLabel}>{label.slice(0,3)}</Text>
                      <Text style={styles.dayPillSub}>
                        {isRestDay ? "Rest" : "Workout"}
                      </Text>
                    </View>
                  </AnimatedCard>
                </Animatable.View>
              );
            })}
          </View>
        </ScrollView>
      </Animatable.View>

      {/* {onBreak && (
        <View style={styles.breakBanner}>
          <Text style={styles.breakText}>You're currently on a break 🛌</Text>
          <Pressable style={styles.breakButton} onPress={() => setBreak({ email: user.email, status: false })}>
            <Text style={styles.breakButtonText}>Continue Workouts</Text>
          </Pressable>
        </View>
      )} */}

      <Animatable.View 
        animation="fadeInUp" 
        delay={100}
        style={styles.adjustmentContainer}
      >
        <View>
          <Text style={styles.adjustmentTitle}>
            <HugeiconsIcon
              icon={SettingDone01Icon}
              size={25}
              Color={Colors.CHARCOAL}
            /> 
            Auto Adjustments
          </Text>
        </View>
        <Text style={styles.subtitle}>Your workout was automatically adjusted - check below to see what changed.</Text>

        <Text
          style={[styles.adjustmentText, !showFullSummary && styles.collapsedText]}
          numberOfLines={showFullSummary ? undefined : 4}
        >
          {user.adjustmentSummary?.trim()
            ? user.adjustmentSummary
            : "No adjustments yet..."}
        </Text>

        {!!user.adjustmentSummary?.length && (
          <Pressable onPress={() => setShowFullSummary(prev => !prev)}>
            <Text style={styles.toggleText}>
              {showFullSummary ? "Hide ▲" : "Show ▼"}
            </Text>
          </Pressable>
        )}
      </Animatable.View>
    </ScrollView>
  );

  const renderSelectedDay = () => (
    <SelectedWorkoutContainer
      styles={styles}
      workout={workout}
      selectedDay={selectedDay}
      setSelectedDay={setSelectedDay}
      WEEK_DAYS={WEEK_DAYS}
      isDayUsed={isDayUsed}
      isWorkoutCompleted={isWorkoutCompleted}
      formatExerciseDetails={formatExerciseDetails}
      router={router}
      showWorkoutModal={showWorkoutModal}
      setShowWorkoutModal={setShowWorkoutModal}
      expandedDay={expandedDay}
      setExpandedDay={setExpandedDay}

      subscribed={subscribed}        // ✅ add
      openPaywall={openPaywall}      // ✅ add
    />
  );

  const renderCompleted = () => (
    <CompletedWorkoutsContainer
      styles={styles}
      workout={workout}
      WEEK_DAYS={WEEK_DAYS}
      isDayUsed={isDayUsed}
      isWorkoutCompleted={isWorkoutCompleted}
      showCompletedDays={showCompletedDays}
      setShowCompletedDays={setShowCompletedDays}
    />
  );

  const startOfWeekDate = startOfWeek(now);
  const weekNumber = Math.floor((now - new Date(user.createdAt || now)) / (7 * 24 * 60 * 60 * 1000)) + 1;

  const isMonday = now.getDay() === 1;

  const accountAgeMs = now.getTime() - (dbUser?._creationTime ?? 0);
  const accountOlderThanOneWeek = accountAgeMs > 7 * 24 * 60 * 60 * 1000;

  const startOfThisWeek = startOfWeek(now).getTime();
  const lastFeedbackTs = dbUser?.feedback?.timestamp ?? 0;

  const hasSubmittedThisWeek = lastFeedbackTs >= startOfThisWeek;

  const showFeedback = isMonday && accountOlderThanOneWeek && !hasSubmittedThisWeek;



  return (
    <>
      {
        selectedDay ? (
          renderSelectedDay()
        ) : activeStatsModal === "completed" ? (
          <CompletedWorkoutsContainer
            styles={styles}
            allLogs={allLogs}
            WEEK_DAYS={WEEK_DAYS}
            onBack={() => setActiveStatsModal(null)}
          />
        ) : (
          renderDayList()
        )
      }

      {showFeedback && !feedbackVisible && (
        <Pressable
          onPress={() => setFeedbackVisible(true)}
          style={styles.floatingBall}
        >
          <Text style={styles.floatingBallText}>💬</Text>
          <View style={styles.notificationBadge} />
        </Pressable>
      )}

      {feedbackVisible && (
        <Modal transparent animationType="slide" visible>
          <View style={styles.overlay}>
            <View style={styles.feedbackCard}>
              {feedbackStep === 0 && (
                <>
                  <Pressable onPress={() => setFeedbackVisible(false)} style={{ width: 20, height: 30 }}>
                    <Text style={{ fontSize: 20 }}>X</Text>
                  </Pressable>

                  <Text style={styles.feedbackHeader}>Weekly Check-In</Text>
                  <Text style={styles.feedbackSub}>How did training feel last week?</Text>
                  {["Great", "Okay", "Tough", "I didn't train last week"].map((feeling) => (
                    <Pressable
                      key={feeling}
                      style={styles.feedbackOption}
                      onPress={() => {
                        setFeedbackData(prev => ({ ...prev, feeling }));
                        setFeedbackStep(1);
                        if (feeling === "I didn't train last week") setFeedbackStep(3);
                      }}
                    >
                      <Text style={styles.optionText}>{feeling}</Text>
                    </Pressable>
                  ))}
                </>
              )}

              {feedbackStep === 1 && (
                <>
                <Pressable onPress={() => setFeedbackStep(0)} style={{ width: 20, height: 20 }}>
                  <Text style={{ fontSize: 20 }}>←</Text>
                </Pressable>

                  <Text style={styles.feedbackHeader}>Weekly Check-In</Text>
                  <Text style={styles.feedbackSub}>
                    {feedbackData.feeling === "Tough"
                      ? "What was hardest?"
                      : feedbackData.feeling === "Great"
                      ? "What went well?"
                      : "What could be better?"}
                  </Text>
                  {getFollowUpOptions(feedbackData.feeling).map((reason) => (
                    <Pressable
                      key={reason}
                      style={styles.feedbackOption}
                      onPress={() => {
                        setFeedbackData(prev => ({ ...prev, reason }));
                        setFeedbackStep(2);
                      }}
                    >
                      <Text style={styles.optionText}>{reason}</Text>
                    </Pressable>
                  ))}
                </>
              )}

              {feedbackStep === 2 && (
                <>
                <Pressable onPress={() => setFeedbackStep(1)} style={{ width: 20, height: 20 }}>
                  <Text style={{ fontSize: 20 }}>←</Text>
                </Pressable>

                  <Text style={styles.feedbackHeader}>Weekly Check-In</Text>
                  <Text style={styles.feedbackSub}>Anything else to share? (optional)</Text>
                  <TextInput
                    style={styles.feedbackInput}
                    placeholder="Write something..."
                    placeholderTextColor="#aaa"
                    multiline
                    maxLength={120}
                    numberOfLines={3}
                    value={feedbackData.note}
                    onChangeText={(text) =>
                      setFeedbackData((prev) => ({ ...prev, note: text }))
                    }
                  />
                  <Pressable
                    style={styles.submitButton}
                    onPress={() => {
                      const payload = JSON.stringify(feedbackData);
                      setFeedback({
                        email: user.email,
                        status: {
                          feeling: feedbackData.feeling,
                          reason: feedbackData.reason,
                          note: feedbackData.note,
                          timestamp: Date.now()
                        },
                      });
                      setFeedbackVisible(false);
                      setFeedbackStep(0);
                    }}
                  >
                    <Text style={styles.submitButtonText}>Finish</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}
