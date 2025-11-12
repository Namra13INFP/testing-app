import { db } from "@/config/firebaseConfig"; // adjust relative path if needed
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RequestOnlyOne() {
  const { title } = useLocalSearchParams(); // using title as document id
  const router = useRouter();

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch request by title
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const ref = doc(db, "requests", String(title));
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setRequest(snap.data());
        } else {
          Alert.alert("Not found", "This request does not exist.");
          router.back();
        }
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to fetch request details.");
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [title]);

  // Reject logic
  const handleReject = () => {
    Alert.alert("Reject Request", "Are you sure you want to reject this request?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const ref = doc(db, "requests", String(title));
            await updateDoc(ref, { status: "rejected" });
            router.replace("/admin/homescreen");
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to reject request.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Accept logic
  const handleAccept = () => {
    Alert.alert("Accept Request", "Do you want to accept this request?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: async () => {
          try {
            setLoading(true);
            const ref = doc(db, "requests", String(title));
            await updateDoc(ref, { status: "accepted" });
            router.push({ pathname: "/admin/add_employee", params: { currentRequestId: title } });
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to accept request.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Complete logic
  const handleComplete = async () => {
    try {
      setLoading(true);
      const ref = doc(db, "requests", String(title));
      await updateDoc(ref, { status: "complete" });
      router.replace("/admin/homescreen"); // removes request from booking list
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to mark request as complete.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="orange" />
      </SafeAreaView>
    );
  }

  if (!request) return null;
  const isCompleteEnabled = request?.costStatus === "completed";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "white" }}
        contentContainerStyle={styles.container}>
        {/* Header */}
        <Text style={styles.header}>Request Preview</Text>

        {/* Image */}
        <Image
          source={
            request.imageBase64
              ? { uri: request.imageBase64 }
              : require("@/assets/images/partial-react-logo.png")
          }
          style={styles.image}
          resizeMode="cover"
        />

        {/* Row: startTime + location */}
        <Text style={styles.subText}>
          {request.startTime} • {request.location}
        </Text>

        {/* Title */}
        <Text style={styles.title}>{request.title}</Text>

        {/* Event Detail Card */}
        <View style={styles.card}>
          {request.tokenPaid && (
            <View style={styles.row}>
              <MaterialIcons name="check-circle" size={20} color="green" style={styles.icon} />
              <Text style={styles.cardText}>Token Payment: Paid</Text>
            </View>
          )}

          <View style={styles.row}>
            <MaterialIcons name="restaurant" size={20} color="#333" style={styles.icon} />
            <Text style={styles.cardText}>Food: {request.food || "N/A"}</Text>
          </View>

          <View style={styles.row}>
            <MaterialIcons name="local-drink" size={20} color="#333" style={styles.icon} />
            <Text style={styles.cardText}>Drinks: {request.drinks || "N/A"}</Text>
          </View>

          <View style={styles.row}>
            <MaterialIcons name="groups" size={20} color="#333" style={styles.icon} />
            <Text style={styles.cardText}>Capacity: {request.capacity || "N/A"}</Text>
          </View>

          <View style={styles.row}>
            <MaterialIcons name="event" size={20} color="#333" style={styles.icon} />
            <Text style={styles.cardText}>
              {request.startDate} → {request.endDate}
            </Text>
          </View>

          <View style={styles.row}>
            <MaterialIcons name="schedule" size={20} color="#333" style={styles.icon} />
            <Text style={styles.cardText}>
              {request.startTime} → {request.endTime}
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={handleReject} style={styles.rejectButton}>
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleAccept} style={styles.acceptButton}>
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
        </View>

        {/* Complete Button */}
        <View style={{ marginTop: 12 }}>
          <TouchableOpacity
            onPress={handleComplete}
            style={[styles.completeButton, { backgroundColor: "#ef600cff" }]}
          >
            <Text style={styles.buttonText}>Mark Complete</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  subText: {
    fontSize: 14,
    color: "#555",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginVertical: 8,
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  cardText: {
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#f44336",
    padding: 14,
    borderRadius: 10,
    marginRight: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 10,
    marginLeft: 8,
  },
  completeButton: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
  },
  buttonText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
  },
});
