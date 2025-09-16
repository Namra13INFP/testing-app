// app/create_event.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function EventOnlyOne() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hi this is the event only one screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
});
