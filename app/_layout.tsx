import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/login"  />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

// import { Slot } from "expo-router";
// import { useEffect } from "react";
// import { LogLevel, OneSignal } from "react-native-onesignal";

// export default function RootLayout() {
//   useEffect(() => {
//     OneSignal.Debug.setLogLevel(LogLevel.Verbose);
//     OneSignal.initialize("bbbc7661-47ee-42d1-8ac0-b6cac97109cb");
//     OneSignal.Notifications.requestPermission(true);
//   }, []);

//   return <Slot />; 
// }
