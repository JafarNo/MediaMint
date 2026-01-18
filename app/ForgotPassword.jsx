import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { authAPI } from '../api/auth';
import LogoIcon from '../assets/images/logo-no-text.png';

export default function ForgotPassword() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            await authAPI.forgotPassword(email.trim());
            setEmailSent(true);
            Alert.alert(
                'Success',
                'Password reset instructions have been sent to your email.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#0B3D2E', '#0F5132', '#145A32']}
            style={{ flex: 1 }}
        >

            <SafeAreaView className="flex-1 items-center justify-center px-6">
                <StatusBar barStyle={'light-content'} />
                <Image
                    source={LogoIcon}
                    style={{ width: 120, height: 120 }}
                    className="mb-6"
                    resizeMode="contain"
                />
                <MotiView
                    from={{ opacity: 0, translateY: -30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ duration: 600 }}
                    className="mb-6 items-center"
                >
                    <Text className="text-4xl font-bold text-[#e8fff3] mb-2">
                        Forgot Password
                    </Text>
                    <Text className="text-base text-[#b6eada] text-center px-4">
                        Enter your email to receive reset instructions
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
                        className="w-full max-w-md rounded-2xl bg-black/20 p-6 overflow-hidden justify-center">
                        <View className="mb-5 flex-row items-center rounded-xl bg-white/20 px-4 py-3" style={{ minHeight: 52 }}>
                            <Ionicons name="mail-outline" size={20} color="#CFFFE5" />
                            <TextInput
                                className="ml-3 flex-1 text-white"
                                placeholder="Email"
                                placeholderTextColor="#A7E6CF"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                                editable={!loading && !emailSent}
                            />
                        </View>
                        <TouchableOpacity
                            className="rounded-xl bg-white/60 py-4"
                            onPress={handleForgotPassword}
                            disabled={loading || emailSent}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#083d2b" />
                            ) : (
                                <Text className="text-center font-semibold text-[#083d2b] text-base">
                                    SEND RESET LINK
                                </Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity className="mt-5"
                            onPress={() => router.back()}
                        >
                            <Text className="text-center text-sm font-semibold text-mint">
                                Back to login
                            </Text>
                        </TouchableOpacity>
                    </BlurView>
                </MotiView>

            </SafeAreaView>
        </LinearGradient>
    );
}