import { useContext, useEffect } from 'react';
import { Dimensions, Image, Text, View, StyleSheet, Alert } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { useConvex } from 'convex/react';
import { UserContext } from '../context/UserContext';
import { api } from '../convex/_generated/api';
import { auth } from './../services/FirebaseConfig';
import Button from '../components/shared/Button';
import Colors from '../shared/Colors';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function Index() {
  const router = useRouter();
  const { setUser } = useContext(UserContext);
  const convex = useConvex();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userInfo) => {
      try {
        if (!userInfo) return;

        // ✅ works for guest + normal users
        const userData = await convex.query(api.users.GetUserByUid, {
          uid: userInfo.uid,
        });

        if (userData?._id) {
          setUser(userData);
          router.replace("/(tabs)/Home");
          return;
        }

        // If Firebase user exists but Convex user doesn't:
        // - for anonymous, you probably want to create it (upsert) then go tabs
        if (userInfo.isAnonymous) {
          const guestDoc = await convex.mutation(api.users.UpsertGuestUser, {
            uid: userInfo.uid,
          });
          setUser(guestDoc);
          router.replace("/(tabs)/Home");
          return;
        }

        // Non-anon but no convex doc → send them to signup/onboarding
        router.replace("/auth/SignUp");
      } catch (err) {
        console.log("INDEX AUTH ERROR", err);
        Alert.alert("Error", "Something went wrong");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>

      <View style={styles.overlay}>
        <Image
          source={require('../assets/images/logo.png')}
          style={{ 
            width: 150,
            height: 150,
            resizeMode: 'contain',
            marginBottom: 20,
            marginTop: 20,
          }}
        />

        <Animated.Text entering={FadeInUp.delay(100).duration(500)} style={styles.title}>Fytro AI</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(150).duration(500)} style={styles.subtitle}>
          Personal AI coach in your back pocket
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.buttonContainer}>
          <Button title="Get Started" onPress={() => router.push('/auth/SignUp')} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    width: '100%',
    height: Dimensions.get('screen').height,
    backgroundColor: '#F4F4F4',
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 25,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.CHARCOAL,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: Colors.GRAY,
    marginBottom: 50,
    lineHeight: 26,
  },
  buttonContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 40,
  },
});
