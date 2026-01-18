import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING } from '../../constants/theme';

const SectionHeader = ({ title, icon, subtitle }) => (
  <View style={styles.container}>
    <View style={styles.titleRow}>
      {icon && (
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={12} color={COLORS.primary.dark} />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
    </View>
    {subtitle && (
      <Text style={[styles.subtitle, icon && styles.subtitleWithIcon]}>
        {subtitle}
      </Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.xs,
    backgroundColor: COLORS.primary.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.tertiary,
    marginTop: SPACING.xs,
  },
  subtitleWithIcon: {
    marginLeft: 32,
  },
});

export default SectionHeader;
