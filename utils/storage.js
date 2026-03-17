import * as SecureStore from 'expo-secure-store';

export async function saveUser(user) {
  const minimal = {
    _id: user._id,
    email: user.email,
    subscribed: user.subscribed,
    stripeCustomerId: user.stripeCustomerId,
  };
  await SecureStore.setItemAsync('user', JSON.stringify(minimal));
}


export async function getUser() {
  const stored = await SecureStore.getItemAsync('user');
  return stored ? JSON.parse(stored) : null;
}


export async function clearUser() {
    await SecureStore.deleteItemAsync('user');
}