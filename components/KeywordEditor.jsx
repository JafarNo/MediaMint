import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import '../global.css';

const KeywordEditor = ({ initialKeywords = [], onChange }) => {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    setKeywords(initialKeywords);
  }, [initialKeywords]);

  useEffect(() => {
    onChange && onChange(keywords);
  }, [keywords]);

  const addKeyword = () => {
    const trimmed = newKeyword.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (item) => {
    setKeywords(keywords.filter((k) => k !== item));
  };

  return (
    <View className="border-gray-300 rounded-xl px-1 py-1">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center' }}
      >
        {keywords.map((item, index) => (
          <View
            key={index}
            className="flex-row items-center bg-LogoGreen/10 border border-LogoGreen rounded-full px-3 py-1 mr-2"
          >
            <Text className="font-inter text-gray-800 mr-1">{item}</Text>
            <TouchableOpacity onPress={() => removeKeyword(item)}>
              <Ionicons name="close-circle" size={16} color="#235247" />
            </TouchableOpacity>
          </View>
        ))}

        <View className="flex-row items-center border border-gray-300 rounded-full px-1 bg-white mr-2">
          <TextInput
            className="min-w-[60px] font-inter text-gray-700"
            placeholder="Add..."
            placeholderTextColor="#9ca3af"
            value={newKeyword}
            onChangeText={setNewKeyword}
            onSubmitEditing={addKeyword}
          />
          <TouchableOpacity onPress={addKeyword}>
            <Ionicons name="add-circle" size={18} color="#235247" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default KeywordEditor;
