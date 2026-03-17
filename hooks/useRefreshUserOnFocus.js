import { useFocusEffect } from "expo-router";
import { useCallback, useContext } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { UserContext } from "../context/UserContext";

export default function useRefreshUserOnFocus() {
  const { user, setUser } = useContext(UserContext);
  const refetchUser = useMutation(api.users.RefetchUser);

  useFocusEffect(
    useCallback(() => {
      if (!user?.email || user.subscribed) return;
      refetchUser({ email: user.email })
        .then(setUser)
    }, [user?.email, user?.subscribed])
  );
}
