import { auth, db } from "@/config/firebaseConfig"; // updated import
import { useLocalSearchParams } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Button, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Email sending function — robust to non-JSON responses (e.g. HTML error pages)
const sendEmail = async ({
  to,
  subject,
  message,
}: {
  to: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; error?: string; raw?: string }> => {
  const url = "https://email-d6c2vcptr-testing-examples-projects.vercel.app/api/send";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, message }),
    });

    const contentType = response.headers.get("content-type") || "";

    // If JSON, parse it. Otherwise, read text and attempt to parse — if parsing fails,
    // return the raw text for debugging instead of throwing.
    if (contentType.includes("application/json")) {
      const json = await response.json();
      console.log("✅ Email result (json):", json);
      if (response.ok) return { success: true };
      return { success: false, error: json?.error ?? JSON.stringify(json), raw: JSON.stringify(json) };
    }

    const text = await response.text();
    // Some hosts return HTML for errors (starts with '<'), which causes JSON.parse to fail.
    try {
      const parsed = JSON.parse(text);
      console.log("✅ Email result (parsed text->json):", parsed);
      if (response.ok) return { success: true };
      return { success: false, error: parsed?.error ?? JSON.stringify(parsed), raw: text };
    } catch (parseErr) {
      // Not JSON — surface the text for debugging. If response.ok consider it success with raw body.
      if (response.ok) {
        console.warn(`sendEmail: expected JSON but got text/HTML (first 300 chars): ${text.slice(0, 300)}`);
        return { success: true, raw: text };
      }
      return { success: false, error: text || `HTTP ${response.status}`, raw: text };
    }
  } catch (error: any) {
    console.error("❌ sendEmail error:", error);
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
      const userCredential = await createUserWithEmailAndPassword(auth, employeeEmail, password);
      const uid = userCredential.user?.uid;

      // Add employee doc to Firestore, include the newly created uid
      await addDoc(collection(db, "employees"), {
        uid,
        email: employeeEmail,
        password,
        inviteStatus: "pending",
        hasLoggedIn: false,
      });

      // Send email
      const emailResult = await sendEmail({
        to: employeeEmail,
        subject: "You're invited as an employee",
        message: `Hello,\n\nYour account has been created.\nEmail: ${employeeEmail}\nPassword: ${password}\n\nPlease login and change your password.`,
      });
      console.log("sendEmail result:", emailResult);

      if (emailResult.success) {
        setInviteStatus(`✅ Invitation sent to ${employeeEmail}`);
      } else {
        setInviteStatus(`❌ Failed to send email: ${emailResult.error}`);
      }

      setEmployeeEmail("");
    } catch (error) {
      console.error("❌ Invite error:", error);
      setInviteStatus("❌ Failed to invite employee");
    }
  };

  const handleAssign = async (employee: Employee) => {
    try {
      const requestRef = doc(db, "requests", currentRequestId);
      await updateDoc(requestRef, {
        assignedTo: employee.email,
        status: "assigned",
      });
      setInviteStatus(`✅ ${employee.email} assigned successfully!`);
    } catch (error) {
      console.error("❌ Assign error:", error);
      setInviteStatus("❌ Failed to assign employee");
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
          value={employeeEmail}
          onChangeText={setEmployeeEmail}
        />
        <Button title="Invite" onPress={handleInvite} />
      </View>
      {inviteStatus ? <Text style={styles.status}>{inviteStatus}</Text> : null}

      <Text style={styles.title}>Employee List</Text>
      <FlatList
        data={employees}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={{ flex: 1 }}>{item.name || item.email}</Text>
            <Button title="Assign" onPress={() => handleAssign(item)} />
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
});










// fetch("https://email-cnt18suxv-testing-examples-projects.vercel.app/api/send", {
//   method: "POST",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify({
//     to: "narrow886@tiffincrane.com",
//     subject: "Test Email",
//     message: "Hello from production deploy!"
//   }),
// });
