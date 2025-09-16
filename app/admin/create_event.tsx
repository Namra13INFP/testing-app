import { db } from "@/config/firebaseConfig";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateEvent() {
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [food, setFood] = useState("");
  const [drinks, setDrinks] = useState("");
  const [capacity, setCapacity] = useState("");
  const [cost, setCost] = useState("");
  // Date & Time states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  const [showPicker, setShowPicker] = useState<{ mode: any; field: string } | null>(null);


  // Image states
  const [image, setImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Dropdown states (DropDownPicker)
  const [typeOpen, setTypeOpen] = useState(false);
  const [typeValue, setTypeValue] = useState<string | null>(null);
  const [typeItems, setTypeItems] = useState([
    { label: "Wedding", value: "Wedding" },
    { label: "Birthday Party", value: "Birthday" },
    { label: "Corporate Event / Conference", value: "Corporate" },
    { label: "Concert / Live Show", value: "Concert" },
    { label: "Festival / Fair", value: "Festival" },
  ]);

  const [foodOpen, setFoodOpen] = useState(false);
  const [foodValue, setFoodValue] = useState<string | null>(null);
  const [foodItems, setFoodItems] = useState([
    { label: "Vegan", value: "Vegan" },
    { label: "Non-Vegan", value: "Non-Vegan" },
  ]);

  const [drinksOpen, setDrinksOpen] = useState(false);
  const [drinksValue, setDrinksValue] = useState<string | null>(null);
  const [drinksItems, setDrinksItems] = useState([
    { label: "Water", value: "Water" },
    { label: "Soft Drinks", value: "Soft Drinks" },
    { label: "Fresh Juice", value: "Fresh Juice" },
  ]);

  // Ensure only one dropdown open at a time
  useEffect(() => {
    if (typeOpen) {
      setFoodOpen(false);
      setDrinksOpen(false);
    }
  }, [typeOpen]);

  useEffect(() => {
    if (foodOpen) {
      setTypeOpen(false);
      setDrinksOpen(false);
    }
  }, [foodOpen]);

  useEffect(() => {
    if (drinksOpen) {
      setTypeOpen(false);
      setFoodOpen(false);
    }
  }, [drinksOpen]);

  // Sync dropdown internal values to your Firestore states
  useEffect(() => {
    setType(typeValue ?? "");
  }, [typeValue]);

  useEffect(() => {
    setFood(foodValue ?? "");
  }, [foodValue]);

  useEffect(() => {
    setDrinks(drinksValue ?? "");
  }, [drinksValue]);

  // Handle image pick
  const pickImage = async (fromCamera: boolean) => {
    let result;
    if (fromCamera) {
      result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
    }
    if (!result.canceled) {
      const uri = result.assets[0].uri;

      // convert to base64
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      setImage(`data:image/jpeg;base64,${base64Data}`); // store as full base64 URI
    }
    setModalVisible(false);
  };

  // Save Event
  const handleSave = async () => {
    if (
      !title ||
      !location ||
      !type ||
      !food ||
      !drinks ||
      !capacity ||
      !cost ||
      // !image ||
      !startDate ||
      !endDate ||
      !startTime ||
      !endTime
    ) {
      Alert.alert("Error", "All fields are required.");
      return;
    }


    if (startDate > endDate) { // 🔥 safe: already ensured not null
      Alert.alert("Error", "Start Date must be earlier than End Date.");
      return;
    }
    if (startTime > endTime) {
      Alert.alert("Error", "Start Time must be earlier than End Time.");
      return;
    }

    try {
      await setDoc(doc(db, "events", title), {
        title,
        location,
        type,
        food,
        drinks,
        capacity: Number(capacity),
        cost: Number(cost),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        imageBase64: image,
      });
      Alert.alert(
        "Success",
        "Event saved successfully.",
        [
          {
            text: "OK",
            onPress: () => router.push("/admin/homescreen"),
          },
        ]
      );

    } catch (error) {
      Alert.alert("Error", "Failed to save event.");
      console.error(error);
    }
  };

  return (
     <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}>
      <ScrollView
      style={{ flex: 1, backgroundColor: "white" }}
      contentContainerStyle={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Create Event</Text>

      {/* Image Picker */}
      <View style={styles.imageBox}>
        {image ? (
          <Image source={{ uri: image }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.placeholderText}>No Image Selected</Text>
        )}
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: "white" }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for image options */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity onPress={() => pickImage(false)} style={styles.modalOption}>
              <Text>From Photos</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => pickImage(true)} style={styles.modalOption}>
              <Text>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalOption}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Form Fields */}
      <TextInput
        style={styles.input}
        placeholder="Event Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
      />


      {/* Type Dropdown */}
      <View style={{ zIndex: 3000 }}>
        <DropDownPicker
          open={typeOpen}
          value={typeValue}
          items={typeItems}
          setOpen={setTypeOpen}
          setValue={setTypeValue}
          setItems={setTypeItems}
          onOpen={() => {
            setFoodOpen(false);
            setDrinksOpen(false);
          }}
          onChangeValue={(val) => setType(val ?? "")}
          placeholder="Select Type"
          listMode="SCROLLVIEW"
          style={styles.input}
          dropDownContainerStyle={{ borderColor: "#ccc" }}
        />
      </View>

      {/* Food Dropdown */}
      <View style={{ zIndex: 2000 }}>
        <DropDownPicker
          open={foodOpen}
          value={foodValue}
          items={foodItems}
          setOpen={setFoodOpen}
          setValue={setFoodValue}
          setItems={setFoodItems}
          onOpen={() => {
            setTypeOpen(false);
            setDrinksOpen(false);
          }}
          onChangeValue={(val) => setFood(val ?? "")}
          placeholder="Select Food"
          listMode="SCROLLVIEW"
          style={styles.input}
          dropDownContainerStyle={{ borderColor: "#ccc" }}
        />
      </View>

      {/* Drinks Dropdown */}
      <View style={{ zIndex: 1000 }}>
        <DropDownPicker
          open={drinksOpen}
          value={drinksValue}
          items={drinksItems}
          setOpen={setDrinksOpen}
          setValue={setDrinksValue}
          setItems={setDrinksItems}
          onOpen={() => {
            setTypeOpen(false);
            setFoodOpen(false);
          }}
          onChangeValue={(val) => setDrinks(val ?? "")}
          placeholder="Select Drinks"
          listMode="SCROLLVIEW"
          style={styles.input}
          dropDownContainerStyle={{ borderColor: "#ccc" }}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Capacity"
        keyboardType="numeric"
        value={capacity}
        onChangeText={setCapacity}
        maxLength={5}
      />
      <TextInput
        style={styles.input}
        placeholder="Cost"
        keyboardType="numeric"
        value={cost}
        onChangeText={setCost}
        maxLength={7}
      />
      {/* Date Pickers in a row */}

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.halfInput}
          onPress={() => setShowPicker({ mode: "date", field: "startDate" })}
        >
          <TextInput
            style={styles.input}
            placeholder="Start Date"
            editable={false}
            value={startDate ? startDate.toDateString() : ""} // 🔥 show placeholder if null
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.halfInput}
          onPress={() => setShowPicker({ mode: "date", field: "endDate" })}
        >
          <TextInput
            style={styles.input}
            placeholder="End Date"
            editable={false}
            value={endDate ? endDate.toDateString() : ""}
          />
        </TouchableOpacity>
      </View>

      {/* Time Pickers in a row */}

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.halfInput}
          onPress={() => setShowPicker({ mode: "time", field: "startTime" })}
        >
          <TextInput
            style={styles.input}
            placeholder="Start Time"
            editable={false}
            value={startTime ? startTime.toLocaleTimeString() : ""}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.halfInput}
          onPress={() => setShowPicker({ mode: "time", field: "endTime" })}
        >
          <TextInput
            style={styles.input}
            placeholder="End Time"
            editable={false}
            value={endTime ? endTime.toLocaleTimeString() : ""}
          />
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={new Date()} // default picker value
          mode={showPicker.mode}
          is24Hour={false}
          onChange={(event, selectedDate) => {
            setShowPicker(null);
            if (selectedDate) {
              if (showPicker.field === "startDate") setStartDate(selectedDate);
              if (showPicker.field === "endDate") setEndDate(selectedDate);
              if (showPicker.field === "startTime") setStartTime(selectedDate);
              if (showPicker.field === "endTime") setEndTime(selectedDate);
            }
          }}
        />
      )}

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Event</Text>
      </TouchableOpacity>
     </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "white" },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "orange",
    marginBottom: 20,
    alignSelf: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  imageBox: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  imagePreview: { width: "100%", height: "100%", borderRadius: 10 },
  placeholderText: { color: "#999" },
  imageButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "orange",
    borderRadius: 20,
    padding: 6,
  },
  saveButton: {
    backgroundColor: "orange",
    padding: 12,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 16,
  },
  saveButtonText: { color: "white", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: 250,
  },
  modalOption: { padding: 10, alignItems: "center" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,

  },

});
