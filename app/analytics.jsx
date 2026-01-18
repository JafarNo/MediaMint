import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, Svg } from 'react-native-svg';
import { getAnalyticsSummary } from '../api/social';

const { width } = Dimensions.get('window');

// Time period selector component
const TimePeriodSelector = ({ selected, onSelect }) => {
  const periods = [
    { id: '7D', disabled: true },
    { id: '30D', disabled: false },
    { id: '90D', disabled: true },
    { id: 'All', disabled: true },
  ];
  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#F3F4F6',
      borderRadius: 12,
      padding: 4,
    }}>
      {periods.map((period) => (
        <TouchableOpacity
          key={period.id}
          onPress={() => !period.disabled && onSelect(period.id)}
          activeOpacity={period.disabled ? 1 : 0.7}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: selected === period.id ? '#0B3D2E' : 'transparent',
            opacity: period.disabled ? 0.4 : 1,
          }}
        >
          <Text style={{
            fontSize: 13,
            fontWeight: '600',
            color: selected === period.id ? 'white' : '#6B7280',
          }}>
            {period.id}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Main stat card with trend indicator
const MainStatCard = ({ icon, value, label, trend, trendUp, color, bgColor }) => (
  <View style={{
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  }}>
    <View style={{
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: bgColor,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    }}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginBottom: 2 }}>
      {value}
    </Text>
    <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>{label}</Text>
  </View>
);

// Platform performance card
const PlatformCard = ({ icon, name, followers, engagement, posts, color, bgColor }) => (
  <View style={{
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  }}>
    <View style={{
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: bgColor,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    }}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>
        {name}
      </Text>
      <Text style={{ fontSize: 13, color: '#6B7280' }}>
        {followers} followers
      </Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: '#10B981', marginBottom: 2 }}>
        {engagement}%
      </Text>
      <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{posts} posts</Text>
    </View>
  </View>
);

// Simple bar chart component
const SimpleBarChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, marginTop: 16 }}>
      {data.map((item, index) => (
        <View key={index} style={{ flex: 1, alignItems: 'center' }}>
          <View style={{
            width: '60%',
            height: (item.value / maxValue) * 100,
            backgroundColor: item.color || '#0B3D2E',
            borderRadius: 6,
            marginBottom: 8,
          }} />
          <Text style={{ fontSize: 11, color: '#6B7280' }}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

// Content performance item
const ContentItem = ({ type, title, views, reacts, comments, shares, date, thumbnail }) => (
  <View style={{
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  }}>
    {thumbnail ? (
      <Image
        source={{ uri: thumbnail }}
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          marginRight: 12,
        }}
        resizeMode="cover"
      />
    ) : (
      <View style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: type === 'video' ? '#DBEAFE' : type === 'image' ? '#FEF3C7' : '#E0E7FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}>
        <Ionicons
          name={type === 'video' ? 'videocam' : type === 'image' ? 'image' : 'document-text'}
          size={24}
          color={type === 'video' ? '#3B82F6' : type === 'image' ? '#F59E0B' : '#6366F1'}
        />
      </View>
    )}
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 4 }} numberOfLines={1}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {views && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
            <Ionicons name="eye-outline" size={14} color="#9CA3AF" />
            <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }}>{views}</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
          <Ionicons name="heart-outline" size={14} color="#9CA3AF" />
          <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }}>{reacts}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
          <Ionicons name="chatbubble-outline" size={14} color="#9CA3AF" />
          <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }}>{comments}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="share-outline" size={14} color="#9CA3AF" />
          <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }}>{shares}</Text>
        </View>
      </View>
    </View>
    <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{date}</Text>
  </View>
);

