import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deletePost } from '../api/posts';
import '../global.css';

const getStatusColor = (status) => {
  switch (status) {
    case 'draft':
      return { bg: '#FEF3C7', text: '#D97706', icon: 'document-outline' };
    case 'scheduled':
      return { bg: '#DBEAFE', text: '#2563EB', icon: 'calendar-outline' };
    case 'published':
      return { bg: '#D1FAE5', text: '#059669', icon: 'checkmark-circle-outline' };
    case 'failed':
      return { bg: '#FEE2E2', text: '#DC2626', icon: 'alert-circle-outline' };
    default:
      return { bg: '#F3F4F6', text: '#6B7280', icon: 'help-outline' };
  }
};

const Scheduled = () => {
  const { item } = useLocalSearchParams();

  // Video playback state
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Early return if no item
  if (!item) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Invalid scheduled item</Text>
      </View>
    );
  }

  const parsedItem = JSON.parse(item);

  // Decode URLs if they were encoded to preserve AWS signatures
  const getMediaUrl = () => {
    let url = parsedItem.media_url || parsedItem.content || parsedItem.mediaUrl;

    if (!url || url.length === 0) {
      return null;
    }

    // If URLs were encoded, decode them
    if (parsedItem._urlsEncoded) {
      try {
        url = decodeURIComponent(url);
      } catch (e) {
        // Failed to decode URL
      }
    }

    return url;
  };

  const mediaUrl = getMediaUrl();
  const mediaType = parsedItem.contentType || parsedItem.media_type || 'image';
  const statusStyle = getStatusColor(parsedItem.status);

  const handlePlayVideo = async () => {
    setShowVideo(true);
    setIsPlaying(true);
  };

  const handleDelete = async () => {
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
              await deletePost(parsedItem.id);
              Alert.alert('Success', 'Post deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete post. Please try again.');
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B3D2E' }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B3D2E" />
      <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }} showsVerticalScrollIndicator={false}>

        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#0B3D2E' }}>
          <Text style={{ fontSize: 20, fontWeight: '600', color: 'white' }}>
            {parsedItem.title || `${parsedItem.platform || ''} ${mediaType}`}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#A7F3D0', fontWeight: '500', fontSize: 16 }}>Back</Text>
          </TouchableOpacity>
        </View>

        
        <View style={{ paddingHorizontal: 20, marginBottom: 16, marginTop: 16 }}>
          <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {mediaUrl ? (
              mediaType === 'video' ? (
                <View className="w-full aspect-video bg-gray-900">
                  {showVideo ? (
                    <Video
                      ref={videoRef}
                      source={{ uri: mediaUrl }}
                      style={{ width: '100%', height: '100%' }}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={isPlaying}
                      isLooping={false}
                      onPlaybackStatusUpdate={(status) => {
                        if (status.didJustFinish) {
                          setIsPlaying(false);
                        }
                      }}
                    />
                  ) : (
                    <TouchableOpacity
                      onPress={handlePlayVideo}
                      className="w-full h-full items-center justify-center"
                      activeOpacity={0.8}
                    >
                      <View className="bg-black/30 absolute inset-0" />
                      <View className="bg-white/90 rounded-full p-5">
                        <Ionicons name="play" size={40} color="#0B3D2E" />
                      </View>
                      <Text className="text-white text-sm mt-3 font-medium">Tap to play video</Text>
                    </TouchableOpacity>
                  )}
                  
                  <View className="absolute top-3 left-3 bg-black/60 rounded-full px-3 py-1 flex-row items-center">
                    <Ionicons name="videocam" size={14} color="white" />
                    <Text className="text-white text-xs ml-1.5 font-medium">Video</Text>
                  </View>
                </View>
              ) : (
                <Image
                  source={{ uri: mediaUrl }}
                  style={{ width: '100%', height: 300 }}
                  resizeMode="cover"
                />
              )
            ) : (
              <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons
                  name={mediaType === 'video' ? 'videocam' : 'image'}
                  size={64}
                  color="#9CA3AF"
                />
                <Text style={{ color: '#9CA3AF', marginTop: 8 }}>No media available</Text>
                <Text style={{ color: '#D1D5DB', fontSize: 10, marginTop: 4, paddingHorizontal: 20, textAlign: 'center' }}>
                  {parsedItem.content ? `content: ${parsedItem.content.substring(0, 30)}...` : 'content: null'}
                </Text>
                <Text style={{ color: '#D1D5DB', fontSize: 10, paddingHorizontal: 20, textAlign: 'center' }}>
                  {parsedItem.media_url ? `media_url: ${parsedItem.media_url.substring(0, 30)}...` : 'media_url: null'}
                </Text>
              </View>
            )}
          </View>
        </View>

        
        <View className="px-5 mb-4">
          <View className="flex-row items-center">
            <View
              className="flex-row items-center px-3 py-1.5 rounded-full"
              style={{ backgroundColor: statusStyle.bg }}
            >
              <Ionicons name={statusStyle.icon} size={14} color={statusStyle.text} />
              <Text style={{ color: statusStyle.text, fontWeight: '600', fontSize: 12, marginLeft: 6, textTransform: 'uppercase' }}>
                {parsedItem.status}
              </Text>
            </View>
          </View>
        </View>

        
        <View className="px-5 mb-4">
          <View className="bg-white p-4 rounded-2xl shadow-sm">
            
            <View className="flex-row items-center py-2 border-b border-gray-100">
              <Ionicons name="document-outline" size={18} color="#6B7280" />
              <Text className="text-sm text-gray-500 ml-3 flex-1">Type</Text>
              <Text className="text-sm font-medium text-gray-800 capitalize">
                {parsedItem.type || mediaType}
              </Text>
            </View>

            
            <View className="flex-row items-center py-2 border-b border-gray-100">
              <Ionicons
                name={`logo-${parsedItem.platform?.toLowerCase() || 'globe'}`}
                size={18}
                color={parsedItem.platform?.toLowerCase() === 'instagram' ? '#E1306C' : '#1877F2'}
              />
              <Text className="text-sm text-gray-500 ml-3 flex-1">Platform</Text>
              <Text className="text-sm font-medium text-gray-800 capitalize">
                {parsedItem.platform || '-'}
              </Text>
            </View>

            
            <View className="flex-row items-center py-2 border-b border-gray-100">
              <Ionicons name="time-outline" size={18} color="#3B82F6" />
              <Text className="text-sm text-gray-500 ml-3 flex-1">Scheduled Time</Text>
              <Text className="text-sm font-medium text-blue-600">
                {parsedItem.time || '-'}
              </Text>
            </View>

            
            {parsedItem.date && (
              <View className="flex-row items-center py-2 border-b border-gray-100">
                <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                <Text className="text-sm text-gray-500 ml-3 flex-1">Date</Text>
                <Text className="text-sm font-medium text-gray-800">
                  {parsedItem.date}
                </Text>
              </View>
            )}

            
            <View className="flex-row items-center py-2">
              <Ionicons name="image-outline" size={18} color="#6B7280" />
              <Text className="text-sm text-gray-500 ml-3 flex-1">Media Type</Text>
              <Text className="text-sm font-medium text-gray-800 capitalize">
                {mediaType}
              </Text>
            </View>
          </View>
        </View>

        
        {parsedItem.caption && (
          <View className="px-5 mb-4">
            <View className="bg-white p-4 rounded-2xl shadow-sm">
              <Text className="text-xs font-semibold text-gray-400 uppercase mb-2">Caption</Text>
              <Text className="text-base text-gray-800 leading-6">
                {parsedItem.caption}
              </Text>
            </View>
          </View>
        )}

        
        {parsedItem.status === 'failed' && parsedItem.error_message && (
          <View className="px-5 mb-4">
            <View className="bg-red-50 p-4 rounded-2xl border border-red-200">
              <View className="flex-row items-center mb-2">
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text className="text-sm font-semibold text-red-600 ml-2">Error</Text>
              </View>
              <Text className="text-sm text-red-600">{parsedItem.error_message}</Text>
            </View>
          </View>
        )}

        
        <View className="px-5 mb-8">
          <TouchableOpacity
            onPress={handleDelete}
            disabled={actionLoading}
            className="flex-row items-center bg-red-50 p-4 rounded-xl border border-red-100"
          >
            <View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center mr-4">
              {actionLoading ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Ionicons name="trash-outline" size={24} color="#DC2626" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">Delete Post</Text>
              <Text className="text-sm text-gray-500">Permanently remove this post</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default Scheduled;
