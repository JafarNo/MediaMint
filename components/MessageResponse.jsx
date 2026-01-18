import React, { useState } from "react";
import { TextInput } from "react-native";
import '../global.css';

const MessageResponse = () => {
  const [text, setText] = useState("");
  const [inputHeight, setInputHeight] = useState(24 * 1); 
  const MAX_HEIGHT = 24 * 5;

  return (
    
      <TextInput
        value={text}
        onChangeText={setText}
        
        placeholder="Thank you for contacting us, We typically reply within 2 hours..."
        multiline
        scrollEnabled={true}
        textAlignVertical="top"
        onContentSizeChange={(e) => {
          const newHeight = e.nativeEvent.contentSize.height;
          setInputHeight(Math.min(newHeight, MAX_HEIGHT));
        }}
        style={{ height: inputHeight, maxHeight: MAX_HEIGHT }}
        className="border placeholder:text-sm border-gray-300 rounded-lg bg-BGCSec px-3  text-gray-900 shadow-sm placeholder:color-gray-500 min-h-10"
      />
    
  );
};

export default MessageResponse;