// Engagement ring component
// Engagement ring component using SVG
const EngagementRing = ({ percentage, label, color }) => {
  const radius = 28;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ alignItems: 'center', marginHorizontal: 8 }}>
      <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={64} height={64} style={{ transform: [{ rotate: '-90deg' }] }}>
          {/* Background Circle */}
          <Circle
            cx="32"
            cy="32"
            r={radius}
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle */}
          <Circle
            cx="32"
            cy="32"
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
        <Text style={{ position: 'absolute', fontSize: 13, fontWeight: 'bold', color: '#1F2937' }}>
          {Math.round(percentage)}%
        </Text>
      </View>
      <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>{label}</Text>
    </View>
  );
};

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const Analytics = () => {
  const router = useRouter();
  const [timePeriod, setTimePeriod] = useState('30D');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAnalyticsSummary();
      setAnalyticsData(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const mainStats = [
    {
      icon: 'eye',
      value: analyticsData ? formatNumber(analyticsData.total_views) : '0',
      label: 'Total Views',
      trend: '+12.5%',
      trendUp: true,
      color: '#3B82F6',
      bgColor: '#EFF6FF'
    },
    {
      icon: 'heart',
      value: analyticsData ? formatNumber(
        (analyticsData.total_engagements || 0) +
        (analyticsData.total_shares || 0)
      ) : '0',
      label: 'Engagements',
      trend: '+8.3%',
      trendUp: true,
      color: '#EF4444',
      bgColor: '#FEF2F2'
    },
  ];

  const weeklyData = analyticsData?.weekly_data?.length > 0
    ? analyticsData.weekly_data
    : [
      { label: 'Mon', value: 0, color: '#0B3D2E' },
      { label: 'Tue', value: 0, color: '#145A32' },
      { label: 'Wed', value: 0, color: '#0B3D2E' },
      { label: 'Thu', value: 0, color: '#10B981' },
      { label: 'Fri', value: 0, color: '#145A32' },
      { label: 'Sat', value: 0, color: '#10B981' },
      { label: 'Sun', value: 0, color: '#0B3D2E' },
    ];

  const reactionsPercentage = analyticsData?.reactions_percentage || 0;
  const commentsPercentage = analyticsData?.comments_percentage || 0;
  const sharesPercentage = analyticsData?.shares_percentage || 0;

  const topContent = analyticsData?.top_posts || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B3D2E' }} edges={['top']}>
      <StatusBar barStyle="light-content" />


      <LinearGradient
        colors={['#0B3D2E', '#145A32', '#1a6b3c']}
        style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Analytics</Text>
            <Text style={{ fontSize: 13, color: '#A7F3D0', marginTop: 2 }}>Track your content performance</Text>
          </View>
        </View>


        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={{ flexDirection: 'row', marginHorizontal: -4 }}
        >
          {mainStats.map((stat, index) => (
            <MainStatCard key={index} {...stat} />
          ))}
        </MotiView>
      </LinearGradient>


      <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>Overview</Text>
            <TimePeriodSelector selected={timePeriod} onSelect={setTimePeriod} />
          </MotiView>


          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 150 }}
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 20,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 16 }}>
              Engagement Breakdown
            </Text>
            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="small" color="#0B3D2E" />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <EngagementRing percentage={reactionsPercentage} label="Reacts" color="#EF4444" />
                <EngagementRing percentage={commentsPercentage} label="Comments" color="#3B82F6" />
                <EngagementRing percentage={sharesPercentage} label="Shares" color="#10B981" />
                <EngagementRing percentage={0} label="Saves" color="#F59E0B" />
              </View>
            )}
          </MotiView>


          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 20,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                Weekly Performance
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 }} />
                <Text style={{ fontSize: 12, color: '#6B7280' }}>Engagements</Text>
              </View>
            </View>
            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#0B3D2E" />
              </View>
            ) : (
              <SimpleBarChart data={weeklyData} />
            )}
          </MotiView>


          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 300 }}
            style={{ marginTop: 8 }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
              Top Performing Content
            </Text>
            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="small" color="#0B3D2E" />
              </View>
            ) : topContent.length > 0 ? (
              topContent.map((content, index) => (
                <ContentItem key={index} {...content} />
              ))
            ) : (
              <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, alignItems: 'center' }}>
                <Ionicons name="document-text-outline" size={40} color="#9CA3AF" />
                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>No posts yet</Text>
              </View>
            )}
          </MotiView>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Analytics;