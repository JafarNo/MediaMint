import { Stack } from 'expo-router';
import { AuthGuard } from '../components/AuthGuard';
import { AuthProvider } from '../contexts/AuthContext';
import '../global.css';

// Default screen options - applied to all screens
const defaultScreenOptions = {
  title: "",
  headerShown: false,
};

// All screen names that use default options
const screens = [
  '(tabs)',
  'index',
  'analytics',
  'scheduled',
  'LandingPage',
  'Login',
  'Signup',
  'ForgotPassword',
  'Enhancements',
  'about',
  'activities',
  'contact',
  'faqs',
  'privacy',
  'schedule-post',
  'posts',
];

const ScreensLayout = () => {
  return (
    <AuthProvider>
      <AuthGuard>
        <Stack screenOptions={defaultScreenOptions}>
          {screens.map((name) => (
            <Stack.Screen key={name} name={name} />
          ))}
        </Stack>
      </AuthGuard>
    </AuthProvider>
  );
};

export default ScreensLayout
