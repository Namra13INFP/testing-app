import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";

export default async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    Alert.alert("Push notifications require a physical device");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        // optionally set providesAppNotificationSettings: true
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert("Permission not granted for push notifications");
    return null;
  }

  // create android channel (safe to call multiple times)
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}
