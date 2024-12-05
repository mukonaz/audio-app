import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ForgotPasswordScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleResetPassword = async () => {
    try {
      const storedCredentials = await AsyncStorage.getItem('userCredentials');
      if (!storedCredentials) {
        Alert.alert('Error', 'No user found');
        return;
      }

      const parsedCredentials = JSON.parse(storedCredentials);
      if (parsedCredentials.username !== username) {
        Alert.alert('Error', 'Username not found');
        return;
      }

      parsedCredentials.password = newPassword;
      await AsyncStorage.setItem('userCredentials', JSON.stringify(parsedCredentials));
      Alert.alert('Success', 'Password reset successfully!');
      navigation.navigate('AuthScreen');
    } catch (error) {
      console.error('Failed to reset password', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <Button title="Reset Password" onPress={handleResetPassword} />
    </View>
  );
};

export default ForgotPasswordScreen;
