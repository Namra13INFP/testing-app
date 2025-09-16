// app/register.tsx
import { auth, db } from "@/config/firebaseConfig";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const validateAndRegister = async () => {
    // basic validations
    if (!username || !email || !password) {
      setError("All fields are required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setError("");
      // Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save extra info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        username,
        email,
        createdAt: new Date(),
      });

      router.push("./login"); // navigate to login after registration
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Register</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          placeholder="Username"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Password"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={async () => {
         await validateAndRegister(); 
       }}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("./login")}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flex: 0.1,
    margin: 10,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: "orange",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  form: { flex: 1, padding: 20, justifyContent: "center" },
  input: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 25,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#ff6f00",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { marginTop: 15, textAlign: "center", color: "#ff6f00" },
  error: { color: "red", textAlign: "center", marginBottom: 10 },
});

