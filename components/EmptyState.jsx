import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

/**
 * Reusable Empty State Component
 * Displays a centered message with icon when no data is available
 */
export default function EmptyState({
  icon = 'document-text-outline',
  iconSize = 40,
  iconColor = '#9CA3AF',
  iconBgColor = '#F3F4F6',
  title = 'No Data',
  message = 'No items to display',
  actionLabel,
  actionIcon,
  onAction,
  style = {},
}) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 400 }}
      style={[
        {
          alignItems: 'center',
          paddingVertical: 40,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: iconBgColor,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      </View>
      
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: '#1F2937',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      
      <Text
        style={{
          fontSize: 14,
          color: '#6B7280',
          textAlign: 'center',
          lineHeight: 20,
          paddingHorizontal: 20,
          marginBottom: actionLabel ? 24 : 0,
        }}
      >
        {message}
      </Text>
      
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#0B3D2E',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 24,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {actionIcon && (
            <Ionicons name={actionIcon} size={20} color="white" style={{ marginRight: 8 }} />
          )}
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </MotiView>
  );
}
