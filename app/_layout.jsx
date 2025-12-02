// app/_layout.jsx
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import { AUTO_LOGIN } from "../config/appSettings";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

// Keep splash visible until we decide where to go
SplashScreen.preventAutoHideAsync();

const _layout = () => (
  <AuthProvider>
    <MainLayout />
  </AuthProvider>
);

const MainLayout = () => {
  const router = useRouter();
  const { user, hydrated } = useAuth();

  // Decide initial route ONCE when hydration completes
  useEffect(() => {
    if (!hydrated) return;

    if (AUTO_LOGIN && user) {
      router.replace("(main)/home");   // change if your app's home route differs
    } else {
      router.replace("welcome");       // file: app/welcome.jsx
    }

    // Hide splash after we navigated
    SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]); // intentionally NOT depending on `user`

  // Keep a blank screen under the splash while deciding
  if (!hydrated) return <View style={{ flex: 1 }} />;

  // Your existing stack stays
  return <Stack screenOptions={{ headerShown: false }} />;
};

export default _layout;
