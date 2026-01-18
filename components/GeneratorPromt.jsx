import React, { useState } from "react";
import { TextInput, View } from "react-native";
import "../global.css";

const GeneratorPrompt = ({ prompt, setPrompt }) => {
  const [inputHeight, setInputHeight] = useState(24 * 4);
  const MAX_HEIGHT = 24 * 5;
  const MAX_LENGTH = 300;

  return (
    <View className="p-2 mb-2">
      <TextInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Describe what you want to create... (e.g., 'A photo of a green water bottle on a white background')"
        multiline
        scrollEnabled={true}
        textAlignVertical="top"
        maxLength={MAX_LENGTH}
        onContentSizeChange={(e) => {
          const newHeight = e.nativeEvent.contentSize.height;
          setInputHeight(Math.min(newHeight, MAX_HEIGHT));
        }}
        style={{ height: inputHeight, maxHeight: MAX_HEIGHT }}
        className="border border-gray-300 rounded-lg bg-BGCSec px-3 py-2 shadow-sm placeholder:color-gray-500 min-h-16"
      />
    </View>
  );
};

export default GeneratorPrompt;
