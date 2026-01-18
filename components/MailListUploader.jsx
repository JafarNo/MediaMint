import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import '../global.css';

const MailListUploader = ({ onSelect }) => {
  const [fileName, setFileName] = useState(null);

  const pickMailList = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ],
        copyToCacheDirectory: true
      });

      if (!result.canceled) {
        const file = result.assets[0];
        setFileName(file.name);
        onSelect && onSelect(file); // return full file object to parent
      }
    } catch (err) {
      // Mail list upload error - silently fail
    }
  };

  return (
    <View className=" shadow-sm">
      <TouchableOpacity
        onPress={pickMailList}
        className="border border-gray-300 rounded-xl p-2 bg-gray-100"
      >
        <Text className="text-sm text-center text-gray-500">
          {fileName ? fileName : "Upload or select mail list"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default MailListUploader;
