import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { MotiView } from 'moti';
import { SafeAreaView } from "react-native-safe-area-context";
import LogoIcon from '../assets/images/logo-no-text.png';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const result = await login(username.trim(), password);

      if (result.success) {
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('Login Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  return (
    <LinearGradient
      colors={['#0B3D2E', '#0F5132', '#145A32']}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle={'light-content'} />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            <View className="items-center">
              <Image
                source={LogoIcon}
                style={{ width: 100, height: 100 }}
                className="mb-4"
                resizeMode="contain"
              />
            </View>
            <MotiView
              from={{ opacity: 0, translateY: -30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 600 }}
              className="mb-5 items-center"
            >
              <Text className="text-3xl font-bold text-[#E8FFF3]">
                Welcome Back
              </Text>
              <Text className="mt-2 text-lg text-[#B6EADA]">
                Login to continue
              </Text>

            </MotiView>
            <MotiView
              from={{ opacity: 0, translateY: 40 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200, duration: 600 }}
            >
              <BlurView
                intensity={Platform.OS === 'android' ? 20 : 40}
                tint="light"
                className="w-full rounded-3xl bg-black/20 overflow-hidden"
                style={{ padding: 24 }}
              >
                <View className="mb-4 flex-row items-center rounded-2xl bg-white/20 px-5" style={{ height: 60 }}>
                  <Ionicons name="person-outline" size={24} color="#CFFFE5" />
                  <TextInput
                    className="ml-4 flex-1 text-white text-base"
                    placeholder="Username"
                    placeholderTextColor="#A7E6CF"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={setUsername}
                    editable={!loading}
                    returnKeyType="next"
                    style={{ fontSize: 16 }}
                  />
                </View>
                <View className="mb-5 flex-row items-center rounded-2xl bg-white/20 px-5" style={{ height: 60 }}>
                  <Ionicons name="lock-closed-outline" size={24} color="#CFFFE5" />
                  <TextInput
                    className="ml-4 flex-1 text-white text-base"
                    placeholder="Password"
                    placeholderTextColor="#A7E6CF"
                    secureTextEntry={!showPass}
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    style={{ fontSize: 16 }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPass(!showPass)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={showPass ? "eye-outline" : "eye-off-outline"} size={24} color="#CFFFE5" />
                  </TouchableOpacity>
                </View>
                <View className="mb-5 flex-row justify-end">
                  <TouchableOpacity
                    onPress={() => router.push('/ForgotPassword')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text className="text-base text-mint font-medium">
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  className="mt-3 rounded-2xl bg-white/60"
                  style={{ height: 56 }}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <View className="flex-1 items-center justify-center">
                    {loading ? (
                      <ActivityIndicator color="#083d2b" size="small" />
                    ) : (
                      <Text className="text-center font-bold text-[#083d2b] text-lg">
                        LOGIN
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
                <View className="mt-6 flex-row justify-center items-center">
                  <Text className="text-base text-[#cfffe5]">
                    Don&apos;t have an account?{' '}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/Signup')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text className="text-base font-bold text-emerald-400">
                      Sign up
                    </Text>
                  </TouchableOpacity>
                </View>


              </BlurView>
            </MotiView>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>

  );
}
