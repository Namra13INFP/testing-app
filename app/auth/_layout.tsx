import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* all screens inside this folder will inherit this layout */}
    </Stack>
  );
}
