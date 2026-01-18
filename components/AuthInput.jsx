import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';

/**
 * Reusable Auth Input Component
 * Styled input with icon for auth screens
 */
export default function AuthInput({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  showPasswordToggle = false,
  showPassword = false,
  onTogglePassword,
  editable = true,
  autoCapitalize = 'none',
  keyboardType = 'default',
  returnKeyType = 'next',
  onSubmitEditing,
  ...props
}) {
  return (
    <View
      style={{
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 20,
        height: 60,
      }}
    >
      <Ionicons name={icon} size={24} color="#CFFFE5" />
      <TextInput
        style={{
          marginLeft: 16,
          flex: 1,
          color: 'white',
          fontSize: 16,
        }}
        placeholder={placeholder}
        placeholderTextColor="#A7E6CF"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !showPassword}
        editable={editable}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        {...props}
      />
      {showPasswordToggle && (
        <TouchableOpacity
          onPress={onTogglePassword}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
            size={24}
            color="#CFFFE5"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}
