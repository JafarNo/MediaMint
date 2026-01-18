import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/theme';
import CustomSwitch from '../CustomSwitch';

const EnhancementOption = ({ icon, label, value, onToggle, disabled }) => (
  <View style={[styles.container, value && styles.containerActive]}>
    <View style={[
      styles.iconContainer,
      disabled && styles.iconDisabled,
      value && styles.iconActive,
    ]}>
      <Ionicons
        name={icon}
        size={18}
        color={disabled ? COLORS.text.muted : value ? 'white' : COLORS.primary.dark}
      />
    </View>
    <Text style={[styles.label, disabled && styles.labelDisabled]}>
      {label}
    </Text>
    <CustomSwitch value={value} onValueChange={onToggle} disabled={disabled} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.ui.border,
  },
  containerActive: {
    backgroundColor: COLORS.primary.mintLight,
    borderColor: COLORS.primary.dark,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.ui.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconDisabled: {
    backgroundColor: COLORS.ui.borderLight,
  },
  iconActive: {
    backgroundColor: COLORS.primary.dark,
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  labelDisabled: {
    color: COLORS.text.muted,
  },
});

export default EnhancementOption;
