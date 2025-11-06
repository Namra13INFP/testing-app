import { db } from "@/config/firebaseConfig";
import { useGlobalSearchParams } from "expo-router";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
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

type Request = {
  title: string;
  location?: string;
  imageBase64?: string;
  imageUrl?: string;
  // original fields (kept intact)
  capacity?: string;
  drinks?: string;
  food?: string;
  // status fields
  capacityStatus?: string;
  drinksStatus?: string;
  foodStatus?: string;
  locationStatus?: string;
  // cost and its status
  cost?: number | string;
  costStatus?: string;
};

const statusFields = {
  capacity: "capacityStatus",
  drinks: "drinksStatus",
  food: "foodStatus",
  location: "locationStatus",
} as const;

const PaymentScreen: React.FC = () => {
  const { title } = useGlobalSearchParams<{ title: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [tokenPaid, setTokenPaid] = useState(false);

  useEffect(() => {
    if (!title) return;
    const docRef = doc(db, "requests", title);

    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          setRequest(null);
          setLoading(false);
          return;
        }
        const data = snap.data() as Request;
        setRequest(data);
        setTokenPaid(data.costStatus === "paid");
        setLoading(false);
      },
      (err) => {
        console.error("onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [title]);

  const handlePay = async () => {
    if (!request || !title) return;

    // simple validation: cost should be a number-like value
    const costVal = Number(request.cost);
    if (!costVal || isNaN(costVal)) {
      Alert.alert("Error", "Invalid cost; cannot compute token payment.");
      return;
    }

    try {
      setPaying(true);

      // simulate payment processing
      await new Promise((res) => setTimeout(res, 1000));

      const docRef = doc(db, "requests", title);
      await updateDoc(docRef, { costStatus: "paid" });

      // optimistic update (will be overwritten by snapshot if necessary)
      setTokenPaid(true);
      Alert.alert("Payment Success", "Token payment received.");
    } catch (err) {
      console.error("Payment error:", err);
      Alert.alert("Payment Failed", "Unable to process payment.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Request not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Helper to read a status field safely
  const getStatus = (fieldKey: keyof typeof statusFields) => {
    const key = statusFields[fieldKey];
    // @ts-ignore — we typed Request with these fields already
    return (request as any)[key] === "completed" ? "completed" : "pending";
  };

  const renderStatusRow = (label: string, key: keyof typeof statusFields) => (
    <View style={styles.statusRow} key={key}>
      <Text style={styles.statusLabel}>{label}:</Text>
      <Text style={[styles.statusValue, getStatus(key) === "completed" ? styles.done : styles.pending]}>
        {getStatus(key)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Image */}
        {(request.imageBase64 || request.imageUrl) ? (
          <Image
            source={{
              uri: (() => {
                const base64 = request.imageBase64;
                const url = request.imageUrl;
                if (base64 && typeof base64 === "string") {
                  return base64.startsWith("data:") ? base64 : `data:image/jpeg;base64,${base64}`;
                }
                if (url && typeof url === "string") return url;
                return "";
              })(),
            }}
            style={styles.image}
            blurRadius={2}
          />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}

        {/* Location */}
        <View style={styles.infoRow}>
          <Text style={styles.locationText}>{request.location || "No location"}</Text>
        </View>

        {/* Details card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Request Progress</Text>

          {renderStatusRow("Food", "food")}
          {renderStatusRow("Drinks", "drinks")}
          {renderStatusRow("Capacity", "capacity")}
          {renderStatusRow("Location", "location")}
        </View>

        {/* Cost + Pay button */}
        <View style={styles.paymentRow}>
          <View style={styles.costBox}>
            <Text style={styles.costLabel}>Cost</Text>
            <Text style={styles.costValue}>
              {request.cost !== undefined ? String(request.cost) : "0"}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.payButton,
              (paying || tokenPaid) && styles.payButtonDisabled,
            ]}
            onPress={handlePay}
            disabled={paying || tokenPaid}
          >
            <Text style={styles.payButtonText}>
              {paying ? "Processing..." : tokenPaid ? "Paid" : "Pay"}
            </Text>
          </TouchableOpacity>
        </View>

        {tokenPaid && (
          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>Payment Completed</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width: "100%", height: 220, borderRadius: 8, marginBottom: 12 },
  imagePlaceholder: { width: "100%", height: 220, borderRadius: 8, backgroundColor: "#ddd", marginBottom: 12 },
  infoRow: { marginBottom: 12 },
  locationText: { fontSize: 16, color: "#333" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, elevation: 2, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  statusRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomColor: "#eee", borderBottomWidth: 1 },
  statusLabel: { fontSize: 16, color: "#444" },
  statusValue: { fontSize: 16, fontWeight: "600" },
  done: { color: "green" },
  pending: { color: "#aa0" },
  paymentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  costBox: { backgroundColor: "#fff", padding: 12, borderRadius: 8, minWidth: 120, alignItems: "center", elevation: 1 },
  costLabel: { fontSize: 12, color: "#666" },
  costValue: { fontSize: 18, fontWeight: "700" },
  payButton: { backgroundColor: "#1e90ff", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, marginLeft: 12 },
  payButtonDisabled: { backgroundColor: "#9dbfe8" },
  payButtonText: { color: "#fff", fontWeight: "700" },
  paidBadge: { marginTop: 12, backgroundColor: "#e6ffe6", padding: 10, borderRadius: 8, alignItems: "center" },
  paidBadgeText: { color: "green", fontWeight: "700" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#666" },
});

export default PaymentScreen;
