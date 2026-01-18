import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LogoIcon from '../assets/images/logo-no-text.png';

/**
 * Reusable Auth Layout Component
 * Wraps auth screens with consistent gradient, logo, animations, and blur card
 */
export default function AuthLayout({
  children,
  title,
  subtitle,
  logoSize = 100,
  showKeyboardAvoid = true,
}) {
  const content = (
    <>
      <Image
        source={LogoIcon}
        style={{ width: logoSize, height: logoSize, alignSelf: 'center', marginBottom: 16 }}
        resizeMode="contain"
      />
      <MotiView
        from={{ opacity: 0, translateY: -30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 600 }}
        style={{ marginBottom: 20, alignItems: 'center' }}
      >
        <MotiView style={{ alignItems: 'center' }}>
          {title && (
            <MotiView style={{ fontSize: 28, fontWeight: 'bold', color: '#E8FFF3', marginBottom: 8 }}>
              {title}
            </MotiView>
          )}
          {subtitle && (
            <MotiView style={{ fontSize: 16, color: '#B6EADA' }}>
              {subtitle}
            </MotiView>
          )}
        </MotiView>
      </MotiView>
      <MotiView
        from={{ opacity: 0, translateY: 40 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 200, duration: 600 }}
      >
        <BlurView
          intensity={Platform.OS === 'android' ? 20 : 40}
          tint="light"
          style={{
            width: '100%',
            borderRadius: 24,
            backgroundColor: 'rgba(0,0,0,0.2)',
            overflow: 'hidden',
            padding: 24,
          }}
        >
          {children}
        </BlurView>
      </MotiView>
    </>
  );

  const scrollContent = (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  );

  return (
    <LinearGradient
      colors={['#0B3D2E', '#0F5132', '#145A32']}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        {showKeyboardAvoid ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            {scrollContent}
          </KeyboardAvoidingView>
        ) : (
          scrollContent
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}
