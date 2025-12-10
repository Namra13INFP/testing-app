import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";

export default async function registerForPushNotificationsAsync() {
  // Must be physical device
  if (!Device.isDevice) {
    Alert.alert("Push notifications require a physical device");
    return null;
  }

  // 1. Ask permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert("Permission NOT granted for notifications");
    return null;
  }

  // 2. Create Android channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  // 3. Get projectId from app config
  const projectId = Constants?.expoConfig?.extra?.eas?.projectId 
                 || Constants?.easConfig?.projectId; // fallback

  // 4. Get Expo push token (SDK 51+ requires projectId)
  const token = (await Notifications.getExpoPushTokenAsync({
    projectId,
  })).data;

  console.log("🔥 Expo Token:", token);

  return token;
}
