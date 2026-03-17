import { router, useRouter } from "expo-router";
import { useContext, useState, useRef, useEffect } from "react";
import { UserContext } from "../../../context/UserContext";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import Colors from "../../../shared/Colors";
import Button from "../../../components/shared/Button";
import StepDots from "../../../components/shared/StepDots";

export default function previewScreen() {
    const { user } = useContext(UserContext);

    const [refreshKey, setRefreshKey] = useState(0);

    const videoRef = useRef(null);
    
    useEffect(() => {
        return () => {
            videoRef.current?.stopAsync();
        };
    }, []);

    const dbUser = useQuery(
        api.users.GetUser,
        user?.email ? { email: user.email } : "skip",
        { key: refreshKey }
    );

    const entitled = (() => {
        if (!dbUser?.subscribed) return false;
        if (!dbUser?.trialEndsAt) return true;
        return Date.now() < dbUser.trialEndsAt;
    })();

    const hasNavigated = useRef(false);

    useEffect(() => {
        if (entitled && !hasNavigated.current) {
        hasNavigated.current = true;
        InteractionManager.runAfterInteractions(() => {
            router.replace("/(tabs)/Home");
        });
        }
    }, [entitled]);

    return(
        <ImageBackground
            source={require('../../../assets/images/previewScreen.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <ScrollView contentContainerStyle={styles.container}>

                <Text style={{ color: 'white', fontSize: 33, position: 'absolute', top: 150, textAlign: 'center', fontWeight: '300'}}>
                    Finally stay consistent in the gym
                </Text>

                <Text style={{ color: Colors.LIGHTGRAY, fontSize: 16, position: 'absolute', top: 250, textAlign: 'center', width: '90%'}}>
                    Fytro AI builds your workouts, tracks your progress, and adapts every
                    week so you actually improve.
                </Text>

                <View style={{ alignItems: 'center', position: 'absolute', top: 700, width: '100%' }}>
                    <Button title="Try for FREE" onPress={() => router.push('/preferance/paywall/proof')} />
                    <StepDots total={3} index={0} />
                </View>
            </ScrollView>
        </ImageBackground>
    )
}

const styles = StyleSheet.create({
    container: {
    padding: 24,
    alignItems: 'center',
    flexGrow: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 80,
        marginBottom: 30,
        width: 300,
    },
    smallText: {
        marginVertical: 20,
        fontWeight: '600',
        fontSize: 16,
    },
    priceText: {
        fontSize: 14,
        marginTop: 20,
        marginBottom: 20,
        color: Colors.GRAY,

    },
    continueBtn: {
        width: '90%',
        height: 50,
        borderRadius: 15,
        backgroundColor: Colors.PRIMARY,
    },
    background: {
    flex: 1,
    width: '100%',
    },
})