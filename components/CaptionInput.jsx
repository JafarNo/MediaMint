import { Ionicons } from '@expo/vector-icons';
import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";
import '../global.css';

const CaptionInput = ({ value, onChange, maxLength = 2200 }) => {
  const [inputHeight, setInputHeight] = useState(140);
  const MAX_HEIGHT = 280;
  const MIN_HEIGHT = 140;

  const characterCount = value?.length || 0;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;

  return (
    <View style={{
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: isOverLimit ? '#EF4444' : '#E5E7EB',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name="text-outline" size={16} color="#6B7280" />
        <Text style={{ marginLeft: 6, fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
          Caption
        </Text>
      </View>
      
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Write an engaging caption for your post... Use emojis 😊, hashtags #MediaMint, and tell your story!"
        placeholderTextColor="#9CA3AF"
        multiline
        scrollEnabled={inputHeight >= MAX_HEIGHT}
        textAlignVertical="top"
        maxLength={maxLength}
        onContentSizeChange={(e) => {
          const newHeight = e.nativeEvent.contentSize.height;
          setInputHeight(Math.max(MIN_HEIGHT, Math.min(newHeight, MAX_HEIGHT)));
        }}
        style={{
          height: inputHeight,
          maxHeight: MAX_HEIGHT,
          minHeight: MIN_HEIGHT,
          fontSize: 15,
          color: '#1F2937',
          lineHeight: 22,
        }}
      />
      
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="happy-outline" size={18} color="#6B7280" />
            <Text style={{ marginLeft: 4, fontSize: 12, color: '#6B7280' }}>Emoji</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="pricetag-outline" size={18} color="#6B7280" />
            <Text style={{ marginLeft: 4, fontSize: 12, color: '#6B7280' }}>Hashtag</Text>
          </View>
        </View>
        <Text style={{
          fontSize: 12, 
          color: isOverLimit ? '#EF4444' : isNearLimit ? '#F59E0B' : '#9CA3AF',
          fontWeight: isNearLimit ? '600' : '400',
        }}>
          {maxLength} char max
        </Text>
      </View>
    </View>
  );
};

export default CaptionInput;
