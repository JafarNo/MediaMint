import CustomSpinnerDatePicker from '@/components/DatePicker';
import TimePicker from '@/components/TimePicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F', bgColor: '#FFEEF2' },
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2', bgColor: '#E7F3FF' },
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok', color: '#000000', bgColor: '#F0F0F0' },
  { id: 'twitter', name: 'X', icon: 'logo-twitter', color: '#000000', bgColor: '#F5F5F5' },
];

export default function SchedulePost() {
  const params = useLocalSearchParams();
  const { mediaType, platforms, contentUri, caption: initialCaption } = params;
  
  const selectedPlatforms = platforms ? platforms.split(',') : [];
  
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [caption, setCaption] = useState(initialCaption || '');
  const [loading, setLoading] = useState(false);

  const handleSchedule = async () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Scheduled!',
        `Your ${mediaType} has been scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        [
          {
            text: 'View Posts',
            onPress: () => router.replace('/posts'),
          },
          {
            text: 'Create Another',
            onPress: () => router.replace('/(tabs)/create'),
          },
        ]
      );
    }, 1500);
  };

  const getMediaIcon = () => {
    switch (mediaType) {
      case 'image': return 'image';
      case 'video': return 'videocam';
      case 'story': return 'document-text';
      default: return 'document';
    }
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
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>Schedule Post</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
          >
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#1F2937', marginBottom: 12 }}>
              Content Preview
            </Text>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              {contentUri && mediaType === 'image' ? (
                <Image
                  source={{ uri: contentUri }}
                  style={{ width: '100%', height: 200, resizeMode: 'cover' }}
                />
              ) : (
                <View style={{
                  height: 120,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ionicons name={getMediaIcon()} size={48} color="#9CA3AF" />
                  <Text style={{ marginTop: 8, color: '#6B7280', fontSize: 14, textTransform: 'capitalize' }}>
                    {mediaType} Content
                  </Text>
                </View>
              )}
              <View style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={getMediaIcon()} size={16} color="#6B7280" />
                  <Text style={{ marginLeft: 6, fontSize: 14, color: '#6B7280', textTransform: 'capitalize' }}>
                    {mediaType}
                  </Text>
                </View>
              </View>
            </View>
          </MotiView>

          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
            style={{ marginTop: 24 }}
          >
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#1F2937', marginBottom: 12 }}>
              Posting To
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {selectedPlatforms.map((platformId) => {
                const platform = PLATFORMS.find(p => p.id === platformId);
                if (!platform) return null;
                return (
                  <View
                    key={platform.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: platform.bgColor,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 12,
                      marginRight: 10,
                      marginBottom: 10,
                    }}
                  >
                    <Ionicons name={platform.icon} size={18} color={platform.color} />
                    <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '500', color: platform.color }}>
                      {platform.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </MotiView>

          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 150 }}
            style={{ marginTop: 24 }}
          >
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#1F2937', marginBottom: 12 }}>
              Schedule Date & Time
            </Text>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                  Date
                </Text>
                <CustomSpinnerDatePicker onChange={setScheduledDate} />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                  Time
                </Text>
                <TimePicker onChange={setScheduledTime} />
              </View>
            </View>
          </MotiView>

          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
            style={{ marginTop: 24 }}
          >
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#1F2937', marginBottom: 12 }}>
              Caption
            </Text>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Write a caption for your post..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                style={{
                  fontSize: 15,
                  color: '#1F2937',
                  minHeight: 100,
                  textAlignVertical: 'top',
                }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="sparkles" size={16} color="#0B3D2E" />
                  <Text style={{ marginLeft: 6, fontSize: 14, color: '#0B3D2E', fontWeight: '600' }}>
                    Generate AI Caption
                  </Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                  {caption.length}/2200
                </Text>
              </View>
            </View>
          </MotiView>

          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 250 }}
            style={{ marginTop: 32 }}
          >
            <TouchableOpacity
              onPress={handleSchedule}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#0B3D2E', '#145A32']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="calendar" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 17, fontWeight: '600', color: 'white' }}>
                  {loading ? 'Scheduling...' : 'Schedule Post'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>

          
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 12,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '500', color: '#6B7280' }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
