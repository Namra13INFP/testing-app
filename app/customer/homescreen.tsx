// app/admin/HomeScreen.tsx
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AdminHomeScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Greeting */}
      <Text style={styles.greeting}>Good Morning, Admin</Text>

      {/* Gradient Header Card */}
      <LinearGradient
        colors={["#FF8C42", "#FF6B00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerCard}
      >
        <Text style={styles.headerTitle}>Create a new event</Text>
        <Text style={styles.headerSubtitle}>
          Start managing your events with ease.
        </Text>
      </LinearGradient>

      {/* Quick Access */}
      <Text style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.quickAccessRow}>
        <TouchableOpacity style={styles.quickAccessCard}>
          <Ionicons name="list" size={28} color="#FF6B00" />
          <Text style={styles.quickAccessText}>Requests</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAccessCard}>
          <MaterialIcons name="payment" size={28} color="#FF6B00" />
          <Text style={styles.quickAccessText}>Payments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAccessCard}>
          <FontAwesome5 name="user-plus" size={24} color="#FF6B00" />
          <Text style={styles.quickAccessText}>Add Employees</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  headerCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#FFF",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  quickAccessRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickAccessCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    paddingVertical: 20,
    marginHorizontal: 5,
    borderRadius: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  quickAccessText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
});
