import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchRecentActivities } from '../../api/activities';
import { fetchPostsStats } from '../../api/posts';
import { getConnectedAccounts } from '../../api/social';
import SocialAccountsManager from '../../components/SocialAccountsManager';
import { ActivityItem, QuickActionButton, StatCard } from '../../components/ui';
import { ACTIVITY_ICONS, COLORS, PLATFORM_ICONS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [showAccountsManager, setShowAccountsManager] = useState(false);
  const [postsStats, setPostsStats] = useState({
    total_posts: 0,
    published: 0,
    scheduled: 0,
    drafts: 0,
    scheduled_today: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadActivities(),
      loadConnectedAccounts(),
      loadPostsStats()
    ]);
    setRefreshing(false);
  }, [token]);

  const firstName = user?.first_name || 'User';

  useFocusEffect(
    useCallback(() => {
      loadActivities();
      loadConnectedAccounts();
      loadPostsStats();
    }, [token])
  );

  const loadConnectedAccounts = async () => {
    if (!token) {
      setLoadingAccounts(false);
      return;
    }

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

  const loadActivities = async () => {
    if (!token) {
      setLoadingActivities(false);
      return;
    }

    try {
      setLoadingActivities(true);
      const data = await fetchRecentActivities(5); // Get last 5 activities
      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const loadPostsStats = async () => {
    if (!token) {
      setLoadingStats(false);
      return;
    }

    try {
      setLoadingStats(true);
      const stats = await fetchPostsStats();
      setPostsStats(stats);
    } catch (error) {
      console.error('Failed to load posts stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };


  const stats = [
    { icon: 'document-text', value: postsStats.total_posts.toString(), label: 'Posts', color: COLORS.status.info, bgColor: COLORS.status.infoLight },
    { icon: 'time', value: postsStats.scheduled_today.toString(), label: 'Today', color: COLORS.status.warning, bgColor: COLORS.status.warningLight },
    { icon: 'calendar', value: postsStats.scheduled.toString(), label: 'Scheduled', color: COLORS.status.success, bgColor: COLORS.status.successLight },
  ];

  const quickActions = [
    { icon: 'bar-chart', label: 'Analytics', route: '/analytics', color: COLORS.primary.lighter, bgColor: COLORS.primary.mintLight },
    { icon: 'documents', label: 'My Posts', route: '/posts', color: COLORS.status.info, bgColor: COLORS.status.infoLight },
    { icon: 'document-text', label: 'Drafts', route: '/posts?filter=draft', color: COLORS.status.warning, bgColor: COLORS.status.warningLight },
    { icon: 'chatbubbles', label: 'Responses', route: '/(tabs)/responses', color: '#8B5CF6', bgColor: '#F3E8FF' },
  ];

  const getActivityIcon = (activity) => {
    if (activity.platform) {
      const platformData = PLATFORM_ICONS[activity.platform] || PLATFORM_ICONS.default;
      return { icon: platformData.icon, color: platformData.color, bg: platformData.bg };
    }
    const activityData = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.default;
    return { icon: activityData.icon, color: activityData.color, bg: activityData.bg };
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B3D2E' }} edges={['top']}>
      <StatusBar barStyle="light-content" />

      
      <LinearGradient
        colors={['#0B3D2E', '#145A32', '#1a6b3c']}
        style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
              {firstName}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'white',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#047857' }}>
                {user?.first_name?.[0]?.toUpperCase() || 'U'}{user?.last_name?.[0]?.toUpperCase() || ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={{ flexDirection: 'row', marginHorizontal: -4 }}
        >
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </MotiView>
      </LinearGradient>

      
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100 }}
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
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
              Quick Actions
            </Text>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              {quickActions.map((action, index) => (
                <QuickActionButton
                  key={index}
                  icon={action.icon}
                  label={action.label}
                  color={action.color}
                  bgColor={action.bgColor}
                  onPress={() => router.push(action.route)}
                />
              ))}
            </View>
          </MotiView>

          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
            style={{ marginTop: 20 }}
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
                  borderRadius: 20,
                  padding: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 4 }}>
                    Create New Content
                  </Text>
                  <Text style={{ fontSize: 14, color: '#A7F3D0' }}>
                    Generate AI-powered posts, images & videos
                  </Text>
                </View>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ionicons name="sparkles" size={24} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>

          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 250 }}
            style={{ marginTop: 20 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                Connected Accounts
              </Text>
              <TouchableOpacity onPress={() => setShowAccountsManager(true)}>
                <Text style={{ fontSize: 14, color: '#235247', fontWeight: '600' }}>Manage</Text>
              </TouchableOpacity>
            </View>

            {loadingAccounts ? (
              <View style={{
                backgroundColor: 'white',
                borderRadius: 20,
                padding: 24,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <ActivityIndicator size="small" color="#0B3D2E" />
                <Text style={{ marginTop: 8, fontSize: 14, color: '#6B7280' }}>Loading accounts...</Text>
              </View>
            ) : connectedAccounts.length === 0 ? (
              <TouchableOpacity
                onPress={() => setShowAccountsManager(true)}
                activeOpacity={0.9}
              >
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 2,
                  borderColor: '#E1306C',
                  borderStyle: 'dashed',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      backgroundColor: '#FFEEF2',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14,
                    }}>
                      <Ionicons name="share-social" size={28} color="#E1306C" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                        Connect Your Accounts
                      </Text>
                      <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                        Link Facebook & Instagram to publish directly from MediaMint
                      </Text>
                    </View>
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: '#E1306C',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Ionicons name="add" size={22} color="white" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={{
                backgroundColor: 'white',
                borderRadius: 20,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                {connectedAccounts.slice(0, 3).map((account, index) => {
                  const platformData = account.platform === 'instagram'
                    ? { color: '#E1306C', bgColor: '#FFEEF2', icon: 'logo-instagram' }
                    : { color: '#1877F2', bgColor: '#E7F3FF', icon: 'logo-facebook' };

                  return (
                    <View
                      key={account.account_id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        borderBottomWidth: index < Math.min(connectedAccounts.length, 3) - 1 ? 1 : 0,
                        borderBottomColor: '#F3F4F6',
                      }}
                    >
                      <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: platformData.bgColor,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}>
                        <Ionicons name={platformData.icon} size={22} color={platformData.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937' }}>
                          {account.username || account.page_name}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>
                          {account.platform === 'instagram' ? 'Instagram' : 'Facebook Page'}
                        </Text>
                      </View>
                      <View style={{
                        backgroundColor: '#D1FAE5',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}>
                        <Text style={{ fontSize: 11, color: '#059669', fontWeight: '600' }}>Connected</Text>
                      </View>
                    </View>
                  );
                })}

                {connectedAccounts.length > 3 && (
                  <TouchableOpacity
                    onPress={() => setShowAccountsManager(true)}
                    style={{ paddingTop: 12, alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 14, color: '#235247', fontWeight: '600' }}>
                      +{connectedAccounts.length - 3} more accounts
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => setShowAccountsManager(true)}
                  style={{
                    marginTop: 12,
                    paddingVertical: 12,
                    borderTopWidth: 1,
                    borderTopColor: '#F3F4F6',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#235247" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 14, color: '#235247', fontWeight: '600' }}>
                    Connect More Accounts
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </MotiView>

          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 350 }}
            style={{ marginTop: 24 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                Recent Activity
              </Text>
              <TouchableOpacity onPress={() => router.push('/activities')}>
                <Text style={{ fontSize: 14, color: '#235247', fontWeight: '600' }}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              paddingHorizontal: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
              minHeight: 100,
              justifyContent: 'center',
            }}>
              {loadingActivities ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#0B3D2E" />
                  <Text style={{ marginTop: 8, fontSize: 14, color: '#6B7280' }}>Loading activities...</Text>
                </View>
              ) : activities.length === 0 ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Ionicons name="time-outline" size={32} color="#D1D5DB" />
                  <Text style={{ marginTop: 8, fontSize: 14, color: '#6B7280' }}>No recent activity</Text>
                  <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Start creating content to see your activity</Text>
                </View>
              ) : (
                activities.map((activity, index) => {
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
                      isLast={index === activities.length - 1}
                    />
                  );
                })
              )}
            </View>
          </MotiView>

        </ScrollView>
      </View>

      
      <SocialAccountsManager
        visible={showAccountsManager}
        onClose={() => setShowAccountsManager(false)}
        onAccountsChanged={loadConnectedAccounts}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary.dark,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.white,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#047857',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.background.white,
    borderRadius: 20,
    padding: 16,
    ...SHADOWS.md,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  createCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.white,
    marginBottom: 4,
  },
  createCardSubtitle: {
    fontSize: 14,
    color: COLORS.primary.mint,
  },
  createCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.primary.lighter,
    fontWeight: '600',
  },
  loadingCard: {
    backgroundColor: COLORS.background.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.text.tertiary,
  },
  emptyAccountsCard: {
    backgroundColor: COLORS.background.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.platform.instagram,
    borderStyle: 'dashed',
    ...SHADOWS.md,
  },
  emptyAccountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyAccountsIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.platform.instagramBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emptyAccountsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  emptyAccountsSubtitle: {
    fontSize: 13,
    color: COLORS.text.tertiary,
    marginTop: 4,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.platform.instagram,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  accountItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ui.borderLight,
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  accountPlatform: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
  connectedBadge: {
    backgroundColor: COLORS.status.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  connectedBadgeText: {
    fontSize: 11,
    color: COLORS.status.successDark,
    fontWeight: '600',
  },
  moreAccountsButton: {
    paddingTop: 12,
    alignItems: 'center',
  },
  connectMoreButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.ui.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCard: {
    backgroundColor: COLORS.background.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    minHeight: 100,
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  emptyActivity: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyActivityText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.text.tertiary,
  },
  emptyActivitySubtext: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 4,
  },
});
