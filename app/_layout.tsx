import { Slot } from "expo-router";
import { useEffect } from "react";
import { LogLevel, OneSignal } from "react-native-onesignal";

export default function RootLayout() {
  useEffect(() => {
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    OneSignal.initialize("bbbc7661-47ee-42d1-8ac0-b6cac97109cb");
    OneSignal.Notifications.requestPermission(true);
  }, []);

  return <Slot />; 
}
