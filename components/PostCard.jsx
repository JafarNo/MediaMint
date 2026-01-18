import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { getStatusColor } from '../utils/postHelpers';

/**
 * Post Card Component
 * Displays a post preview in a list
 */
export default function PostCard({ post, onPress }) {
  const statusStyle = getStatusColor(post.status);
  const hasMedia = post.media_url || post.media_base64;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm"
    >
      <View className="flex-row p-4">
        {/* Media Preview */}
        <View className="w-20 h-20 rounded-xl bg-gray-100 mr-4 overflow-hidden">
          {hasMedia ? (
            <Image
              source={{ uri: post.media_url || post.media_base64 }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons
                name={post.media_type === 'video' ? 'videocam' : post.media_type === 'story' ? 'book' : 'image'}
                size={28}
                color="#9CA3AF"
              />
            </View>
          )}
          {post.media_type === 'video' && (
            <View className="absolute bottom-1 right-1 bg-black/60 rounded px-1.5 py-0.5">
              <Ionicons name="play" size={10} color="white" />
            </View>
          )}
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            {/* Status Badge */}
            <View
              className="flex-row items-center px-2.5 py-1 rounded-full mr-2"
              style={{ backgroundColor: statusStyle.bg }}
            >
              <Ionicons name={statusStyle.icon} size={12} color={statusStyle.text} />
              <Text className="text-xs font-semibold ml-1 capitalize" style={{ color: statusStyle.text }}>
                {post.status}
              </Text>
            </View>

            {/* Platform Icons */}
            <View className="flex-row">
              {post.platforms?.map((platform, idx) => (
                <View key={idx} className="w-5 h-5 rounded-full bg-gray-100 items-center justify-center -ml-1 first:ml-0">
                  <Ionicons
                    name={`logo-${platform}`}
                    size={10}
                    color={platform === 'instagram' ? '#E1306C' : '#1877F2'}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Caption Preview */}
          <Text className="text-sm text-gray-800 font-medium" numberOfLines={2}>
            {post.caption || post.prompt || 'No caption'}
          </Text>

          {/* Date */}
          <Text className="text-xs text-gray-400 mt-2">
            {post.status === 'scheduled' && post.scheduled_at
              ? `Scheduled: ${new Date(post.scheduled_at).toLocaleDateString()} at ${new Date(post.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : post.created_at
              ? new Date(post.created_at).toLocaleDateString()
              : 'Unknown date'}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" style={{ alignSelf: 'center' }} />
      </View>
    </TouchableOpacity>
  );
}
