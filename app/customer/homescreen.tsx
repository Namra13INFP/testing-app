import { db } from "@/config/firebaseConfig";
import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CustomerHome() {
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snapshot) => {
      const eventsData: any[] = [];
      snapshot.forEach((doc) => eventsData.push(doc.data()));
      setEvents(eventsData);
      setFilteredEvents(eventsData); 
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    let data = events;

    if (location.trim() !== "") {
      data = data.filter((item) =>
        item.location?.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (capacity.trim() !== "") {
      const enteredCap = parseInt(capacity, 10);
      if (!isNaN(enteredCap)) {
        data = data.filter((item) => item.capacity >= enteredCap);
      }
    }

    setFilteredEvents(data);
  }, [location, capacity, events]);

  const renderEvent = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => router.push(`/customer/secure_booking?title=${item.title}`)}
    >
      {(item.imageBase64 || item.imageUrl) ? (
        <Image
          source={{
            uri: (() => {
              const base64 = item.imageBase64;
              const url = item.imageUrl;
              if (base64 && typeof base64 === "string") {
                return base64.startsWith("data:")
                  ? base64
                  : `data:image/jpeg;base64,${base64}`;
              }
              if (url && typeof url === "string") return url;
              return "";
            })(),
          }}
          style={styles.eventImage}
        />
      ) : (
        <View
          style={[styles.eventImage, { justifyContent: "center", alignItems: "center" }]}
        >
          <Text style={{ color: "#888" }}>No Image</Text>
        </View>
      )}

      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventLocation}>{item.location}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}>
      <View style={styles.container}>
        <Text style={styles.header}>Available Events</Text>

        <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.searchBar}>
          <Text>{expanded ? "Close Search" : "Search Events"}</Text>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.searchFields}>
            <TextInput
              placeholder="Location"
              value={location}
              onChangeText={setLocation}
              style={styles.input}
            />
            <TextInput
              placeholder="Capacity"
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        )}

        <FlatList
          data={filteredEvents}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderEvent}
          contentContainerStyle={{ paddingBottom: 100 }} 
        />
      </View>

      {/* 🔶 Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => router.push("/customer/payment")}
        >
          <Text style={styles.tabButtonText}>PAYMENT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 10 },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "orange",
    marginBottom: 40,
  },
  searchBar: {
    backgroundColor: "#eee",
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  searchFields: { flexDirection: "row", gap: 10, marginBottom: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
  },
  eventCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 2,
  },
  eventImage: { width: "100%", height: 150, resizeMode: "cover" },
  eventInfo: { padding: 10 },
  eventTitle: { fontSize: 16, fontWeight: "bold" },
  eventLocation: { fontSize: 14, color: "#666" },

  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
  tabButton: {
    backgroundColor: "orange",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  tabButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
