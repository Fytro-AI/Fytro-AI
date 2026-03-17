import { useConvex, useMutation } from 'convex/react';
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useContext, useState } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { UserContext } from '../../context/UserContext';
import { api } from '../../convex/_generated/api';
import { auth } from '../../services/FirebaseConfig';
import Colors from '../../shared/Colors';
import { signInAnonymously } from 'firebase/auth';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const convex = useConvex();
  const { user, setUser } = useContext(UserContext);

  const upsertGuestUser = useMutation(api.users.UpsertGuestUser);

  const onContinueAsGuest = async () => {
    try {
      const cred = await signInAnonymously(auth);
      const uid = cred.user.uid;

      const userDoc = await upsertGuestUser({ uid });

      setUser(userDoc);
      router.replace("/(tabs)/Home");
    } catch (error) {
      console.log("Guest login error:", error);
      Alert.alert("Error", "Failed to continue as guest");
    }
  };

  const onSignIn = () => {
    if (!email || !password) {
      Alert.alert('Missing Fields!', 'Make sure to fill all fields');
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const firebaseUser = userCredential.user;
        if (!firebaseUser?.email) return;

        const userData = await convex.query(api.users.GetUser, {
          email: firebaseUser.email,
        });

        if (!userData?._id) {
          Alert.alert('Error', 'User not found.');
          return;
        }

        setUser(userData);
        router.replace('/(tabs)/Home');
      })
      .catch((error) => {
        console.log('LOGIN ERROR CODE:', error.code);
        console.log('LOGIN ERROR MESSAGE:', error.message);
        Alert.alert(error.code, error.message);
      });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Animated.Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          entering={FadeInUp.duration(600)}
        />

        <Animated.Text style={styles.title} entering={FadeInUp.delay(100).duration(500)}>
          Welcome Back
        </Animated.Text>
        <Animated.Text style={styles.subtitle} entering={FadeInUp.delay(150).duration(500)}>
          Log in to get back to your grind
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.inputGroup}>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholderTextColor={Colors.GRAY}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            placeholderTextColor={Colors.GRAY}
            secureTextEntry
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ width: '100%' }}>
          <TouchableOpacity style={styles.button} onPress={onSignIn}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: "#fff", marginTop: 12, borderWidth: 1, borderColor: Colors.PRIMARY }
            ]}
            onPress={onContinueAsGuest}
          >
            <Text style={{ color: Colors.PRIMARY, fontSize: 16, fontWeight: "700" }}>
              Continue without an account
            </Text>
          </TouchableOpacity> */}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.bottomText}>
          <Text style={{ color: Colors.GRAY }}>Don't have an account?</Text>
          <Link href="/auth/SignUp">
            <Text style={styles.link}> Create one</Text>
          </Link>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.CHARCOAL,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.GRAY,
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    borderBottomWidth: 2,
    borderColor: Colors.PRIMARY,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
    color: Colors.CHARCOAL,
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomText: {
    flexDirection: 'row',
    marginTop: 25,
  },
  link: {
    fontWeight: '700',
    color: Colors.PRIMARY,
  },
});
