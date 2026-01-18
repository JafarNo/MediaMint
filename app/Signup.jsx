import React, { useState } from "react";
import {
    ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView,
    StatusBar, Text, TextInput, TouchableOpacity, View
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { MotiView } from 'moti';
import { SafeAreaView } from "react-native-safe-area-context";
import LogoIcon from '../assets/images/logo-no-text.png';
import { useAuth } from '../contexts/AuthContext';

export default function Signup(){
 const router = useRouter();
 const { register } = useAuth();
 const [showPass, setShowPass] = useState(false);
 const [fullName, setFullName] = useState('');
 const [email, setEmail] = useState('');
 const [username, setUsername] = useState('');
 const [password, setPassword] = useState('');
 const [loading, setLoading] = useState(false);

 const handleSignup = async () => {
   if (!fullName.trim() || !email.trim() || !username.trim() || !password.trim()) {
     Alert.alert('Error', 'Please fill in all fields');
     return;
   }

   if (password.length < 6) {
     Alert.alert('Error', 'Password must be at least 6 characters');
     return;
   }

   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!emailRegex.test(email)) {
     Alert.alert('Error', 'Please enter a valid email address');
     return;
   }

   setLoading(true);
   try {
     const [firstName, ...lastNameParts] = fullName.trim().split(' ');
     const lastName = lastNameParts.join(' ') || firstName;

     const result = await register({
       username: username.trim(),
       email: email.trim(),
       firstName,
       lastName,
       password,
     });
     
     if (result.success) {
       router.replace('/(tabs)/home');
     } else {
       Alert.alert('Registration Failed', result.error);
     }
   } catch (error) {
     Alert.alert('Error', 'An unexpected error occurred');
   } finally {
     setLoading(false);
   }
 };

 return(
    <LinearGradient
        colors={['#0B3D2E', '#0F5132', '#145A32']}
        style={{ flex: 1 }}
        >
    <StatusBar barStyle={'light-content'}/>
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
       className="mb-3"
       resizeMode="contain"
      />
    </View>
        <MotiView
                from={{opacity:0, translateY:-30}}
                animate={{opacity:1, translateY:0}}
                transition={{duration:600}}
                className="mb-4 items-center"
        >
            <Text className="text-3xl font-bold text-[#E8FFF3]">Create Account</Text>
            <Text className="mt-2 text-lg text-[#B6EADA]">Sign up to get started</Text>
        </MotiView>
        <MotiView
          from={{opacity:0, translateY:40}}
          animate={{opacity:1, translateY:0}}
          transition={{delay:200, duration:600}}
        >
        <BlurView
          intensity={Platform.OS==='android'? 20 : 40}
          tint="light"
          className="w-full rounded-3xl bg-black/20 overflow-hidden"
          style={{ padding: 24 }}
          >
              <View className="mb-4 flex-row items-center rounded-2xl bg-white/20 px-5" style={{ height: 60 }}>
                <Ionicons name="person-outline" size={24} color="#CFFFE5" />
                <TextInput
                  className="ml-4 flex-1 text-white text-base"
                  placeholder="Full Name"
                  placeholderTextColor="#A7E6CF"
                  value={fullName}
                  onChangeText={setFullName}
                  editable={!loading}
                  returnKeyType="next"
                  style={{ fontSize: 16 }}
                />
              </View>

               <View className="mb-4 flex-row items-center rounded-2xl bg-white/20 px-5" style={{ height: 60 }}>
                <Ionicons name="mail-outline" size={24} color="#CFFFE5" />
                <TextInput
                  className="ml-4 flex-1 text-white text-base"
                  placeholder="Email"
                  placeholderTextColor="#A7E6CF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                  returnKeyType="next"
                  style={{ fontSize: 16 }}
                 />
                </View>

               <View className="mb-4 flex-row items-center rounded-2xl bg-white/20 px-5" style={{ height: 60 }}>
                <Ionicons name="at-outline" size={24} color="#CFFFE5" />
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
                  placeholder="Password (min 6 characters)"
                  placeholderTextColor="#A7E6CF"
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                  style={{ fontSize: 16 }}
                />
                <TouchableOpacity
                onPress={()=>setShowPass(!showPass)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
                >
                <Ionicons name={showPass ? "eye-outline": "eye-off-outline"} size={24} color="#CFFFE5" />
                </TouchableOpacity>

              </View>
              <TouchableOpacity 
                className="rounded-2xl bg-white/60" 
                style={{ height: 56 }}
                activeOpacity={0.85}
                onPress={handleSignup}
                disabled={loading}
              >
                <View className="flex-1 items-center justify-center">
                {loading ? (
                  <ActivityIndicator color="#083d2b" size="small" />
                ) : (
                  <Text className="text-center font-bold text-[#083d2b] text-lg">SIGN UP</Text>
                )}
                </View>
              </TouchableOpacity>

              <View className="mt-6 flex-row justify-center items-center">
                <Text className="text-base text-[#cfffe5]">
                    Already have an account?{' '}
                </Text>
                <TouchableOpacity 
                  onPress={()=> router.push('/Login')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text  className="text-base font-bold text-emerald-400" >
                        Login
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