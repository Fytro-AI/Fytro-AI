import React, { createContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/FirebaseConfig";
import { api } from "../convex/_generated/api";
import { ConvexReactClient } from "convex/react";

export type UserType = any;

export type UserContextType = {
  user: UserType | null;
  setUser: React.Dispatch<React.SetStateAction<UserType | null>>;
};

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});

// ✅ Create Convex client once (NOT inside component / callback)
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        // signed out
        if (!firebaseUser) {
          if (!cancelled) setUser(null);
          await AsyncStorage.removeItem("fytro_user");
          return;
        }

        const uid = firebaseUser.uid;

        // ✅ guest OR real: look up by UID
        const existing = await convex.query(api.users.GetUserByUid, { uid });

        if (existing?._id) {
          if (!cancelled) setUser(existing);
          await AsyncStorage.setItem("fytro_user", JSON.stringify(existing));
          return;
        }

        // ✅ if anonymous user but convex doc missing, create it
        if (firebaseUser.isAnonymous) {
          const guestDoc = await convex.mutation(api.users.UpsertGuestUser, { uid });
          if (!cancelled) setUser(guestDoc);
          await AsyncStorage.setItem("fytro_user", JSON.stringify(guestDoc));
          return;
        }

        // non-anon user but no convex doc yet (edge case)
        if (!cancelled) setUser(null);
      } catch (e) {
        console.log("UserProvider auth handler error:", e);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user, setUser }), [user]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
