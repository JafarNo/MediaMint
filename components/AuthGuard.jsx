import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inAuthScreens = ['Login', 'Signup', 'ForgotPassword', 'LandingPage'].includes(segments[0]);

    if (!isAuthenticated && inAuthGroup) {
      router.replace('/LandingPage');
    } else if (isAuthenticated && inAuthScreens) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
        <ActivityIndicator size="large" color="#235247" />
      </View>
    );
  }

  return <>{children}</>;
}
