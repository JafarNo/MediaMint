import SocialAccountsManager from '@/components/SocialAccountsManager';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { disconnectAccount, getConnectedAccounts } from '../../api/social';
import { useAuth } from '../../contexts/AuthContext';

const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F', bgColor: '#FFEEF2', enabled: true },
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2', bgColor: '#E7F3FF', enabled: true },
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok', color: '#000000', bgColor: '#F0F0F0', enabled: false },
  { id: 'twitter', name: 'X', icon: 'logo-twitter', color: '#000000', bgColor: '#F5F5F5', enabled: false },
  { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2', bgColor: '#E8F4FC', enabled: false },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000', bgColor: '#FFEBEE', enabled: false },
  { id: 'pinterest', name: 'Pinterest', icon: 'logo-pinterest', color: '#E60023', bgColor: '#FCE4EC', enabled: false },
  { id: 'snapchat', name: 'Snapchat', icon: 'logo-snapchat', color: '#FFFC00', bgColor: '#FFFDE7', enabled: false },
];

const Profile = () => {
  const router = useRouter();
  const { user, logout, changePassword, updateUserProfile } = useAuth();

  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [showAccountsManager, setShowAccountsManager] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState(null);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await getConnectedAccounts().then(setConnectedAccounts).catch(() => setConnectedAccounts([]));
    setRefreshing(false);
  }, []);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Edit profile state
  const [editFirstName, setEditFirstName] = useState(user?.first_name || '');
  const [editLastName, setEditLastName] = useState(user?.last_name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/LandingPage');
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        Alert.alert('Success', 'Password changed successfully');
        setShowChangePassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Error', result.error || 'Failed to change password');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await updateUserProfile({
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        email: editEmail.trim(),
      });
      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setShowEditProfile(false);
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Load connected accounts on mount
  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const accounts = await getConnectedAccounts();
      setConnectedAccounts(accounts || []);
    } catch (error) {
      setConnectedAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleDisconnectAccount = async (accountId) => {
    Alert.alert(
      'Disconnect Account',
      'Are you sure you want to disconnect this account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              setDisconnectingId(accountId);
              await disconnectAccount(accountId);
              setConnectedAccounts(prev => prev.filter(a => a.account_id !== accountId));
            } catch (err) {
              Alert.alert('Error', 'Failed to disconnect account');
            } finally {
              setDisconnectingId(null);
            }
          }
        }
      ]
    );
  };

  const getConnectedAccountForPlatform = (platformId) => {
    return connectedAccounts.find(acc => acc.platform === platformId);
  };

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightElement, showBorder = true }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center py-4 ${showBorder ? 'border-b border-gray-100' : ''}`}
    >
      <View className="w-10 h-10 rounded-full bg-[#E6F4F1] items-center justify-center mr-4">
        <Ionicons name={icon} size={20} color="#0B3D2E" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-800">{title}</Text>
        {subtitle && <Text className="text-sm text-gray-500 mt-0.5">{subtitle}</Text>}
      </View>
      {rightElement || <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <Text className="text-lg font-bold text-gray-800 mb-3 mt-6">{title}</Text>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0B3D2E]" edges={['top']}>
      <StatusBar barStyle="light-content" />

      
      <LinearGradient
        colors={['#0B3D2E', '#145A32', '#1a6b3c']}
        style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Profile</Text>
        </View>

        
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400 }}
          className="items-center"
        >
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#E6F4F1',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 8,
            borderWidth: 4,
            borderColor: 'rgba(255,255,255,0.4)'
          }}>
            <Ionicons name="person-circle" size={60} color="#0B3D2E" />
          </View>
          <Text className="text-xl font-bold text-white">
            {user?.first_name || 'First'} {user?.last_name || 'Last'}
          </Text>
          <Text className="text-[#A7F3D0] mt-1 text-base">@{user?.username || 'username'}</Text>
          <Text className="text-[#B6EADA] text-sm mt-1">{user?.email || 'email@example.com'}</Text>
        </MotiView>
      </LinearGradient>

      
      <View className="flex-1 bg-gray-50 rounded-t-3xl -mt-4">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0B3D2E"
              colors={['#0B3D2E']}
            />
          }
        >
          
          <SectionHeader title="Account Settings" />
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
            className="bg-white rounded-2xl px-4 shadow-sm"
          >
            <SettingItem
              icon="person-outline"
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={() => {
                setEditFirstName(user?.first_name || '');
                setEditLastName(user?.last_name || '');
                setEditEmail(user?.email || '');
                setShowEditProfile(true);
              }}
            />
            <SettingItem
              icon="lock-closed-outline"
              title="Change Password"
              subtitle="Update your password"
              onPress={() => setShowChangePassword(true)}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              title="Privacy & Security"
              subtitle="Manage your privacy settings"
              onPress={() => router.push('/privacy')}
              showBorder={false}
            />
          </MotiView>

          
          <SectionHeader title="Support" />
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 400 }}
            className="bg-white rounded-2xl px-4 shadow-sm"
          >
            <SettingItem
              icon="help-circle-outline"
              title="Help & FAQ"
              subtitle="Get help and find answers"
              onPress={() => router.push('/faqs')}
            />
            <SettingItem
              icon="chatbubble-outline"
              title="Contact Support"
              subtitle="mediamintsupport@gmail.com"
              onPress={() => router.push('/contact')}
            />
            <SettingItem
              icon="information-circle-outline"
              title="About"
              subtitle="MediaMint v1.0.0"
              onPress={() => router.push('/about')}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              subtitle="How we protect your data"
              onPress={() => router.push('/privacy')}
              showBorder={false}
            />
          </MotiView>

          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 500 }}
            className="mt-8"
          >
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.8}
              className="bg-red-50 rounded-2xl py-4 flex-row items-center justify-center"
            >
              <Ionicons name="log-out-outline" size={22} color="#DC2626" />
              <Text className="text-red-600 font-semibold text-base ml-2">Logout</Text>
            </TouchableOpacity>
          </MotiView>

          
          <Text className="text-center text-gray-400 text-sm mt-6">
            © 2025 MediaMint. All rights reserved.
          </Text>
        </ScrollView>
      </View>

      
      <Modal
        visible={showChangePassword}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChangePassword(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">Change Password</Text>
              <TouchableOpacity onPress={() => setShowChangePassword(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-600 mb-2">Current Password</Text>
              <View className="flex-row items-center bg-gray-100 rounded-xl px-4">
                <TextInput
                  className="flex-1 py-4 text-base text-gray-800"
                  placeholder="Enter current password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showCurrentPass}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TouchableOpacity onPress={() => setShowCurrentPass(!showCurrentPass)}>
                  <Ionicons name={showCurrentPass ? 'eye-outline' : 'eye-off-outline'} size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-600 mb-2">New Password</Text>
              <View className="flex-row items-center bg-gray-100 rounded-xl px-4">
                <TextInput
                  className="flex-1 py-4 text-base text-gray-800"
                  placeholder="Enter new password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showNewPass}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)}>
                  <Ionicons name={showNewPass ? 'eye-outline' : 'eye-off-outline'} size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-600 mb-2">Confirm New Password</Text>
              <View className="flex-row items-center bg-gray-100 rounded-xl px-4">
                <TextInput
                  className="flex-1 py-4 text-base text-gray-800"
                  placeholder="Confirm new password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showNewPass}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={loading}
              activeOpacity={0.8}
              className="bg-primary rounded-xl py-4 items-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
      <Modal
        visible={showEditProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-600 mb-2">First Name</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-4 text-base text-gray-800"
                placeholder="Enter first name"
                placeholderTextColor="#9CA3AF"
                value={editFirstName}
                onChangeText={setEditFirstName}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-600 mb-2">Last Name</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-4 text-base text-gray-800"
                placeholder="Enter last name"
                placeholderTextColor="#9CA3AF"
                value={editLastName}
                onChangeText={setEditLastName}
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-600 mb-2">Email</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-4 text-base text-gray-800"
                placeholder="Enter email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={editEmail}
                onChangeText={setEditEmail}
              />
            </View>

            <TouchableOpacity
              onPress={handleUpdateProfile}
              disabled={loading}
              activeOpacity={0.8}
              className="bg-primary rounded-xl py-4 items-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
      <SocialAccountsManager
        visible={showAccountsManager}
        onClose={() => setShowAccountsManager(false)}
        onAccountsChanged={loadConnectedAccounts}
      />
    </SafeAreaView>
  );
};

export default Profile;
