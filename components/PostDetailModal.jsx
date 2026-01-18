import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getConnectedAccounts, getPostComments } from '../api/social';
import { getStatusColor } from '../utils/postHelpers';
import CustomSpinnerDatePicker from './DatePicker';
import SentimentAnalysisCard from './SentimentAnalysisCard';
import TimePicker from './TimePicker';

/**
 * Post Detail Modal Component
 * Displays full post details with actions
 */
export default function PostDetailModal({
  visible,
  post,
  onClose,
  onDelete,
  onChangeToDraft,
  onReschedule,
  actionLoading = false,
}) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [newScheduledDate, setNewScheduledDate] = useState(
    post?.scheduled_at ? new Date(post.scheduled_at) : new Date()
  );
  const [newScheduledTime, setNewScheduledTime] = useState(
    post?.scheduled_at ? new Date(post.scheduled_at) : new Date()
  );

  // Comment fetching state
  const [fetchedComments, setFetchedComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (visible && post?.status === 'published') {
      fetchComments();
    }
  }, [visible, post]);

  const fetchComments = async () => {
    // If we already have comments passed in props, maybe valid, but let's fetch fresh
    setLoadingComments(true);
    try {
      const accounts = await getConnectedAccounts();
      const account = accounts.find(a => post.platforms?.includes(a.platform) || a.platform === post.platform);

      if (account && post.social_post_ids?.[account.platform]) {
        const socialId = post.social_post_ids[account.platform];
        const comments = await getPostComments(account.account_id, socialId, account.platform);
        setFetchedComments(comments || []);
      } else {
        // If manual post or no link, fallback to props or empty
        setFetchedComments(post.comments || []);
      }
    } catch (err) {
      console.error("Failed to fetch comments for modal:", err);
      setFetchedComments(post.comments || []);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleRescheduleConfirm = () => {
    const scheduledDateTime = new Date(newScheduledDate);
    scheduledDateTime.setHours(newScheduledTime.getHours());
    scheduledDateTime.setMinutes(newScheduledTime.getMinutes());
    scheduledDateTime.setSeconds(0);
    onReschedule(scheduledDateTime);
    setShowReschedule(false);
  };

  const handleClose = () => {
    setShowReschedule(false);
    onClose();
  };

  if (!post) return null;

  const statusStyle = getStatusColor(post.status);
  const comments = fetchedComments.length > 0 ? fetchedComments : (post.comments || []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10 max-h-[90%]">
          {/* Modal Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">Post Details</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Large Media Preview */}
            <View className="rounded-2xl overflow-hidden mb-4 bg-gray-100">
              {(post.media_url || post.media_base64) ? (
                post.media_type === 'video' ? (
                  <View className="w-full aspect-video bg-gray-900 items-center justify-center">
                    <Image
                      source={{ uri: post.media_url || post.media_base64 }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <View className="absolute bg-black/50 rounded-full p-4">
                      <Ionicons name="play" size={32} color="white" />
                    </View>
                    <View className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-1 flex-row items-center">
                      <Ionicons name="videocam" size={12} color="white" />
                      <Text className="text-white text-xs ml-1">Video</Text>
                    </View>
                  </View>
                ) : (
                  <Image
                    source={{ uri: post.media_url || post.media_base64 }}
                    className="w-full aspect-square"
                    resizeMode="cover"
                  />
                )
              ) : (
                <View className="w-full aspect-square items-center justify-center bg-gray-100">
                  <Ionicons
                    name={post.media_type === 'video' ? 'videocam' : 'image'}
                    size={64}
                    color="#9CA3AF"
                  />
                  <Text className="text-gray-400 mt-2">No media available</Text>
                </View>
              )}
            </View>

            {/* Status & Platforms Row */}
            <View className="flex-row items-center justify-between mb-4">
              <View
                className="flex-row items-center px-3 py-1.5 rounded-full"
                style={{ backgroundColor: statusStyle.bg }}
              >
                <Ionicons name={statusStyle.icon} size={14} color={statusStyle.text} />
                <Text
                  className="text-sm font-semibold ml-1.5 capitalize"
                  style={{ color: statusStyle.text }}
                >
                  {post.status}
                </Text>
              </View>

              <View className="flex-row items-center">
                {post.platforms?.map((platform, idx) => (
                  <View
                    key={idx}
                    className="w-8 h-8 rounded-full items-center justify-center -ml-2 first:ml-0 border-2 border-white"
                    style={{ backgroundColor: platform === 'instagram' ? '#FFEEF2' : '#E7F3FF' }}
                  >
                    <Ionicons
                      name={`logo-${platform}`}
                      size={14}
                      color={platform === 'instagram' ? '#E1306C' : '#1877F2'}
                    />
                  </View>
                ))}
                {post.platforms?.length > 0 && (
                  <Text className="text-xs text-gray-500 ml-2">
                    {post.platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}
                  </Text>
                )}
              </View>
            </View>

            {/* Caption */}
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <Text className="text-xs font-semibold text-gray-400 uppercase mb-2">Caption</Text>
              <Text className="text-base text-gray-800 leading-6">
                {post.caption || post.prompt || 'No caption provided'}
              </Text>
            </View>

            {/* Post Details Grid */}
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <Text className="text-xs font-semibold text-gray-400 uppercase mb-3">Post Information</Text>

              <View className="flex-row items-center py-2 border-b border-gray-200">
                <Ionicons name="image-outline" size={18} color="#6B7280" />
                <Text className="text-sm text-gray-500 ml-3 flex-1">Media Type</Text>
                <Text className="text-sm font-medium text-gray-800 capitalize">
                  {post.media_type || 'Image'}
                </Text>
              </View>

              {post.content_source && (
                <View className="flex-row items-center py-2 border-b border-gray-200">
                  <Ionicons name="sparkles-outline" size={18} color="#6B7280" />
                  <Text className="text-sm text-gray-500 ml-3 flex-1">Source</Text>
                  <Text className="text-sm font-medium text-gray-800 capitalize">
                    {post.content_source === 'ai' ? 'AI Generated' : 'Uploaded'}
                  </Text>
                </View>
              )}

              {post.scheduled_at && (
                <View className="flex-row items-center py-2 border-b border-gray-200">
                  <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
                  <Text className="text-sm text-gray-500 ml-3 flex-1">Scheduled For</Text>
                  <Text className="text-sm font-medium text-blue-600">
                    {new Date(post.scheduled_at).toLocaleDateString()} at{' '}
                    {new Date(post.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              )}

              <View className="flex-row items-center py-2">
                <Ionicons name="time-outline" size={18} color="#6B7280" />
                <Text className="text-sm text-gray-500 ml-3 flex-1">Created</Text>
                <Text className="text-sm font-medium text-gray-800">
                  {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Unknown'}
                </Text>
              </View>
            </View>

            {/* Sentiment Analysis */}
            {post.status === 'published' && (
              <View className="mb-4">
                {loadingComments ? (
                  <ActivityIndicator size="small" color="#0B3D2E" className="py-4" />
                ) : (
                  <SentimentAnalysisCard postId={post.id} comments={comments} />
                )}
              </View>
            )}

            {/* Reschedule Section */}
            {showReschedule && (
              <MotiView
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-blue-50 rounded-2xl p-4 mb-4"
              >
                <Text className="text-base font-semibold text-gray-800 mb-4">
                  Select New Date & Time
                </Text>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-600 mb-2">Date</Text>
                  <CustomSpinnerDatePicker
                    onChange={setNewScheduledDate}
                    initialDate={post?.scheduled_at ? new Date(post.scheduled_at) : new Date()}
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-600 mb-2">Time</Text>
                  <TimePicker
                    onChange={setNewScheduledTime}
                    initialTime={post?.scheduled_at ? new Date(post.scheduled_at) : new Date()}
                    selectedDate={newScheduledDate}
                  />
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setShowReschedule(false)}
                    className="flex-1 bg-gray-200 py-3 rounded-xl items-center"
                  >
                    <Text className="font-semibold text-gray-600">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleRescheduleConfirm}
                    disabled={actionLoading}
                    className="flex-1 bg-blue-600 py-3 rounded-xl items-center"
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text className="font-semibold text-white">Confirm</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </MotiView>
            )}

            {/* Action Buttons */}
            {!showReschedule && (
              <View className="gap-3">
                {(post.status === 'scheduled' || post.status === 'draft') && (
                  <TouchableOpacity
                    onPress={() => setShowReschedule(true)}
                    disabled={actionLoading}
                    className="flex-row items-center bg-blue-50 p-4 rounded-xl"
                  >
                    <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
                      <Ionicons name="calendar" size={24} color="#2563EB" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-800">
                        {post.status === 'scheduled' ? 'Reschedule' : 'Schedule'}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {post.status === 'scheduled' ? 'Change the scheduled date & time' : 'Set a date & time to publish'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#2563EB" />
                  </TouchableOpacity>
                )}

                {post.status === 'scheduled' && (
                  <TouchableOpacity
                    onPress={onChangeToDraft}
                    disabled={actionLoading}
                    className="flex-row items-center bg-amber-50 p-4 rounded-xl"
                  >
                    <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center mr-4">
                      <Ionicons name="document-outline" size={24} color="#D97706" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-800">Move to Drafts</Text>
                      <Text className="text-sm text-gray-500">Cancel schedule and save as draft</Text>
                    </View>
                    {actionLoading ? (
                      <ActivityIndicator color="#D97706" size="small" />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color="#D97706" />
                    )}
                  </TouchableOpacity>
                )}


                <TouchableOpacity
                  onPress={onDelete}
                  disabled={actionLoading}
                  className="flex-row items-center bg-red-50 p-4 rounded-xl"
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
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
