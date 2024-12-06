import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import Icon from "react-native-vector-icons/MaterialIcons";

const RecordingScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState();
  const [recordingsList, setRecordingsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [recordingName, setRecordingName] = useState("");

  const filteredRecordings = recordingsList.filter((item) =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const requestPermission = async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === "granted");
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "You need to enable microphone access to record audio."
        );
      }
    };
    requestPermission();
    loadRecordings();
  }, []);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const loadRecordings = async () => {
    try {
      const storedRecordings = await AsyncStorage.getItem("recordings");
      if (storedRecordings) {
        const parsedRecordings = JSON.parse(storedRecordings).map((rec) => ({
          ...rec,
          date: new Date(rec.date),
        }));
        setRecordingsList(parsedRecordings);
      }
    } catch (error) {
      console.error("Failed to load recordings", error);
    }
  };

  const saveRecording = async (uri) => {
    const newRecording = {
      uri,
      name: recordingName || `Recording - ${new Date().toLocaleString()}`,
      date: new Date().toISOString(),
    };
    const newRecordingsList = [...recordingsList, newRecording];
    setRecordingsList(newRecordingsList);
    setRecordingName("");
    try {
      await AsyncStorage.setItem(
        "recordings",
        JSON.stringify(newRecordingsList)
      );
    } catch (error) {
      console.error("Failed to save recording", error);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      setIsRecording(false);
      const uri = recording.getURI();
      saveRecording(uri);
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  const playRecording = async (uri) => {
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true }
    );
    setSound(sound);
  };

  const deleteRecording = async (uri) => {
    const updatedRecordings = recordingsList.filter((item) => item.uri !== uri);
    setRecordingsList(updatedRecordings);
    try {
      await AsyncStorage.setItem(
        "recordings",
        JSON.stringify(updatedRecordings)
      );
    } catch (error) {
      console.error("Failed to delete recording", error);
    }
  };

  const shareRecording = async (uri) => {
    try {
      const fileExists = await FileSystem.getInfoAsync(uri);
      if (!fileExists.exists) {
        Alert.alert("Error", "File does not exist");
        return;
      }

      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("Failed to share recording", error);
      Alert.alert("Error", "Unable to share the recording");
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting permission...</Text>;
  }

  if (hasPermission === false) {
    return <Text>No permission to access the microphone</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Audio Recorder</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter recording name"
          value={recordingName}
          onChangeText={setRecordingName}
        />
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={[
            styles.recordButton,
            isRecording && styles.recordingActive,
          ]}
        >
          <Icon name={isRecording ? "stop" : "mic"} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="Search recordings..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {filteredRecordings.length === 0 ? (
        <Text style={styles.noRecordingsText}>
          No recordings available. Start by creating one!
        </Text>
      ) : (
        <FlatList
          data={filteredRecordings}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.recordingItem}>
              <Text style={styles.recordingName}>{item.name}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => playRecording(item.uri)}>
                  <Icon name="play-arrow" size={24} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteRecording(item.uri)}>
                  <Icon name="delete" size={24} color="#F44336" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => shareRecording(item.uri)}>
                  <Icon name="share" size={24} color="#2196F3" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f4f4f4",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#333",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  recordButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF5722",
  },
  recordingActive: {
    backgroundColor: "#D32F2F",
  },
  searchBar: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  noRecordingsText: {
    textAlign: "center",
    color: "#888",
  },
  recordingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
  },
  recordingName: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: 90,
  },
});

export default RecordingScreen;
