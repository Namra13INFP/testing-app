// app/admin/homescreen.tsx
import { db } from "@/config/firebaseConfig"; // ⬅️ make sure this is correct
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AdminHomeScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);

  // Fetch events from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "events"));
        const eventsData: any[] = [];
        querySnapshot.forEach((doc) => {
          eventsData.push(doc.data()); // use the data directly, including title
        });
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Greeting */}
      <Text style={styles.greeting}>Good Morning, Admin</Text>

      {/* Create Event Card */}
      <TouchableOpacity
        style={styles.createEventCard}
        onPress={() => router.push("/admin/create_event")}
      >
        <Text style={styles.createEventTitle}>Create a new event</Text>
        <Text style={styles.createEventSubtitle}>
          Create your most awesome & magical event.
        </Text>
      </TouchableOpacity>

      {/* Manage Your Events Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Manage your events</Text>
        <TouchableOpacity onPress={() => router.push("/admin/manage_events")}>
          <Text style={styles.arrow}>➔</Text>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      <FlatList
        data={events}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.title} // use title instead of ID
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.eventCard}
            onPress={() => router.push(`/admin/event_only_one?title=${item.title}`)}
          >
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.eventImage} />
            ) : (
              <View style={styles.eventImagePlaceholder} />
            )}
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventSubtitle}>
              {item.date} | {item.venue}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Quick Access */}
      <Text style={styles.sectionTitle}>Quick access</Text>
      <View style={styles.quickAccess}>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => router.push("/admin/booking_requests")}
        >
          <Text style={styles.quickText}>Booking Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => router.push("/admin/add_employee")}
        >
          <Text style={styles.quickText}>Manage Employees</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => router.push("/admin/pending_payments")}
        >
          <Text style={styles.quickText}>Payments</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => router.push("/admin/")}
        >
          <Text style={styles.quickText}>Drafts</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
  },
  createEventCard: {
    backgroundColor: "orange",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  createEventTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  createEventSubtitle: {
    fontSize: 14,
    color: "#fff",
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 8,
  },
  arrow: {
    fontSize: 20,
    fontWeight: "700",
    color: "orange",
  },
  eventCard: {
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    marginRight: 12,
    padding: 12,
    width: 160,
  },
  eventImage: {
    width: "100%",
    height: 80,
    borderRadius: 10,
    marginBottom: 8,
  },
  eventImagePlaceholder: {
    width: "100%",
    height: 80,
    backgroundColor: "#ddd",
    borderRadius: 10,
    marginBottom: 8,
  },
  eventTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  eventSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  quickAccess: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 12,
  },
  quickCard: {
    backgroundColor: "#f7f7f7",
    width: "48%",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  quickText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
