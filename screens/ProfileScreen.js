import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedCredentials = await AsyncStorage.getItem('userCredentials');
        if (storedCredentials) {
          const { username, password } = JSON.parse(storedCredentials);
          setUsername(username);
          setPassword(password);
        }
      } catch (error) {
        console.error('Failed to load profile', error);
      }
    };
    loadProfile();
  }, []);

  const handleUpdate = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    const updatedCredentials = { username, password };
    try {
      await AsyncStorage.setItem('userCredentials', JSON.stringify(updatedCredentials));
      Alert.alert('Success', 'Profile updated!');
    } catch (error) {
      console.error('Failed to update profile', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Save Changes" onPress={handleUpdate} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginVertical: 8,
  },
});

export default ProfileScreen;
