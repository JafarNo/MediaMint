import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

/**
 * Reusable Auth Button Component
 * Loading-aware submit button for auth screens
 */
export default function AuthButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style = {},
}) {
  return (
    <TouchableOpacity
      style={[
        {
          marginTop: 12,
          borderRadius: 16,
          backgroundColor: 'rgba(255,255,255,0.6)',
          height: 56,
        },
        style,
      ]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.8}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <ActivityIndicator color="#083d2b" size="small" />
        ) : (
          <Text
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              color: '#083d2b',
              fontSize: 16,
            }}
          >
            {title}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
