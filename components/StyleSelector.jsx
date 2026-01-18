import React from "react";
import { Platform, ScrollView, Text, TouchableOpacity } from "react-native";
import "../global.css";

const StyleSelector = ({ style, setStyle }) => {
  const options = ["Minimal", "Formal", "Artistic", "Vibrant"];

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ 
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: Platform.OS === 'ios' ? 12 : 10,
      }}
    >
      {options.map((option) => {
        const value = option.toLowerCase();
        const isSelected = style === value;

        return (
          <TouchableOpacity
            key={option}
            onPress={() => setStyle(value)}
            activeOpacity={0.7}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: '#0B3D2E',
              backgroundColor: isSelected ? '#0B3D2E' : '#F9FAFB',
              marginRight: Platform.OS === 'ios' ? 4 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: isSelected ? '#FFFFFF' : '#0B3D2E',
                textAlign: 'center',
              }}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default StyleSelector;
