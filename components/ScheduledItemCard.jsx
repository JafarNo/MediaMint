import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const getStatusColor = (status) => {
  switch (status) {
    case 'draft': return '#F59E0B';
    case 'scheduled': return '#3B82F6';
    case 'published': return '#10B981';
    case 'failed': return '#EF4444';
    default: return '#6B7280';
  }
};

const ScheduledItemCard = ({ item }) => {
  if (!item) return null;

  const mediaUrl = item.content || item.media_url;
  const statusColor = getStatusColor(item.status);

  const handlePress = () => {
    // Create a copy of the item with encoded URLs to preserve AWS signature
    const itemWithEncodedUrls = {
      ...item,
      content: item.content ? encodeURIComponent(item.content) : '',
      media_url: item.media_url ? encodeURIComponent(item.media_url) : '',
      _urlsEncoded: true, // Flag to indicate URLs need decoding
    };
    router.push({
      pathname: '/scheduled',
      params: {
        item: JSON.stringify(itemWithEncodedUrls),
      },
    });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View className="bg-white m-2 rounded-xl border border-gray-100 shadow-sm w-48 overflow-hidden">
        {/* Media Preview */}
        <View className="w-full h-28 bg-gray-100">
          {mediaUrl ? (
            <Image
              source={{ uri: mediaUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons 
                name={item.contentType === 'video' ? 'videocam' : 'image'} 
                size={32} 
                color="#D1D5DB" 
              />
            </View>
          )}
          {/* Status indicator */}
          <View 
            className="absolute top-2 right-2 w-3 h-3 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          {/* Video badge */}
          {item.contentType === 'video' && (
            <View className="absolute bottom-2 left-2 bg-black/60 rounded px-1.5 py-0.5 flex-row items-center">
              <Ionicons name="play" size={10} color="white" />
            </View>
          )}
        </View>
        
        {/* Content */}
        <View className="p-3">
          <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
            {item.title}
          </Text>
          <View className="flex-row items-center mt-1">
            <Ionicons 
              name={`logo-${item.platform?.toLowerCase() || 'globe'}`} 
              size={12} 
              color={item.platform?.toLowerCase() === 'instagram' ? '#E1306C' : '#1877F2'} 
            />
            <Text className="text-xs text-gray-500 ml-1">{item.platform || ''}</Text>
          </View>
          <Text className="text-xs text-gray-400 mt-1">{item.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ScheduledItemCard;
