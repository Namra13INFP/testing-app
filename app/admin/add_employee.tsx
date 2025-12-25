import { auth, db } from "@/config/firebaseConfig"; // updated import
import { useLocalSearchParams } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Extract the name part from an email (before @)
const getNameFromEmail = (email: string): string => {
  const namePart = email.split("@")[0];
  return namePart || "";
};

// Send credentials to local API as raw JSON body { name, email, pass }
const sendCredentials = async ({
  name,
  email,
  pass,
}: {
  name: string;
  email: string;
  pass: string;
}): Promise<{ success: boolean; error?: string; raw?: string }> => {
  // Use localhost node server endpoint
  const url = "http://192.168.8.101:3000/api/sendEmail";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, pass }),
    });
    const text = await response.text();
    if (response.ok) return { success: true, raw: text };
    return { success: false, error: text || `HTTP ${response.status}`, raw: text };
  } catch (error: any) {
    console.error("❌ sendCredentials error:", error);
    return { success: false, error: error?.message ?? String(error) };
  }
};

// Random password generator
const generatePassword = () => Math.random().toString(36).slice(-8);

const ManageEmployeesScreen = () => {
  const { currentRequestId } = useLocalSearchParams<{ currentRequestId: string }>();

  type Employee = {
    id: string;
    email?: string;
    name?: string;
    password?: string;
    inviteStatus?: string;
    hasLoggedIn?: boolean;
    [key: string]: any;
  };

  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [inviteStatus, setInviteStatus] = useState("");
  const [inviting, setInviting] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // Fetch employees
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "employees"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setEmployees(data);
    });
    return () => unsubscribe();
  }, []);

  const handleInvite = async () => {
    if (!employeeEmail) {
      setInviteStatus("❌ Please enter an email");
      return;
    }

    const password = generatePassword();

    try {
      setInviting(true);
      const userCredential = await createUserWithEmailAndPassword(auth, employeeEmail, password);
      const uid = userCredential.user?.uid;

      // Write user metadata in `users/{uid}` so login can find the user role
      await setDoc(doc(db, "users", uid), {
        email: employeeEmail,
        role: "employee",
        createdAt: new Date(),
      });

      // Also create/update an `employees/{uid}` document (use uid as id) so admin list can reference the same user
      await setDoc(doc(db, "employees", uid), {
        uid,
        email: employeeEmail,
        password,
        inviteStatus: "pending",
        hasLoggedIn: false,
      });

      // Send credentials to local node server
      const credResult = await sendCredentials({ name: getNameFromEmail(employeeEmail), email: employeeEmail, pass: password });
      console.log("sendCredentials result:", credResult);

      if (credResult.success) {
        setInviteStatus(`✅ Invitation sent to ${employeeEmail}`);
      } else {
        setInviteStatus(`❌ Failed to send invite: ${credResult.error}`);
      }

      setEmployeeEmail("");
    } catch (error) {
      console.error("❌ Invite error:", error);
      setInviteStatus("❌ Failed to invite employee");
    } finally {
      setInviting(false);
    }
  };

  const handleAssign = async (employee: Employee) => {
    try {
      setAssigningId(employee.id);
      const requestRef = doc(db, "requests", currentRequestId);
      await updateDoc(requestRef, {
        assignedTo: employee.email,
        status: "assigned",
      });
      setInviteStatus(`✅ ${employee.email} assigned successfully!`);
    } catch (error) {
      console.error("❌ Assign error:", error);
      setInviteStatus("❌ Failed to assign employee");
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}>
    <View style={styles.container}>
      <Text style={styles.title}>Invite Employee</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Employee Email"
          placeholderTextColor="#999"
          value={employeeEmail}
          onChangeText={setEmployeeEmail}
        />
        <TouchableOpacity
          style={[styles.button, inviting && styles.buttonDisabled]}
          onPress={handleInvite}
          disabled={inviting}
        >
          {inviting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Invite</Text>
          )}
        </TouchableOpacity>
      </View>
      {inviteStatus ? <Text style={styles.status}>{inviteStatus}</Text> : null}

      <Text style={styles.title}>Employee List</Text>
      <FlatList
        data={employees}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={{ flex: 1 }}>{item.name || item.email}</Text>
            <TouchableOpacity
              style={[styles.button, assigningId === item.id && styles.buttonDisabled]}
              onPress={() => handleAssign(item)}
              disabled={assigningId === item.id}
            >
              {assigningId === item.id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Assign</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
    </SafeAreaView>
  );
};

export default ManageEmployeesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" ,padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginVertical: 8 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 6 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", padding: 8, marginRight: 8, borderRadius: 4 },
  status: { marginVertical: 4, fontWeight: "bold" },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});










// Local test helper (commented):
// fetch("http://localhost:3000/api/sendEmail", {
//   method: "POST",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify({ name: "User", email: "narrow886@tiffincrane.com", pass: "secret" }),
// });
