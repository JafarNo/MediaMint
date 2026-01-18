import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deletePost, fetchPosts, updatePost } from '../api/posts';
import PostCard from '../components/PostCard';
import PostDetailModal from '../components/PostDetailModal';
import { STATUS_FILTERS } from '../utils/postHelpers';

const Posts = () => {
  const router = useRouter();
  const { filter } = useLocalSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(filter || 'all');
  const [error, setError] = useState(null);
  
  // Post detail modal state
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Always fetch all posts to have accurate counts
  const loadPosts = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      
      // Always fetch all posts (no status filter)
      const data = await fetchPosts(null);
      setPosts(data || []);
    } catch (err) {
      console.error('Failed to load posts:', err);
      setError('Failed to load posts. Please try again.');
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPosts(false);
  }, [loadPosts]);

  // Filter posts locally based on active filter
  const filteredPosts = activeFilter === 'all' 
    ? posts 
    : posts.filter(p => p.status === activeFilter);

  // Get count for each filter from all posts
  const getFilterCount = (filterId) => {
    if (filterId === 'all') return posts.length;
    return posts.filter(p => p.status === filterId).length;
  };

  // Open post detail modal
  const openPostModal = (post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  // Close post detail modal
  const closePostModal = () => {
    setShowPostModal(false);
    setSelectedPost(null);
  };

  // Delete post
  const handleDeletePost = async () => {
    if (!selectedPost) return;
    
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await deletePost(selectedPost.id);
              setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
              closePostModal();
              Alert.alert('Success', 'Post deleted successfully');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  // Change to draft
  const handleChangeToDraft = async () => {
    if (!selectedPost) return;
    
    try {
      setActionLoading(true);
      await updatePost(selectedPost.id, { status: 'draft', scheduled_at: null });
      setPosts(prev => prev.map(p => 
        p.id === selectedPost.id ? { ...p, status: 'draft', scheduled_at: null } : p
      ));
      closePostModal();
      Alert.alert('Success', 'Post moved to drafts');
    } catch (err) {
      Alert.alert('Error', 'Failed to update post. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reschedule post (called from modal)
  const handleRescheduleFromModal = async (scheduledDateTime) => {
    if (!selectedPost) return;
    
    if (scheduledDateTime <= new Date()) {
      Alert.alert('Error', 'Please select a future date and time');
      return;
    }
    
    try {
      setActionLoading(true);
      await updatePost(selectedPost.id, { 
        status: 'scheduled', 
        scheduled_at: scheduledDateTime.toISOString() 
      });
      setPosts(prev => prev.map(p => 
        p.id === selectedPost.id 
          ? { ...p, status: 'scheduled', scheduled_at: scheduledDateTime.toISOString() } 
          : p
      ));
      closePostModal();
      Alert.alert('Success', `Post rescheduled for ${scheduledDateTime.toLocaleDateString()} at ${scheduledDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to reschedule post. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B3D2E' }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B3D2E" />

      
      <LinearGradient
        colors={['#0B3D2E', '#145A32', '#1a6b3c']}
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>My Posts</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/create')}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 20,
              padding: 10,
            }}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      
      <View className="flex-1 bg-gray-50 rounded-t-3xl -mt-4">
        
        <View className="px-5 pt-6 pb-2">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {STATUS_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setActiveFilter(filter.id)}
                activeOpacity={0.8}
                className={`flex-row items-center px-4 py-2.5 rounded-full ${
                  activeFilter === filter.id ? 'bg-primary' : 'bg-white'
                }`}
              >
                <Ionicons 
                  name={filter.icon} 
                  size={16} 
                  color={activeFilter === filter.id ? 'white' : filter.color} 
                />
                <Text 
                  className={`ml-2 font-semibold text-sm ${
                    activeFilter === filter.id ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {filter.label}
                </Text>
                <View 
                  className={`ml-2 px-2 py-0.5 rounded-full ${
                    activeFilter === filter.id ? 'bg-white/20' : 'bg-gray-100'
                  }`}
                >
                  <Text 
                    className={`text-xs font-bold ${
                      activeFilter === filter.id ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {getFilterCount(filter.id)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0B3D2E" />
          }
        >
          {loading ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color="#0B3D2E" />
              <Text className="text-gray-500 mt-4">Loading posts...</Text>
            </View>
          ) : error ? (
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="items-center py-20"
            >
              <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
                <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
              </View>
              <Text className="text-gray-800 font-semibold text-lg mb-2">Error</Text>
              <Text className="text-gray-500 text-center mb-4">{error}</Text>
              <TouchableOpacity
                onPress={() => loadPosts()}
                className="bg-primary px-6 py-3 rounded-full"
              >
                <Text className="text-white font-semibold">Try Again</Text>
              </TouchableOpacity>
            </MotiView>
          ) : filteredPosts.length === 0 ? (
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="items-center py-20"
            >
              <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                <Ionicons name="document-text-outline" size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-800 font-semibold text-lg mb-2">No Posts Yet</Text>
              <Text className="text-gray-500 text-center mb-6">
                {activeFilter === 'all' 
                  ? "Create your first post to get started!"
                  : `No ${activeFilter} posts found.`}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/create')}
                className="bg-primary px-6 py-3 rounded-full flex-row items-center"
              >
                <Ionicons name="add" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Create Post</Text>
              </TouchableOpacity>
            </MotiView>
          ) : (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400 }}
            >
              {filteredPosts.map((post, index) => (
                <MotiView
                  key={post.id || index}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                >
                  <PostCard 
                    post={post} 
                    onPress={() => openPostModal(post)} 
                  />
                </MotiView>
              ))}
            </MotiView>
          )}
        </ScrollView>
      </View>

      
      <PostDetailModal
        visible={showPostModal}
        post={selectedPost}
        onClose={closePostModal}
        onDelete={handleDeletePost}
        onChangeToDraft={handleChangeToDraft}
        onReschedule={handleRescheduleFromModal}
        actionLoading={actionLoading}
      />
    </SafeAreaView>
  );
};

export default Posts;
