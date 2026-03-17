import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useMutation } from 'convex/react';
import { api } from './../convex/_generated/api';
import { useContext } from 'react';
import { UserContext } from './../context/UserContext';

export default function StripeSuccess() {
  const router = useRouter();
  const { user, setUser } = useContext(UserContext);
  const refetchUser = useMutation(api.users.RefetchUser);

  useEffect(() => {
    const verify = async () => {
      await new Promise((r) => setTimeout(r, 3000));
      const updated = await refetchUser({ email: user.email });
      setUser(updated);
      if (updated?.subscribed) {
        router.replace('/(tabs)/Home');
      }
    };
    verify();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Verifying your subscription...</Text>
    </View>
  );
}
