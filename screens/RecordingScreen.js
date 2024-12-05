import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  FlatList,
  StyleSheet,
  TextInput,
} from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

const RecordingScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState();
  const [recordingsList, setRecordingsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [recordingName, setRecordingName] = useState("");

  const filteredRecordings = recordingsList.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
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
      name: recordingName || `Recording - ${new Date().toLocaleString()}`, // Use provided name or default
      date: new Date().toISOString(),
    };
    const newRecordingsList = [...recordingsList, newRecording];
    setRecordingsList(newRecordingsList);
    setRecordingName(""); // Reset the recording name field
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
      <Text>Recording Screen</Text>
      <Text>Status: {isRecording ? "Recording..." : "Idle"}</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter recording name"
        value={recordingName}
        onChangeText={setRecordingName}
      />
      {isRecording ? (
        <Button title="Stop Recording" onPress={stopRecording} />
      ) : (
        <Button title="Start Recording" onPress={startRecording} />
      )}
      <TextInput
        style={styles.searchBar}
        placeholder="Search recordings..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {recordingsList.length === 0 ? (
        <Text>No recordings available. Start by creating one!</Text>
      ) : (
        <FlatList
          data={recordingsList}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.recordingItem}>
              <Text>{`Recording - ${new Date(
                item.date
              ).toLocaleString()}`}</Text>
              <Button title="Play" onPress={() => playRecording(item.uri)} />
              <Button
                title="Delete"
                onPress={() => deleteRecording(item.uri)}
              />
              <Button title="Share" onPress={() => shareRecording(item.uri)} />
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
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 8,
    width: "100%",
  },
  searchBar: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  recordingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
});

export default RecordingScreen;
