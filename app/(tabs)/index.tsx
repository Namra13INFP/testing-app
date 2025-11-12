// app/index.tsx
import { auth, db } from "@/config/firebaseConfig"; // adjust path
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const role = snap.data().role;

          if (role === "admin") {
            router.replace("/admin/homescreen"); 
          } else if (role === "employee") {
            router.replace("/employee/homescreen"); 
          } else {
            router.replace("/customer/homescreen"); 
          }
        } else {
          router.replace("/customer/homescreen"); 
        }
      } else {
        router.replace("./login"); 
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return null; // nothing to show, redirect handled above
}
