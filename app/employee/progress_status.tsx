import { db } from '@/config/firebaseConfig';
import { useGlobalSearchParams } from 'expo-router';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type Request = {
  title: string;
  location: string;
  imageBase64?: string;
  imageUrl?: string;
  capacity?: string;
  drinks?: string;
  food?: string;
  capacityStatus?: string;
  drinksStatus?: string;
  foodStatus?: string;
  locationStatus?: string;
};

const ProgressStatusScreen = () => {
  const { title } = useGlobalSearchParams<{ title: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkboxes, setCheckboxes] = useState<{ [key: string]: boolean }>({
    capacity: false,
    drinks: false,
    food: false,
    location: false,
  });

  const statusFields = {
    capacity: 'capacityStatus',
    drinks: 'drinksStatus',
    food: 'foodStatus',
    location: 'locationStatus',
  };

  useEffect(() => {
    if (!title) return;

    const docRef = doc(db, 'requests', title);

    // Real-time listener
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data() as Request;
      setRequest(data);

      // Update checkboxes based on Firestore status fields
      setCheckboxes({
        capacity: data['capacityStatus'] === 'completed',
        drinks: data['drinksStatus'] === 'completed',
        food: data['foodStatus'] === 'completed',
        location: data['locationStatus'] === 'completed',
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, [title]);

  const toggleCheckbox = async (field: 'capacity' | 'drinks' | 'food' | 'location') => {
    if (!request) return;

    const newValue = !checkboxes[field];
    setCheckboxes((prev) => ({ ...prev, [field]: newValue }));

    try {
      const docRef = doc(db, 'requests', title);
      await updateDoc(docRef, {
        [statusFields[field]]: newValue ? 'completed' : '',
      });
    } catch (error) {
      console.error('Error updating checkbox:', error);
    }
  };

  if (loading || !request) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}>
      <ScrollView style={styles.container}
      contentContainerStyle={{ padding: 16 }}>
        {/* Request Image */}
        {(request.imageBase64 || request.imageUrl) ? (
          <Image
            source={{
              uri: (() => {
                const base64 = request.imageBase64;
                const url = request.imageUrl;
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

        {/* Time & Location */}
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>{request.location}</Text>
        </View>

        {/* Checkboxes */}
        <View style={styles.card}>
          {(['capacity', 'drinks', 'food', 'location'] as const).map((field) => (
              <View key={field} style={styles.checkboxRow}>
                <Checkbox
                  status={checkboxes[field] ? 'checked' : 'unchecked'}
                  onPress={() => toggleCheckbox(field)}
                />
              <Text style={styles.checkboxLabel}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  requestImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  requestImagePlaceholder: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#ccc', marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  infoText: { fontSize: 16, color: '#555' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkboxLabel: { marginLeft: 8, fontSize: 16 },
});

export default ProgressStatusScreen;
