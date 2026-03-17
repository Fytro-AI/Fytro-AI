import { useMutation } from 'convex/react';
import { Link, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useContext, useEffect, useState } from 'react';
import { Alert, Text, View, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, StyleSheet, Image, } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { UserContext } from '../../context/UserContext';
import { api } from '../../convex/_generated/api';
import { auth } from '../../services/FirebaseConfig';
import Colors from '../../shared/Colors';
import { signInAnonymously, EmailAuthProvider, linkWithCredential, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleFirebaseSignIn() {
  const projectNameForProxy = "@fytroai/fytro-ai";

  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: true,
    projectNameForProxy,
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    redirectUri,
  });

  const handleResponse = () => {
    if (response?.type !== "success") return null;
    const { id_token, access_token } = response.params ?? {};
    if (!id_token) return null;
    return { idToken: id_token, accessToken: access_token };
  };

  return {
    request,
    redirectUri, // 👈 return it so you can log it in the component
    promptAsync: (opts) => promptAsync({ ...opts, useProxy: true }),
    handleResponse,
  };
}

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const createNewUser = useMutation(api.users.CreateNewUser);
  const { setUser } = useContext(UserContext);

  const { promptAsync, handleResponse, redirectUri } = useGoogleFirebaseSignIn();
  console.log("GOOGLE redirectUri:", redirectUri);

  const onGooglePress = async () => {
    try {
      await promptAsync({ useProxy: true });
      const tokens = await handleResponse();
      if (!tokens) return;

      const googleCred = GoogleAuthProvider.credential(tokens.idToken, tokens.accessToken);

      const current = auth.currentUser;

      let firebaseUser;

      if (current?.isAnonymous) {
        const linked = await linkWithCredential(current, googleCred);
        firebaseUser = linked.user;
      } else {
        const signedIn = await signInWithCredential(auth, googleCred);
        firebaseUser = signedIn.user;
      }

      const result = await createNewUser({
        name: firebaseUser.displayName || name || "User",
        email: firebaseUser.email,
        uid: firebaseUser.uid,
      });

      setUser(result);

      const hasOnboarded =
        result?.age != null &&
        result?.gender != null &&
        result?.weight != null &&
        result?.goal;

      router.replace(hasOnboarded ? "/(tabs)/Home" : "/preferance/age");
    } catch (error) {
      console.log("GOOGLE SIGNIN ERROR:", error?.code, error?.message, error);

      if (error?.code === "auth/credential-already-in-use" && error?.credential) {
        try {
          const signedIn = await signInWithCredential(auth, error.credential);
          const firebaseUser = signedIn.user;

          const result = await createNewUser({
            name: firebaseUser.displayName || "User",
            email: firebaseUser.email,
            uid: firebaseUser.uid,
          });

          setUser(result);
          router.replace("/(tabs)/Home");
          return;
        } catch (e2) {
          console.log("RECOVERY ERROR:", e2);
        }
      }

      Alert.alert("Google sign-in failed", error?.message || "Try again");
    }
  };

  console.log("firebase user", {
    uid: auth.currentUser?.uid,
    isAnonymous: auth.currentUser?.isAnonymous,
    email: auth.currentUser?.email,
    providers: auth.currentUser?.providerData?.map(p => p.providerId),
  });

  const upsertGuestUser = useMutation(api.users.UpsertGuestUser);

  const onContinueAsGuest = async () => {
    try{
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

  const onSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert("Missing Fields!", "Make sure to fill all fields");
      return;
    }

    try {
      const current = auth.currentUser;

      if (current?.isAnonymous) {
        const credential = EmailAuthProvider.credential(email, password);
        const linked = await linkWithCredential(current, credential);

        const result = await createNewUser({
          name,
          email,
          uid: linked.user.uid,
        });

        setUser(result);
        router.replace("/preferance/age");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      const result = await createNewUser({
        name,
        email,
        uid: userCredential.user.uid,
      });

      const hasOnboarded =
        result?.age != null &&
        result?.gender != null &&
        result?.weight != null &&
        result?.goal;

      setUser(result);

      if (hasOnboarded) {
        router.replace("/(tabs)/Home");
      } else {
        router.replace("/preferance/age");
      }
    } catch (error) {
      console.log("SIGNUP ERROR:", error.code, error.message);
      Alert.alert(error.code, error.message);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          entering={FadeInUp.duration(600)}
        />

        <Animated.Text entering={FadeInUp.delay(100).duration(500)} style={styles.title}>
          Create Account
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(150).duration(500)} style={styles.subtitle}>
          Join Fytro and start training like never before.
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.inputGroup}>
          <TextInput
            placeholder="Username"
            style={styles.input}
            placeholderTextColor={Colors.GRAY}
            onChangeText={setName}
          />
          <TextInput
            placeholder="Email"
            style={styles.input}
            placeholderTextColor={Colors.GRAY}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Password"
            style={styles.input}
            placeholderTextColor={Colors.GRAY}
            onChangeText={setPassword}
            secureTextEntry
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ width: '100%' }}>
          <TouchableOpacity style={styles.button} onPress={onSignUp}>
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: "#fff", marginTop: 12, borderWidth: 1, borderColor: Colors.PRIMARY }
            ]}
            onPress={onContinueAsGuest}  
          >
            <Text style={{ color: Colors.PRIMARY, fontSize: 16, fontWeight: "700" }}>
              Continue as a guest (not recommended)
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* <TouchableOpacity
          style={[styles.button, { backgroundColor: "#fff", marginTop: 14, borderWidth: 1, borderColor: Colors.PRIMARY }]}
          onPress={onGooglePress}
        >
          <Text style={{ color: Colors.PRIMARY, fontWeight: "700" }}>
            Continue with Google
          </Text>
        </TouchableOpacity> */}


        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.bottomText}>
          <Text style={{ color: Colors.GRAY }}>Already have an account?</Text>
          <Link href="/auth/SignIn">
            <Text style={styles.link}> Sign in here</Text>
          </Link>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F4F4F4',
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
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
