import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/theme';

const MEDIA_TYPES = [
  { type: 'image', icon: 'image', label: 'Image', desc: 'Photo post', disabled: false },
  { type: 'video', icon: 'videocam', label: 'Video', desc: 'Reel or clip', disabled: false },
  { type: 'story', icon: 'albums', label: 'Story', desc: 'Coming soon', disabled: true },
];

const MediaTypeSelector = ({ selectedType, onSelect }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.stepBadge, selectedType && styles.stepBadgeComplete]}>
          {selectedType ? (
            <Ionicons name="checkmark" size={14} color="white" />
          ) : (
            <Text style={styles.stepNumber}>1</Text>
          )}
        </View>
        <View>
          <Text style={styles.title}>Choose content type</Text>
          <Text style={styles.subtitle}>Select one option to continue</Text>
        </View>
      </View>

      <View style={styles.row}>
        {MEDIA_TYPES.map((item) => {
          const isSelected = selectedType === item.type && !item.disabled;
          return (
            <TouchableOpacity
              key={item.type}
              onPress={() => !item.disabled && onSelect(item.type)}
              activeOpacity={item.disabled ? 1 : 0.8}
              style={[
                styles.card,
                item.disabled && styles.cardDisabled,
                isSelected && styles.cardSelected,
              ]}
            >
              <View style={[
                styles.iconContainer,
                item.disabled && styles.iconDisabled,
                isSelected && styles.iconSelected,
              ]}>
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={item.disabled ? COLORS.text.muted : isSelected ? 'white' : COLORS.primary.dark}
                />
              </View>
              <Text style={[
                styles.cardLabel,
                item.disabled && styles.labelDisabled,
                isSelected && styles.labelSelected,
              ]}>
                {item.label}
              </Text>
              <Text style={[
                styles.cardDesc,
                item.disabled && styles.descDisabled,
                isSelected && styles.descSelected,
              ]}>
                {item.desc}
              </Text>
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={12} color="white" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepBadgeComplete: {
    backgroundColor: COLORS.status.success,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.background.white,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.ui.border,
  },
  cardDisabled: {
    backgroundColor: COLORS.background.primary,
    opacity: 0.6,
  },
  cardSelected: {
    backgroundColor: COLORS.primary.dark,
    borderColor: COLORS.primary.dark,
    shadowColor: COLORS.primary.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.ui.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconDisabled: {
    backgroundColor: COLORS.ui.border,
  },
  iconSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  labelDisabled: {
    color: COLORS.text.muted,
  },
  labelSelected: {
    color: 'white',
  },
  cardDesc: {
    fontSize: 11,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  descDisabled: {
    color: COLORS.text.light,
  },
  descSelected: {
    color: 'rgba(255,255,255,0.7)',
  },
  checkBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.status.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default MediaTypeSelector;
