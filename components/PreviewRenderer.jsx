import { Video } from "expo-av";
import React from "react";
import { Image, Text, View } from "react-native";
import '../global.css';

const PreviewRenderer = ({ preview, loading, mediaType }) => {
  console.log('PreviewRenderer - preview:', preview, 'mediaType:', mediaType);
  
  if (loading) {
    return (
      <Text className="text-center text-gray-600 min-h-[145] align-middle">
        Generating... ⏳
      </Text>
    );
  }

  // Before anything is generated
  if (!preview) {
    return (
      <Text className="text-center text-gray-500 min-h-[145] align-middle">
        Your generated content will appear here
      </Text>
    );
  }

  // Detect content type and render
  if (mediaType === "image" && preview.data) {
    return (
      <View style={{ width: '100%', backgroundColor: '#f0f0f0' }}>
        <Image
          source={{ uri: preview.data }}
          style={{ width: '100%', height: 250, borderRadius: 10, backgroundColor: '#e0e0e0' }}
          resizeMode="cover"
          onLoad={() => console.log('Image loaded successfully')}
          onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
        />
        <Text style={{ fontSize: 10, color: '#666', marginTop: 4 }} numberOfLines={1}>
          {preview.data.substring(0, 50)}...
        </Text>
      </View>
    );
  }

  if (mediaType  === "video") {
    return (
      <Video
        source={{ uri: preview.data }}
        style={{ width: "100%", height: 200, borderRadius: 10 }}
        useNativeControls
        resizeMode="contain"
      />
    );
  }

  // script/story → plain text
  if (mediaType ===  "script" || mediaType ==="story") {
    return (
      <Text className="p-3 text-base text-center">
        {preview.data}
      </Text>
    );
  }

  // Fallback
  return (
    <Text className="text-center text-gray-500">
      Unsupported content type
    </Text>
  );
};

export default PreviewRenderer;
