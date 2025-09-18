import { db } from "@/config/firebaseConfig";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BookingRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "requests"));
        const requestsData: any[] = [];
        querySnapshot.forEach((doc) => {
          requestsData.push(doc.data());
        });
        setRequests(requestsData);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };
    fetchRequests();
  }, []);

  const ListHeader = () => <Text style={styles.header}>Booking Requests</Text>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}>
     <ScrollView style={styles.container}>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.title}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 24 }}
        // Let the outer ScrollView handle scrolling
        scrollEnabled={false}
        // Helpful for Android nested scrolling
        nestedScrollEnabled={true}
        // Disable aggressive clipping to avoid virtualization issues inside ScrollView
        removeClippedSubviews={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.requestCard}
            onPress={() => router.push(`/admin/request_only_one?title=${item.title}`)}
          >
            {(item.imageBase64 || item.imageUrl) ? (
              <Image
                source={{
                  uri: (() => {
                    const base64 = item.imageBase64;
                    const url = item.imageUrl;
                    if (base64 && typeof base64 === 'string') {
                      return base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
                    }
                    if (url && typeof url === 'string') return url;
                    return '';
                  })(),
                }}
                style={styles.requestImage}
                blurRadius={2}
              />
            ) : (
              <View style={styles.requestImagePlaceholder} />
            )}
            <View style={styles.overlay}>
              <Text style={styles.requestTitle}>{item.title}</Text>
              <Text style={styles.requestSubtitle}>{item.location}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
     </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "orange",
    marginBottom: 40,
  },
  requestCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
  },
  requestImage: {
    width: "100%",
    height: 180,
    opacity: 0.9,
  },
  requestImagePlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: "#eee",
  },
  overlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
  },
  requestTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    textShadowColor: "#fff",       // pure black shadow
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,

  },
  requestSubtitle: {
    fontSize: 17,
    fontWeight: "500",
    color: "	#A9A9A9",
    marginTop: 2,
    textShadowColor: "#fff",       // pure black shadow
    textShadowOffset: { width: 2, height: 1 },
    textShadowRadius: 2,

  },
});
