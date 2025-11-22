import { db } from "@/config/firebaseConfig";
import { getAuth } from "firebase/auth";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
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

type BookingRequest = {
  id: string;
  imageBase64?: string;
  location?: string;
  foodStatus?: string;
  drinksStatus?: string;
  capacityStatus?: string;
  locationStatus?: string;
  cost?: number | string;
  costStatus?: string;
  [key: string]: any;
};

export default function PaymentScreen() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [payingIds, setPayingIds] = useState<string[]>([]); // For multiple pay buttons
  const [userId, setUserId] = useState<string | null>(null);

  const auth = getAuth();

  useEffect(() => {
    // Listen to auth state changes instead of just reading currentUser
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("✅ Auth state changed. Current user UID:", user.uid);
        setUserId(user.uid);
      } else {
        console.log("❌ No user logged in");
        setUserId(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!userId) {
      console.log("⏳ Waiting for userId...");
      return;
    }

    const fetchRequests = async () => {
      try {
        console.log("🔍 Querying requests where userId ==", userId);
        const q = query(collection(db, "requests"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        console.log("📊 Found", snapshot.docs.length, "requests");
        
        if (snapshot.docs.length === 0) {
          console.warn("⚠️ No requests found for userId:", userId);
        }
        
        const data: BookingRequest[] = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setRequests(data);
      } catch (err) {
        console.error("❌ Fetch error:", err);
        Alert.alert("Error", "Unable to fetch booking requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [userId]);

  const handlePayment = async (requestId: string, cost?: number | string): Promise<void> => {
    const parsed = Number(cost);
    if (!cost || Number.isNaN(parsed) || parsed <= 0) {
      Alert.alert("Error", "Invalid cost; cannot compute payment.");
      return;
    }

    setPayingIds((prev) => [...prev, requestId]);

    try {
      // Simulate payment delay
      await new Promise((res) => setTimeout(res, 1000));

      // Update Firestore costStatus
      await updateDoc(doc(db, "requests", requestId), { costStatus: "paid" });

      Alert.alert("Payment Success", "Token payment received.");
      // Update local state to reflect payment
      setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, costStatus: "paid" } : r)));
    } catch (err) {
      console.error(err);
      Alert.alert("Payment Failed", "Unable to process payment.");
    } finally {
      setPayingIds((prev) => prev.filter((id) => id !== requestId));
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}> 
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Payment Screen</Text>
      
      {requests.length === 0 && (
        <Text style={{ textAlign: "center", marginTop: 20 }}>No booking requests found.</Text>
      )}

      {requests.length > 0 &&
        requests.map((request) => {
          const allCompleted =
            request.foodStatus === "completed" &&
            request.drinksStatus === "completed" &&
            request.capacityStatus === "completed" &&
            request.locationStatus === "completed";

          return (            
            <View key={request.id} style={styles.card}>
              {/* Image */}
              {request.imageBase64 ? (
                <Image
                  source={{ uri: request.imageBase64 }}
                  style={styles.image}
                />
              ) : null}
              {/* Location */}
              {request.location ? <Text style={styles.location}>{request.location}</Text> : null}

              {/* Details Card */}
              <View style={styles.detailsCard}>
                <Text>Food Status: {request.foodStatus}</Text>
                <Text>Drinks Status: {request.drinksStatus}</Text>
                <Text>Capacity Status: {request.capacityStatus}</Text>
                <Text>Location Status: {request.locationStatus}</Text>
                <Text style={{ marginTop: 5 }}>
                  Overall Status: {allCompleted ? "Completed" : "Pending"}
                </Text>
              </View>

              {/* Cost & Pay Button */}
              <View style={styles.paymentRow}>
                <Text style={styles.costText}>Cost: {request.cost || "N/A"}</Text>
                <TouchableOpacity
                  style={[
                    styles.bookButton,
                    { width: 110, justifyContent: "center" },
                    request.costStatus === "paid" && { backgroundColor: "#4CAF50" },
                  ]}
                  onPress={() => handlePayment(request.id, request.cost)}
                  disabled={request.costStatus === "paid" || payingIds.includes(request.id)}
                >
                  <Text style={styles.bookButtonText}>
                    {payingIds.includes(request.id)
                      ? "Processing..."
                      : request.costStatus === "paid"
                      ? "Paid"
                      : "Pay"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" ,padding: 10 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, color: "#333" },
  card: {
    borderWidth: 1,
    borderColor: "orange",
    borderRadius: 10,
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#fff",
  },
  image: { width: "100%", height: 200, borderRadius: 10 },
  location: { marginTop: 5, fontStyle: "italic" },
  detailsCard: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  costText: { fontWeight: "bold", fontSize: 16 },
  bookButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  bookButtonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
});
