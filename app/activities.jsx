import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchRecentActivities } from '../api/activities';
import { useAuth } from '../contexts/AuthContext';

const ActivityItem = ({ icon, iconColor, iconBg, title, subtitle, time, type }) => (
  <MotiView
    from={{ opacity: 0, translateY: 20 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 300 }}
  >
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    }}>
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: iconBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
      }}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>
          {title}
        </Text>
        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>{subtitle}</Text>
        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{time}</Text>
      </View>
      {type && (
        <View style={{
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
          backgroundColor: iconBg,
        }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: iconColor }}>
            {type}
          </Text>
        </View>
      )}
    </View>
  </MotiView>
);

const Activities = () => {
  const { token } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [token]);

  const loadActivities = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchRecentActivities(50);
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const getActivityIcon = (activity) => {
    if (activity.platform) {
      const platformIcons = {
        instagram: { icon: 'logo-instagram', color: '#E1306C', bg: '#FFEEF2' },
        facebook: { icon: 'logo-facebook', color: '#1877F2', bg: '#E7F3FF' },
        tiktok: { icon: 'logo-tiktok', color: '#000000', bg: '#F0F0F0' },
        twitter: { icon: 'logo-twitter', color: '#000000', bg: '#F5F5F5' },
        linkedin: { icon: 'logo-linkedin', color: '#0A66C2', bg: '#E8F4FC' },
      };
      return platformIcons[activity.platform] || { icon: 'globe', color: '#6B7280', bg: '#F3F4F6' };
    }
    
    const typeIcons = {
      content_generated: { icon: 'sparkles', color: '#10B981', bg: '#ECFDF5' },
      post_created: { icon: 'checkmark-circle', color: '#10B981', bg: '#ECFDF5' },
      post_scheduled: { icon: 'calendar', color: '#F59E0B', bg: '#FFFBEB' },
      response_generated: { icon: 'chatbubbles', color: '#8B5CF6', bg: '#F3E8FF' },
    };
    return typeIcons[activity.type] || { icon: 'information-circle', color: '#6B7280', bg: '#F3F4F6' };
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getActivityType = (activity) => {
    const types = {
      content_generated: 'Generated',
      post_created: 'Created',
      post_scheduled: 'Scheduled',
      response_generated: 'Response',
    };
    return types[activity.type] || '';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B3D2E' }} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#0B3D2E', '#145A32', '#1a6b3c']}
        style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>All Activities</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <Text style={{ fontSize: 14, color: '#A7F3D0', textAlign: 'center', marginTop: 8 }}>
          Your complete activity history
        </Text>
      </LinearGradient>
      
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0B3D2E" />
          }
        >
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#0B3D2E" />
              <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>Loading activities...</Text>
            </View>
          ) : activities.length === 0 ? (
            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 40,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="time-outline" size={40} color="#9CA3AF" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
                No activities yet
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
                Start creating content to see your activity history
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/create')}
                style={{
                  backgroundColor: '#0B3D2E',
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>
                  Create Content
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            activities.map((activity) => {
              const iconData = getActivityIcon(activity);
              return (
                <ActivityItem
                  key={activity.id}
                  icon={iconData.icon}
                  iconColor={iconData.color}
                  iconBg={iconData.bg}
                  title={activity.action}
                  subtitle={activity.description}
                  time={getTimeAgo(activity.created_at)}
                  type={getActivityType(activity)}
                />
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Activities;
