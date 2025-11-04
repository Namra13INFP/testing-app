import { db } from '@/config/firebaseConfig';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Request = {
  title: string;
  location: string;
  assignedTo: string;
  imageBase64?: string;
  imageUrl?: string;
};

const EmployeeHomeScreen = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRequests = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, 'requests'),
        where('assignedTo', '==', user.email)
      );

      const querySnapshot = await getDocs(q);
      const fetchedRequests: Request[] = querySnapshot.docs.map((doc) => doc.data() as Request);
      setRequests(fetchedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const ListHeader = () => (
    <Text style={styles.header}>Your Assigned Requests</Text>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}>
      <ScrollView style={styles.container}>
        <FlatList
          data={requests}
          keyExtractor={(item) => item.title}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingBottom: 24 }}
          scrollEnabled={false}
          nestedScrollEnabled={true}
          removeClippedSubviews={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.requestCard}
              onPress={() => router.push(`/employee/progress_status?title=${item.title}`)}
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
  },
  requestCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
  },
  requestImage: {
    width: '100%',
    height: 180,
  },
  requestImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#ccc',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 12,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  requestSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 2,
  },
});

export default EmployeeHomeScreen;
