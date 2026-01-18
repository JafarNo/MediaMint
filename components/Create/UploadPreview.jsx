import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/theme';

const UploadPreview = ({ 
  mediaType, 
  uploadedContent, 
  onUploadPress, 
  onRemove 
}) => {
  if (!uploadedContent) {
    return (
      <TouchableOpacity
        onPress={onUploadPress}
        activeOpacity={0.7}
        style={styles.uploadButton}
      >
        <View style={styles.uploadIcon}>
          <Ionicons
            name={mediaType === 'image' ? 'image-outline' : 'videocam-outline'}
            size={24}
            color={COLORS.primary.dark}
          />
        </View>
        <Text style={styles.uploadTitle}>
          Tap to {mediaType === 'image' ? 'add image' : 'select video'}
        </Text>
        <Text style={styles.uploadSubtitle}>
          {mediaType === 'image' ? 'Photo or gallery' : 'Max 60 seconds'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.previewContainer}>
      {uploadedContent.type === 'image' && (
        <Image
          source={{ uri: uploadedContent.uri }}
          style={styles.previewImage}
        />
      )}
      {uploadedContent.type === 'video' && (
        <View style={styles.videoPlaceholder}>
          <Ionicons name="videocam" size={36} color="white" />
          <Text style={styles.videoText}>Video Selected</Text>
        </View>
      )}
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={onUploadPress} style={styles.changeButton}>
          <Ionicons name="swap-horizontal" size={16} color={COLORS.primary.dark} />
          <Text style={styles.changeText}>Change</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="trash-outline" size={16} color={COLORS.status.error} />
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  uploadButton: {
    borderWidth: 1.5,
    borderColor: COLORS.text.light,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  uploadSubtitle: {
    fontSize: 11,
    color: COLORS.text.muted,
    marginTop: 4,
  },
  previewContainer: {
    backgroundColor: COLORS.background.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.ui.border,
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  videoPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    color: 'white',
    marginTop: 6,
    fontSize: 12,
  },
  actionRow: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary.mintLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeText: {
    marginLeft: 4,
    color: COLORS.primary.dark,
    fontWeight: '500',
    fontSize: 12,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.status.errorLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeText: {
    marginLeft: 4,
    color: COLORS.status.error,
    fontWeight: '500',
    fontSize: 12,
  },
});

export default UploadPreview;
