import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING } from '../../constants/theme';

const Card = ({ children, style, noPadding }) => (
  <View style={[styles.container, !noPadding && styles.padding, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.xxl,
    ...SHADOWS.md,
  },
  padding: {
    padding: SPACING.lg,
  },
});

export default Card;
