import React, { useState, useEffect } from 'react';
import { View, Button, Text,Alert, StyleSheet } from 'react-native';
import { TextInput, } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [storedCredentials, setStoredCredentials] = useState(null);

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedCredentials = await AsyncStorage.getItem('userCredentials');
        if (savedCredentials) {
          setStoredCredentials(JSON.parse(savedCredentials));
        }
      } catch (error) {
        console.error('Failed to load credentials', error);
      }
    };
    loadCredentials();
  }, []);

  const handleRegister = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newCredentials = { username, password };
    try {
      await AsyncStorage.setItem('userCredentials', JSON.stringify(newCredentials));
      setStoredCredentials(newCredentials);
      Alert.alert('Success', 'Registration complete! You can now log in.');
    } catch (error) {
      console.error('Failed to save credentials', error);
    }
  };

  const handleLogin = () => {
    if (
      storedCredentials &&
      username === storedCredentials.username &&
      password === storedCredentials.password
    ) {
      Alert.alert('Success', `Welcome, ${username}!`);
      navigation.navigate('RecordingScreen'); 
    } else {
      Alert.alert('Error', 'Invalid username or password');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login page</Text>
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
      <View style={styles.buttonContainer}>
        <Button title="Register" onPress={handleRegister} />
        <Button title="Login" onPress={handleLogin} />
      </View>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
});

export default AuthScreen;
