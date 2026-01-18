import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import "../global.css";

const MediaTypeSelector = ({ mediaType, setMediaType }) => {
  const options = ["Video", "Image",  "Story"];

  return (
    <View className="p-5 flex-row justify-between">
      {options.map((option) => {
        const value = option.toLowerCase(); // normalize (image, video, story)
        const isSelected = mediaType === value;

        return (
          <TouchableOpacity
            key={option}
            onPress={() => setMediaType(value)}
            className="items-center"
          >
            <View
              className={`min-w-22 py-3 px-6 rounded-full border-2 items-center justify-center
              ${isSelected ? "border-LogoGreen bg-LogoGreen"
                           : "border-LogoGreen bg-BGColor"}`}
            >
              <Text
                className={`text-xl font-inter text-center ${
                  isSelected ? "text-white" : "text-LogoGreen"
                }`}
              >
                {option}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default MediaTypeSelector;
