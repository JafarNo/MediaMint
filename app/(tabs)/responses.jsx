import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { MotiView } from 'moti';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchPosts } from '../../api/posts';
import {
  getAutoresponderSettings,
  getCommentThreads,
  getConnectedAccounts,
  getPostComments,
  saveAutoresponderSettings
} from '../../api/social';
import CustomSwitch from '../../components/CustomSwitch';
import SentimentAnalysisCard from '../../components/SentimentAnalysisCard';

// Platform styling data
const PLATFORM_STYLES = {
  instagram: { name: 'Instagram', icon: 'logo-instagram', color: '#E1306C', bgColor: '#FFEEF2' },
  facebook: { name: 'Facebook', icon: 'logo-facebook', color: '#1877F2', bgColor: '#E7F3FF' },
};


// AI Response Tones
const AI_TONES = [
  { id: 'friendly', label: 'Friendly', icon: 'happy-outline', description: 'Warm and approachable' },
  { id: 'professional', label: 'Professional', icon: 'briefcase-outline', description: 'Formal and business-like' },
  { id: 'casual', label: 'Casual', icon: 'cafe-outline', description: 'Relaxed and informal' },
  { id: 'enthusiastic', label: 'Enthusiastic', icon: 'rocket-outline', description: 'Excited and energetic' },
];

const StepIndicator = ({ currentStep, totalSteps }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
    {Array.from({ length: totalSteps }, (_, i) => (
      <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: i + 1 <= currentStep ? '#0B3D2E' : '#E5E7EB',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {i + 1 < currentStep ? (
            <Ionicons name="checkmark" size={16} color="white" />
          ) : (
            <Text style={{ fontSize: 12, fontWeight: '600', color: i + 1 <= currentStep ? 'white' : '#9CA3AF' }}>
              {i + 1}
            </Text>
          )}
        </View>
        {i < totalSteps - 1 && (
          <View style={{
            width: 40,
            height: 2,
            backgroundColor: i + 1 < currentStep ? '#0B3D2E' : '#E5E7EB',
            marginHorizontal: 4,
          }} />
        )}
      </View>
    ))}
  </View>
);

const PlatformCard = ({ platform, selected, onPress, disabled }) => (
  <TouchableOpacity
    onPress={disabled ? null : onPress}
    activeOpacity={disabled ? 1 : 0.8}
    style={{
      flex: 1,
      backgroundColor: disabled ? '#FAFAFA' : selected ? platform.bgColor : 'white',
      borderRadius: 16,
      padding: 12,
      marginHorizontal: 4,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: disabled ? '#F3F4F6' : selected ? platform.color : '#E5E7EB',
      opacity: disabled ? 0.6 : 1,
      minWidth: 70,
    }}
  >
    <View style={{
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: disabled ? '#F3F4F6' : selected ? 'white' : platform.bgColor,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    }}>
      <Ionicons name={platform.icon} size={20} color={disabled ? '#D1D5DB' : platform.color} />
    </View>
    <Text style={{ fontSize: 10, fontWeight: '600', color: disabled ? '#9CA3AF' : selected ? platform.color : '#6B7280' }}>
      {platform.name}
    </Text>
    {disabled && (
      <Text style={{ fontSize: 8, color: '#9CA3AF', marginTop: 2 }}>Soon</Text>
    )}
    {selected && !disabled && (
      <View style={{
        position: 'absolute',
        top: 6,
        right: 6,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Ionicons name="checkmark" size={10} color="white" />
      </View>
    )}
  </TouchableOpacity>
);

const PostCard = ({ post, selected, onPress, onSettingsPress }) => {
  const imageUrl = post.media_url || post.media_base64;
  const caption = post.caption || post.prompt || 'No caption';
  const dateStr = post.created_at
    ? new Date(post.created_at).toLocaleDateString()
    : 'Unknown date';

  return (
    <View style={{
      backgroundColor: 'white',
      borderRadius: 16,
      marginBottom: 12,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: selected ? '#0B3D2E' : '#E5E7EB',
    }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', padding: 12 }}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: 80, height: 80, borderRadius: 12 }}
            />
          ) : (
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 12,
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons
                name={post.media_type === 'video' ? 'videocam' : 'image'}
                size={28}
                color="#9CA3AF"
              />
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 4 }} numberOfLines={2}>
              {caption}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }}>
                {dateStr}
              </Text>
            </View>
            {post.platforms && post.platforms.length > 0 && (
              <View style={{ flexDirection: 'row', marginTop: 4 }}>
                {post.platforms.map((platform, idx) => (
                  <Ionicons
                    key={idx}
                    name={`logo-${platform}`}
                    size={14}
                    color={platform === 'instagram' ? '#E1306C' : '#1877F2'}
                    style={{ marginRight: 6 }}
                  />
                ))}
              </View>
            )}
          </View>
          {selected && (
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#10B981',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
            }}>
              <Ionicons name="checkmark" size={14} color="white" />
            </View>
          )}
        </View>
      </TouchableOpacity>


      {onSettingsPress && (
        <TouchableOpacity
          onPress={() => onSettingsPress(post)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            backgroundColor: '#F9FAFB',
          }}
        >
          <Ionicons name="settings-outline" size={16} color="#0B3D2E" />
          <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '500', color: '#0B3D2E' }}>
            Autoresponder Settings
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};


