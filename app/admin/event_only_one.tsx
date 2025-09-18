import { db } from "@/config/firebaseConfig";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
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

export default function EventOnlyOne() {
    const router = useRouter();
    const { title: eventTitle } = useLocalSearchParams<{ title: string }>();

    // Loading & error
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Form states
    const [title, setTitle] = useState("");
    const [location, setLocation] = useState("");
    const [type, setType] = useState("");
    const [food, setFood] = useState("");
    const [drinks, setDrinks] = useState("");
    const [capacity, setCapacity] = useState("");
    const [cost, setCost] = useState("");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);
    const [image, setImage] = useState<string | null>(null);

    const [showPicker, setShowPicker] = useState<{ mode: any; field: string } | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Dropdowns
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

    // Dropdown sync
    useEffect(() => { if (typeOpen) { setFoodOpen(false); setDrinksOpen(false); } }, [typeOpen]);
    useEffect(() => { if (foodOpen) { setTypeOpen(false); setDrinksOpen(false); } }, [foodOpen]);
    useEffect(() => { if (drinksOpen) { setTypeOpen(false); setFoodOpen(false); } }, [drinksOpen]);

    useEffect(() => { setType(typeValue ?? ""); }, [typeValue]);
    useEffect(() => { setFood(foodValue ?? ""); }, [foodValue]);
    useEffect(() => { setDrinks(drinksValue ?? ""); }, [drinksValue]);

    // Fetch event from Firestore
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                if (!eventTitle) {
                    setError("No event title provided.");
                    setLoading(false);
                    return;
                }
                const docRef = doc(db, "events", eventTitle);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setTitle(data.title);
                    setLocation(data.location);
                    setTypeValue(data.type);
                    setFoodValue(data.food);
                    setDrinksValue(data.drinks);
                    setCapacity(data.capacity.toString());
                    setCost(data.cost.toString());
                    setStartDate(data.startDate ? new Date(data.startDate) : null);
                    setEndDate(data.endDate ? new Date(data.endDate) : null);
                    setStartTime(data.startTime ? new Date(data.startTime) : null);
                    setEndTime(data.endTime ? new Date(data.endTime) : null);
                    setImage(data.imageBase64 || null);
                } else {
                    setError("Event not found.");
                }
            } catch (err) {
                console.error(err);
                setError("Failed to fetch event.");
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventTitle]);

    // Image picker
    const pickImage = async (fromCamera: boolean) => {
        let result;
        if (fromCamera) result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
        else result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
        if (!result.canceled) {
            const uri = result.assets[0].uri;
            const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
            setImage(`data:image/jpeg;base64,${base64Data}`);
        }
        setModalVisible(false);
    };

    // Save edits
    const handleSave = async () => {
        if (
            !title || !location || !type || !food || !drinks || !capacity || !cost ||
            !startDate || !endDate || !startTime || !endTime
        ) {
            Alert.alert("Error", "All fields are required.");
            return;
        }
        if (startDate > endDate) {
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
            Alert.alert("Success", "Event updated successfully.", [
                { text: "OK", onPress: () => router.push("/admin/homescreen") },
            ]);
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to update event.");
        }
    };

    // Delete event
    const handleDelete = () => {
        Alert.alert(
            "Delete Event",
            "Are you sure you want to delete this event?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "OK",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, "events", title));
                            Alert.alert("Deleted", "Event deleted successfully.", [
                                { text: "OK", onPress: () => router.push("/admin/homescreen") },
                            ]);
                        } catch (err) {
                            console.error(err);
                            Alert.alert("Error", "Failed to delete event.");
                        }
                    },
                    style: "destructive",
                },
            ]
        );
    };

    if (loading) return (
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="orange" />
        </SafeAreaView>
    );

    if (error) return (
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
            <Text style={{ color: "red", fontSize: 18, textAlign: "center" }}>{error}</Text>
            <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                <Text style={{ color: "orange", fontSize: 16 }}>Go Back</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}>
            <ScrollView style={{ flex: 1, backgroundColor: "white" }} contentContainerStyle={styles.container}>
                <Text style={styles.header}>Edit Event</Text>

                {/* Image Picker */}
                <View style={styles.imageBox}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.imagePreview} />
                    ) : (
                        <Text style={styles.placeholderText}>No Image Selected</Text>
                    )}
                    <TouchableOpacity style={styles.imageButton} onPress={() => setModalVisible(true)}>
                        <Text style={{ color: "white" }}>+</Text>
                    </TouchableOpacity>
                </View>

                {/* Modal for image */}
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
                <TextInput style={styles.input} placeholder="Event Title" value={title} editable={false} />
                <TextInput style={styles.input} placeholder="Location" value={location} onChangeText={setLocation} />

                {/* Type Dropdown */}
                <View style={{ zIndex: 3000 }}>
                    <DropDownPicker open={typeOpen} value={typeValue} items={typeItems} setOpen={setTypeOpen}
                        setValue={setTypeValue} setItems={setTypeItems} placeholder="Select Type" listMode="SCROLLVIEW"
                        style={styles.input} dropDownContainerStyle={{ borderColor: "#ccc" }} />
                </View>

                {/* Food Dropdown */}
                <View style={{ zIndex: 2000 }}>
                    <DropDownPicker open={foodOpen} value={foodValue} items={foodItems} setOpen={setFoodOpen}
                        setValue={setFoodValue} setItems={setFoodItems} placeholder="Select Food" listMode="SCROLLVIEW"
                        style={styles.input} dropDownContainerStyle={{ borderColor: "#ccc" }} />
                </View>

                {/* Drinks Dropdown */}
                <View style={{ zIndex: 1000 }}>
                    <DropDownPicker open={drinksOpen} value={drinksValue} items={drinksItems} setOpen={setDrinksOpen}
                        setValue={setDrinksValue} setItems={setDrinksItems} placeholder="Select Drinks" listMode="SCROLLVIEW"
                        style={styles.input} dropDownContainerStyle={{ borderColor: "#ccc" }} />
                </View>

                <TextInput style={styles.input} placeholder="Capacity" keyboardType="numeric"
                    value={capacity} onChangeText={setCapacity} maxLength={5} />
                <TextInput style={styles.input} placeholder="Cost" keyboardType="numeric"
                    value={cost} onChangeText={setCost} maxLength={7} />

                {/* Date Pickers */}
                <View style={styles.row}>
                    <TouchableOpacity style={styles.halfInput} onPress={() => setShowPicker({ mode: "date", field: "startDate" })}>
                        <TextInput style={styles.input} placeholder="Start Date" editable={false}
                            value={startDate ? startDate.toDateString() : ""} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.halfInput} onPress={() => setShowPicker({ mode: "date", field: "endDate" })}>
                        <TextInput style={styles.input} placeholder="End Date" editable={false}
                            value={endDate ? endDate.toDateString() : ""} />
                    </TouchableOpacity>
                </View>

                {/* Time Pickers */}
                <View style={styles.row}>
                    <TouchableOpacity style={styles.halfInput} onPress={() => setShowPicker({ mode: "time", field: "startTime" })}>
                        <TextInput style={styles.input} placeholder="Start Time" editable={false}
                            value={startTime ? startTime.toLocaleTimeString() : ""} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.halfInput} onPress={() => setShowPicker({ mode: "time", field: "endTime" })}>
                        <TextInput style={styles.input} placeholder="End Time" editable={false}
                            value={endTime ? endTime.toLocaleTimeString() : ""} />
                    </TouchableOpacity>
                </View>

                {showPicker && (
                    <DateTimePicker
                        value={
                            showPicker.field === "startDate" ? (startDate || new Date()) :
                                showPicker.field === "endDate" ? (endDate || new Date()) :
                                    showPicker.field === "startTime" ? (startTime || new Date()) :
                                        showPicker.field === "endTime" ? (endTime || new Date()) :
                                            new Date()
                        }
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

                {/* Save & Delete Buttons */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
                    <TouchableOpacity style={[styles.saveButton, { flex: 1, marginRight: 8 }]} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.deleteButton, { flex: 1, marginLeft: 8 }]} onPress={handleDelete}>
                        <Text style={styles.saveButtonText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: "white" },
    header: { fontSize: 22, fontWeight: "bold", color: "orange", marginBottom: 20, alignSelf: "center" },
    input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: "#f9f9f9" },
    imageBox: { width: "100%", height: 160, borderRadius: 10, borderWidth: 1, borderColor: "#ccc", marginBottom: 16, justifyContent: "center", alignItems: "center", position: "relative" },
    imagePreview: { width: "100%", height: "100%", borderRadius: 10 },
    placeholderText: { color: "#999" },
    imageButton: { position: "absolute", bottom: 10, right: 10, backgroundColor: "orange", borderRadius: 20, padding: 6 },
    saveButton: { backgroundColor: "orange", padding: 12, borderRadius: 8, alignItems: "center" },
    deleteButton: { backgroundColor: "red", padding: 12, borderRadius: 8, alignItems: "center" },
    saveButtonText: { color: "white", fontWeight: "bold" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    modalBox: { backgroundColor: "white", padding: 20, borderRadius: 10, width: 250 },
    modalOption: { padding: 10, alignItems: "center" },
    row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
    halfInput: { flex: 1, marginHorizontal: 4 },
});
