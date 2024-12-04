import React, { useState, useEffect } from "react";
import { View, Text, Button, Alert, FlatList, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TextInput } from "react-native";

const RecordingScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState();
  const [recordingsList, setRecordingsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const filteredRecordings = recordingsList.filter((item) =>
    item.uri.includes(searchQuery)
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
  }, []);

  useEffect(() => {
    const loadRecordings = async () => {
      try {
        const storedRecordings = await AsyncStorage.getItem("recordings");
        if (storedRecordings) {
          setRecordingsList(JSON.parse(storedRecordings));
        }
      } catch (error) {
        console.error("Failed to load recordings", error);
      }
    };
    loadRecordings();
  }, []);

  const saveRecording = async (uri) => {
    const newRecordings = [...recordingsList, { uri, date: new Date() }];
    setRecordingsList(newRecordings);
    try {
      await AsyncStorage.setItem("recordings", JSON.stringify(newRecordings));
    } catch (error) {
      console.error("Failed to save recording", error);
    }
  };

  const startRecording = async () => {
    try {
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      console.log("Recording started...");
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      setIsRecording(false);
      const uri = recording.getURI();
      console.log("Recording stopped. URI:", uri);
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

  if (hasPermission === null) {
    return (
      <View>
        <Text>Requesting permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View>
        <Text>No permission to access the microphone</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text>Recording Screen</Text>
      <Text>Status: {isRecording ? "Recording..." : "Idle"}</Text>
      {isRecording ? (
        <Button title="Stop Recording" onPress={stopRecording} />
      ) : (
        <Button title="Start Recording" onPress={startRecording} />
      )}

      <FlatList
        data={recordingsList}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.recordingItem}>
            <Text>{`Recording - ${item.date.toLocaleString()}`}</Text>
            <Button title="Play" onPress={() => playRecording(item.uri)} />
            <Button title="Delete" onPress={() => deleteRecording(item.uri)} />
          </View>
        )}
      />
      <TextInput
        style={styles.searchBar}
        placeholder="Search recordings..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredRecordings}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.recordingItem}>
            <Text>{`Recording - ${item.date.toLocaleString()}`}</Text>
            <Button title="Play" onPress={() => playRecording(item.uri)} />
            <Button title="Delete" onPress={() => deleteRecording(item.uri)} />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  recordingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
});

export default RecordingScreen;
