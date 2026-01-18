import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS } from '../../constants/theme';

const ContentSourceSelector = ({ mediaType, onSelectUpload, onSelectAI }) => {
  if (mediaType === 'story') {
    // Story only supports AI generation
    return null;
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
      style={styles.container}
    >
      <Text style={styles.title}>How do you want to create?</Text>

      <View style={styles.row}>
        {/* Upload Option */}
        <TouchableOpacity
          onPress={onSelectUpload}
          activeOpacity={0.85}
          style={styles.uploadCard}
        >
          <View style={styles.uploadIcon}>
            <Ionicons name="cloud-upload-outline" size={26} color={COLORS.primary.dark} />
          </View>
          <Text style={styles.cardTitle}>Upload</Text>
          <Text style={styles.cardSubtitle}>From your gallery</Text>
        </TouchableOpacity>

        {/* AI Generate Option */}
        <TouchableOpacity
          onPress={onSelectAI}
          activeOpacity={0.85}
          style={styles.aiCard}
        >
          <LinearGradient
            colors={COLORS.gradients.button}
            style={styles.aiGradient}
          >
            <View style={styles.aiIcon}>
              <Ionicons name="sparkles" size={26} color="white" />
            </View>
            <Text style={styles.aiTitle}>AI Generate</Text>
            <Text style={styles.aiSubtitle}>Create with AI magic</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.tertiary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadCard: {
    flex: 1,
    backgroundColor: COLORS.background.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.ui.border,
  },
  uploadIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.ui.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: 4,
  },
  aiCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  aiGradient: {
    padding: 20,
    alignItems: 'center',
  },
  aiIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.white,
  },
  aiSubtitle: {
    fontSize: 12,
    color: COLORS.primary.mint,
    marginTop: 4,
  },
});

export default ContentSourceSelector;
