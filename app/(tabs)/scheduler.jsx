import { fetchCalendarPosts, fetchPostsStats } from '@/api/posts';
import Calendar from '@/components/Calendar';
import ScheduledItemCard from '@/components/ScheduledItemCard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Scheduler = () => {
  const getOrdinal = (n) => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const resetTime = (d) => {
    const dateObj = new Date(d);
    return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  };

  const formatScheduleLabel = (date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const selected = resetTime(date);

    if (selected.getTime() === resetTime(today).getTime()) return "Today's schedule";
    if (selected.getTime() === resetTime(tomorrow).getTime()) return "Tomorrow's schedule";

    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleDateString(undefined, { month: 'long' });
    return `${month} ${day}${getOrdinal(day)}'s schedule`;
  };

  const TodayScheduleList = ({ scheduledItems, selectedDate }) => {
    // Build target date string in YYYY-MM-DD format
    const targetDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    const todayItems = scheduledItems.filter(item => {
      // item.date should be in YYYY-MM-DD format
      if (typeof item.date === 'string') {
        return item.date === targetDateStr;
      }
      // Fallback for Date objects
      return resetTime(item.date).getTime() === resetTime(selectedDate).getTime();
    });

    if (!todayItems || todayItems.length === 0) {
      return (
        <View style={{
          marginHorizontal: 20,
          marginVertical: 12,
          padding: 24,
          backgroundColor: 'white',
          borderRadius: 16,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.03,
          shadowRadius: 4,
          elevation: 1,
        }}>
          <View style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#F3F4F6',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}>
            <Ionicons name="calendar-outline" size={28} color="#9CA3AF" />
          </View>
          <Text style={{ fontSize: 15, color: '#6B7280', textAlign: 'center' }}>
            No content scheduled for this day
          </Text>
          <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
            Tap + to schedule new content
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={todayItems}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => <ScheduledItemCard item={item} />}
      />
    );
  };





  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduledItems, setScheduledItems] = useState([]);
  const [stats, setStats] = useState({ scheduled: 0, pending: 0, published: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Transform API calendar response to flat array of items for display
  const transformCalendarToItems = (calendarData, year, month) => {
    if (!calendarData || typeof calendarData !== 'object') return [];

    const items = [];

    // Iterate through each day in the calendar
    Object.entries(calendarData).forEach(([day, posts]) => {
      if (!Array.isArray(posts) || posts.length === 0) return;

      posts.forEach(post => {
        const scheduledDate = new Date(post.scheduled_at || `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
        const timeString = scheduledDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        // Create date string in YYYY-MM-DD format using local time components
        const dateString = `${scheduledDate.getFullYear()}-${String(scheduledDate.getMonth() + 1).padStart(2, '0')}-${String(scheduledDate.getDate()).padStart(2, '0')}`;

        // Get platform name from platforms array
        const platformName = post.platforms && post.platforms.length > 0
          ? post.platforms[0].charAt(0).toUpperCase() + post.platforms[0].slice(1)
          : '';

        items.push({
          id: post.id || post._id,
          title: `${platformName} ${post.media_type || 'Post'}`,
          type: 'Post',
          platform: platformName,
          time: timeString,
          date: dateString,
          contentType: post.media_type || 'image',
          content: post.media_url || post.media_base64 || '',
          caption: post.caption || '',
          status: post.status || 'scheduled',
          media_url: post.media_url || post.media_base64 || '',
        });
      });
    });

    return items;
  };

  // Fetch calendar posts for the current month
  const loadCalendarPosts = useCallback(async (year, month) => {
    try {
      const response = await fetchCalendarPosts(year, month);

      // The API returns { year, month, days_in_month, calendar: { "1": [], "2": [], ... } }
      if (response && response.calendar) {
        const items = transformCalendarToItems(response.calendar, year, month);
        setScheduledItems(items);
      } else {
        setScheduledItems([]);
      }
    } catch (error) {
      console.error('Failed to load calendar posts:', error);
      setScheduledItems([]);
    }
  }, []);

  // Fetch stats
  const loadStats = useCallback(async () => {
    try {
      const statsData = await fetchPostsStats();
      setStats({
        scheduled: statsData.scheduled_today || statsData.scheduled || 0,
        pending: statsData.scheduled || statsData.pending || 0,
        published: statsData.published || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const now = new Date();
      await Promise.all([
        loadCalendarPosts(now.getFullYear(), now.getMonth() + 1),
        loadStats()
      ]);
      setLoading(false);
    };
    loadData();
  }, [loadCalendarPosts, loadStats]);

  // Handle month change from calendar
  const handleMonthChange = useCallback((newDate) => {
    setCurrentMonth(newDate);
    loadCalendarPosts(newDate.getFullYear(), newDate.getMonth() + 1);
  }, [loadCalendarPosts]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadCalendarPosts(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
      loadStats()
    ]);
    setRefreshing(false);
  }, [currentMonth, loadCalendarPosts, loadStats]);

  const getScheduledCount = () => {
    // Build target date string in YYYY-MM-DD format
    const targetDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    return scheduledItems.filter(item => {
      if (typeof item.date === 'string') {
        return item.date === targetDateStr;
      }
      return resetTime(item.date).getTime() === resetTime(selectedDate).getTime();
    }).length;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B3D2E' }} edges={['top']}>
      <StatusBar barStyle="light-content" />


      <LinearGradient
        colors={['#0B3D2E', '#145A32', '#1a6b3c']}
        style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Scheduler</Text>
            <Text style={{ fontSize: 13, color: '#A7F3D0', marginTop: 2 }}>Plan and schedule your content</Text>
          </View>
        </View>


        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={{ flexDirection: 'row', marginHorizontal: -4 }}
        >
          {[
            { icon: 'calendar', value: stats.scheduled, label: 'Today', color: '#3B82F6', bgColor: '#EFF6FF' },
            { icon: 'time', value: stats.pending, label: 'Pending', color: '#F59E0B', bgColor: '#FFFBEB' },
            { icon: 'checkmark-circle', value: stats.published, label: 'Published', color: '#10B981', bgColor: '#ECFDF5' },
          ].map((stat, index) => (
            <View key={index} style={{
              flex: 1,
              backgroundColor: stat.bgColor,
              borderRadius: 14,
              padding: 14,
              marginHorizontal: 4,
            }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'white',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}>
                <Ionicons name={stat.icon} size={16} color={stat.color} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1F2937' }}>{stat.value}</Text>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>{stat.label}</Text>
            </View>
          ))}
        </MotiView>
      </LinearGradient>


      <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 120 }}
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

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
            style={{ paddingHorizontal: 20 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: '#E0FAFA',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
                <Ionicons name="calendar" size={14} color="#0B3D2E" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#1F2937' }}>Calendar</Text>
            </View>
          </MotiView>

          {loading ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40 }}>
              <ActivityIndicator size="large" color="#0B3D2E" />
            </View>
          ) : (
            <Calendar
              onSelect={(date) => setSelectedDate(date)}
              onMonthChange={handleMonthChange}
              scheduledItems={scheduledItems}
            />
          )}


          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 150 }}
            style={{ marginTop: 20, paddingHorizontal: 20 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#1F2937' }}>
                {formatScheduleLabel(selectedDate)}
              </Text>
              <View style={{
                backgroundColor: '#E0FAFA',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#0B3D2E' }}>
                  {getScheduledCount()} items
                </Text>
              </View>
            </View>
          </MotiView>
          <TodayScheduleList scheduledItems={scheduledItems} selectedDate={selectedDate} />


          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
            style={{ paddingHorizontal: 20, marginTop: 20 }}
          >
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/create')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#0B3D2E', '#145A32']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  padding: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}>
                  <Ionicons name="add" size={28} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '600', color: 'white' }}>
                    Create New Content
                  </Text>
                  <Text style={{ fontSize: 13, color: '#A7F3D0', marginTop: 2 }}>
                    Create and schedule posts from the Create tab
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#A7F3D0" />
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Scheduler;