const Responses = () => {
  // Autoresponder state
  const [autoresponderEnabled, setAutoresponderEnabled] = useState(false);

  // Step flow state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedTone, setSelectedTone] = useState('friendly');
  const [aiInstructions, setAiInstructions] = useState('');
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Posts state
  const [allPosts, setAllPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [postsOffset, setPostsOffset] = useState(0);
  const POSTS_PER_PAGE = 15;

  // Comments state
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [isReplying, setIsReplying] = useState(false);

  // Post settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsPost, setSettingsPost] = useState(null);
  const [postSettings, setPostSettings] = useState({
    enabled: false,
    tone: 'friendly',
    custom_instructions: '',
    response_delay_seconds: 30
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [commentThreads, setCommentThreads] = useState([]);
  const [settingsComments, setSettingsComments] = useState([]); // Comments for sentiment analysis in modal

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadPosts(),
      loadAccounts()
    ]);
    setRefreshing(false);
  }, []);

  // Load posts and accounts on mount
  // Load posts and accounts on focus
  useFocusEffect(
    useCallback(() => {
      loadPosts();
      loadAccounts();
    }, [])
  );

  // Load comments when post is selected
  useEffect(() => {
    if (selectedPost && selectedPlatform) {
      loadComments();
    }
  }, [selectedPost, selectedPlatform]);

  const loadAccounts = async () => {
    try {
      const accounts = await getConnectedAccounts();
      setConnectedAccounts(accounts || []);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const loadComments = async () => {
    if (!selectedPost || !selectedPlatform) return;

    // Find the connected account for this platform
    const account = connectedAccounts.find(a => a.platform === selectedPlatform);
    if (!account) {
      setComments([]);
      return;
    }

    // Get the social media post ID from the post
    const socialPostId = selectedPost.social_post_ids?.[selectedPlatform];
    if (!socialPostId) {
      setComments([]);
      return;
    }

    try {
      setLoadingComments(true);
      const fetchedComments = await getPostComments(account.account_id, socialPostId, selectedPlatform);
      setComments(fetchedComments || []);
    } catch (err) {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadPosts = async (reset = true) => {
    try {
      if (reset) {
        setLoadingPosts(true);
        setPostsOffset(0);
      } else {
        setLoadingMorePosts(true);
      }

      const offset = reset ? 0 : postsOffset;
      // Fetch published posts with limit and offset, sorted by newest first
      const posts = await fetchPosts('published', POSTS_PER_PAGE, offset);

      // Sort by created_at descending (newest first)
      const sortedPosts = (posts || []).sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });

      if (reset) {
        setAllPosts(sortedPosts);
      } else {
        setAllPosts(prev => [...prev, ...sortedPosts]);
      }

      // Check if there are more posts to load
      setHasMorePosts(sortedPosts.length === POSTS_PER_PAGE);
      setPostsOffset(offset + sortedPosts.length);

    } catch (err) {
      console.error('Failed to load posts:', err);
      if (reset) setAllPosts([]);
    } finally {
      setLoadingPosts(false);
      setLoadingMorePosts(false);
    }
  };

  const loadMorePosts = () => {
    if (!loadingMorePosts && hasMorePosts) {
      loadPosts(false);
    }
  };

  // Get posts for selected platform 
  // Facebook selection shows only Facebook posts, Instagram shows only Instagram posts
  const platformPosts = selectedPlatform
    ? allPosts.filter(post => post.platforms?.includes(selectedPlatform))
    : allPosts;

  // Reset flow
  const resetFlow = () => {
    setCurrentStep(1);
    setSelectedPlatform(null);
    setSelectedPost(null);
    setSelectedTone('friendly');
    setAiInstructions('');
    setGeneratedResponse('');
    setSelectedComment(null);
    setComments([]);
  };

  // Handle platform selection
  const handlePlatformSelect = (platformId) => {
    setSelectedPlatform(platformId);
    setSelectedPost(null);
    setSelectedComment(null);
    setComments([]);
    setCurrentStep(2);
  };

  // Handle post selection
  const handlePostSelect = (post) => {
    setSelectedPost(post);
    setSelectedComment(null);
    setCurrentStep(3);
  };


  // Open post settings modal
  const openPostSettings = async (post) => {
    setSettingsPost(post);
    setShowSettingsModal(true);
    setLoadingSettings(true);
    setSettingsComments([]); // Reset previous comments

    try {
      const settings = await getAutoresponderSettings(post.id);
      setPostSettings({
        enabled: settings.enabled || false,
        tone: settings.tone || 'friendly',
        custom_instructions: settings.custom_instructions || '',
        response_delay_seconds: settings.response_delay_seconds || 30
      });

      // Also load comment threads
      const threads = await getCommentThreads(post.id);
      setCommentThreads(threads || []);

      // Fetch comments for Sentiment Analysis
      const account = connectedAccounts.find(a => post.platforms?.includes(a.platform));
      if (account) {
        const socialPostId = post.social_post_ids?.[account.platform];
        if (socialPostId) {
          const fetchedComments = await getPostComments(account.account_id, socialPostId, account.platform);
          setSettingsComments(fetchedComments || []);
        }
      }

    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Save post autoresponder settings
  const handleSaveSettings = async () => {
    if (!settingsPost) return;

    setSavingSettings(true);
    try {
      await saveAutoresponderSettings(settingsPost.id, postSettings);
      setShowSettingsModal(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B3D2E' }} edges={['top']}>
      <StatusBar barStyle="light-content" />


      <LinearGradient
        colors={['#0B3D2E', '#145A32', '#1a6b3c']}
        style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>AI Responses</Text>
            <Text style={{ fontSize: 13, color: '#A7F3D0', marginTop: 2 }}>
              {currentStep === 1 ? 'Select a platform' :
                currentStep === 2 ? 'Choose a post' :
                  'Configure AI response'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            {currentStep > 1 && (
              <TouchableOpacity
                onPress={resetFlow}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="refresh-outline" size={22} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>

      </LinearGradient>


      <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
            transition={{ type: 'timing', duration: 400 }}
          >
            <StepIndicator currentStep={currentStep} totalSteps={3} />
          </MotiView>


          {currentStep >= 1 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 100 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: currentStep > 1 ? '#10B981' : '#E0FAFA',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}>
                  {currentStep > 1 ? (
                    <Ionicons name="checkmark" size={14} color="white" />
                  ) : (
                    <Ionicons name="apps-outline" size={14} color="#0B3D2E" />
                  )}
                </View>
                <Text style={{ fontSize: 17, fontWeight: '600', color: '#1F2937' }}>Select Platform</Text>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 24 }}>
                {connectedAccounts.length === 0 ? (
                  <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center', marginHorizontal: 4 }}>
                    <Ionicons name="link-outline" size={40} color="#D1D5DB" />
                    <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 12, textAlign: 'center' }}>No connected accounts</Text>
                    <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>Connect your social accounts in Profile to use autoresponder</Text>
                  </View>
                ) : (
                  connectedAccounts.map((account) => {
                    const platformStyle = PLATFORM_STYLES[account.platform] || { name: account.platform, icon: 'globe-outline', color: '#6B7280', bgColor: '#F3F4F6' };
                    return (
                      <PlatformCard
                        key={account.account_id}
                        platform={{ id: account.platform, ...platformStyle, enabled: true }}
                        selected={selectedPlatform === account.platform}
                        disabled={false}
                        onPress={() => handlePlatformSelect(account.platform)}
                      />
                    );
                  })
                )}
              </View>
            </MotiView>
          )}


          {currentStep >= 2 && selectedPlatform && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: currentStep > 2 ? '#10B981' : '#E0FAFA',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}>
                  {currentStep > 2 ? (
                    <Ionicons name="checkmark" size={14} color="white" />
                  ) : (
                    <Ionicons name="images-outline" size={14} color="#0B3D2E" />
                  )}
                </View>
                <Text style={{ fontSize: 17, fontWeight: '600', color: '#1F2937' }}>Select Post</Text>
                <View style={{
                  marginLeft: 8,
                  backgroundColor: '#E0FAFA',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}>
                  <Text style={{ fontSize: 11, color: '#0B3D2E', fontWeight: '500' }}>
                    {platformPosts.length} posts
                  </Text>
                </View>
              </View>

              {loadingPosts ? (
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 24,
                  alignItems: 'center',
                  marginBottom: 24,
                }}>
                  <ActivityIndicator size="small" color="#0B3D2E" />
                  <Text style={{ fontSize: 15, color: '#6B7280', marginTop: 12 }}>Loading posts...</Text>
                </View>
              ) : platformPosts.length === 0 ? (
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 24,
                  alignItems: 'center',
                  marginBottom: 24,
                }}>
                  <Ionicons name="images-outline" size={48} color="#D1D5DB" />
                  <Text style={{ fontSize: 15, color: '#6B7280', marginTop: 12 }}>No published posts found for this platform</Text>
                  <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>Create and publish posts to see them here</Text>
                </View>
              ) : (
                <View style={{ marginBottom: 24 }}>
                  {platformPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      selected={selectedPost?.id === post.id}
                      onSettingsPress={openPostSettings}
                      onPress={() => handlePostSelect(post)}
                    />
                  ))}


                  {hasMorePosts && (
                    <TouchableOpacity
                      onPress={loadMorePosts}
                      disabled={loadingMorePosts}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: 12,
                        paddingVertical: 14,
                        alignItems: 'center',
                        marginTop: 8,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                      }}
                    >
                      {loadingMorePosts ? (
                        <ActivityIndicator size="small" color="#0B3D2E" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="chevron-down" size={18} color="#0B3D2E" />
                          <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#0B3D2E' }}>
                            Load More Posts
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </MotiView>
          )}

        </ScrollView>
      </View>


      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              backgroundColor: 'white',
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB',
            }}>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Text style={{ fontSize: 16, color: '#6B7280' }}>Cancel</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#1F2937' }}>
                Autoresponder Settings
              </Text>
              <TouchableOpacity onPress={handleSaveSettings} disabled={savingSettings}>
                {savingSettings ? (
                  <ActivityIndicator size="small" color="#0B3D2E" />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#0B3D2E' }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            {loadingSettings ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#0B3D2E" />
                <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading settings...</Text>
              </View>
            ) : (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>

                {settingsPost && (
                  <View style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    {settingsPost.media_url && (
                      <Image
                        source={{ uri: settingsPost.media_url }}
                        style={{ width: 60, height: 60, borderRadius: 8, marginRight: 12 }}
                      />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }} numberOfLines={2}>
                        {settingsPost.caption || 'No caption'}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                        {settingsPost.platforms?.join(', ')}
                      </Text>
                    </View>
                  </View>
                )}


                <View style={{ marginBottom: 20 }}>
                  <SentimentAnalysisCard
                    postId={settingsPost?.id}
                    comments={settingsComments}
                  />
                </View>


                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                        Enable Auto-Response
                      </Text>
                      <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                        Automatically respond to new comments on this post
                      </Text>
                    </View>
                    <CustomSwitch
                      value={postSettings.enabled}
                      onValueChange={(value) => setPostSettings(prev => ({ ...prev, enabled: value }))}
                    />
                  </View>
                </View>


                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 }}>
                    Response Tone
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                    {AI_TONES.map((tone) => (
                      <TouchableOpacity
                        key={tone.id}
                        onPress={() => setPostSettings(prev => ({ ...prev, tone: tone.id }))}
                        style={{
                          width: '48%',
                          margin: '1%',
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: postSettings.tone === tone.id ? '#0B3D2E' : '#E5E7EB',
                          backgroundColor: postSettings.tone === tone.id ? '#E0FAFA' : 'white',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons
                            name={tone.icon}
                            size={18}
                            color={postSettings.tone === tone.id ? '#0B3D2E' : '#6B7280'}
                          />
                          <Text style={{
                            marginLeft: 8,
                            fontSize: 14,
                            fontWeight: '500',
                            color: postSettings.tone === tone.id ? '#0B3D2E' : '#374151'
                          }}>
                            {tone.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>


                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
                    Custom Instructions
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
                    Add specific instructions for how the AI should respond to comments on this post
                  </Text>
                  <TextInput
                    value={postSettings.custom_instructions}
                    onChangeText={(text) => setPostSettings(prev => ({ ...prev, custom_instructions: text }))}
                    placeholder="E.g., Always mention our 20% discount code SAVE20, thank them for their interest..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: 12,
                      padding: 14,
                      fontSize: 14,
                      color: '#1F2937',
                      minHeight: 100,
                      textAlignVertical: 'top',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                    }}
                  />
                </View>


                {commentThreads.length > 0 && (
                  <View style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 }}>
                      Auto-Response History ({commentThreads.length})
                    </Text>
                    {commentThreads.slice(0, 5).map((thread, index) => (
                      <View
                        key={thread.id || index}
                        style={{
                          paddingVertical: 12,
                          borderTopWidth: index > 0 ? 1 : 0,
                          borderTopColor: '#E5E7EB',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                          <View style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: '#E0FAFA',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 10,
                          }}>
                            <Ionicons name="chatbubble" size={14} color="#0B3D2E" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, color: '#6B7280' }}>
                              {thread.commenter_name || 'User'}
                            </Text>
                            <Text style={{ fontSize: 14, color: '#1F2937', marginTop: 2 }}>
                              &quot;{thread.comment_text}&quot;
                            </Text>
                            <View style={{
                              backgroundColor: '#E0FAFA',
                              padding: 10,
                              borderRadius: 8,
                              marginTop: 8
                            }}>
                              <Text style={{ fontSize: 13, color: '#0B3D2E' }}>
                                ↳ {thread.response_text}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default Responses;
