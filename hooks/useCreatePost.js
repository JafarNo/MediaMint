import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { enhanceVideo } from '../api/enhancements';
import { generateImage } from '../api/images';
import { createPost, fileToBase64 } from '../api/posts';
import { getConnectedAccounts, publishToSocial } from '../api/social';
import { generateText } from '../api/text';
import { generateVideo } from '../api/videos';

const MIN_PROMPT_LENGTH = 10;

const CONTENT_SOURCE = {
  UPLOAD: 'upload',
  AI: 'ai',
};

export default function useCreatePost() {
  // Platform selection
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);

  // Media type selection
  const [mediaType, setMediaType] = useState('');

  // Content source: 'upload' or 'ai'
  const [contentSource, setContentSource] = useState(null);

  // User uploaded content
  const [uploadedContent, setUploadedContent] = useState(null);

  // AI generation fields
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');

  // Preview (final content to post)
  const [preview, setPreview] = useState(null);

  // Video enhancements
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  const [isVoiceOverEnabled, setIsVoiceOverEnabled] = useState(false);
  const [musicType, setMusicType] = useState(null);
  const [voiceType, setVoiceType] = useState('female_us');
  const [isEnhancing, setIsEnhancing] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [caption, setCaption] = useState('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  // Scheduling state
  const [showScheduleFields, setShowScheduleFields] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [isPosting, setIsPosting] = useState(false);

  // Social accounts state
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);
  const [isPublishingToSocial, setIsPublishingToSocial] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Computed values
  const canGenerate =
    !loading &&
    contentSource === CONTENT_SOURCE.AI &&
    prompt.trim().length >= MIN_PROMPT_LENGTH &&
    style.trim().length > 0 &&
    !!mediaType &&
    selectedPlatforms.length > 0;

  const canProceedWithUpload =
    !loading &&
    contentSource === CONTENT_SOURCE.UPLOAD &&
    uploadedContent !== null &&
    !!mediaType &&
    selectedPlatforms.length > 0;

  const hasPlatformsSelected = selectedPlatforms.length > 0;

  // Toggle platform selection
  const togglePlatform = (platformId) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  // Reset all fields
  const resetForm = () => {
    setSelectedPlatforms([]);
    setMediaType('');
    setContentSource(null);
    setUploadedContent(null);
    setPrompt('');
    setStyle('');
    setPreview(null);
    setIsMusicEnabled(false);
    setIsVoiceOverEnabled(false);
    setMusicType(null);
    setVoiceType('female_us');
    setCaption('');
    setError(null);
    setShowScheduleFields(false);
    setScheduledDate(new Date());
    setScheduledTime(new Date());
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setUploadedContent({
          uri: asset.uri,
          type: 'image',
          width: asset.width,
          height: asset.height,
        });
        setPreview({ type: 'image', data: asset.uri });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Pick video from gallery
  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload videos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setUploadedContent({
          uri: asset.uri,
          type: 'video',
          duration: asset.duration,
        });
        setPreview({ type: 'video', data: asset.uri });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setUploadedContent({
          uri: asset.uri,
          type: 'image',
          width: asset.width,
          height: asset.height,
        });
        setPreview({ type: 'image', data: asset.uri });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Handle upload button press
  const handleUploadPress = () => {
    if (mediaType === 'image') {
      Alert.alert('Add Image', 'Choose how you want to add your image', [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else if (mediaType === 'video') {
      pickVideo();
    }
  };

  // Auto-generate caption based on prompt and style
  const autoGenerateCaption = async (contentPrompt, contentStyle) => {
    try {
      const captionPrompt = `Write a short, engaging social media caption (max 150 characters) for a post about: "${contentPrompt}". Style: ${contentStyle || 'professional'}. Include 2-3 relevant hashtags. Make it catchy and suitable for Instagram/Facebook.`;
      const result = await generateText(captionPrompt);
      if (result && result.result_text) {
        setCaption(result.result_text);
      }
    } catch (err) {
      // Don't show error - caption generation is optional
    }
  };

  // Generate AI caption on demand
  const handleGenerateCaption = async () => {
    if (!prompt || prompt.trim().length < MIN_PROMPT_LENGTH) {
      Alert.alert('Need Content Info', 'Please enter a prompt first so we can generate a relevant caption.');
      return;
    }

    setIsGeneratingCaption(true);
    try {
      const captionPrompt = `Write a short, engaging social media caption (max 200 characters) for a post about: "${prompt}". Style: ${style || 'professional'}. Include 2-3 relevant hashtags. Make it catchy, engaging, and suitable for Instagram/Facebook.`;
      const result = await generateText(captionPrompt);
      if (result && result.result_text) {
        setCaption(result.result_text);
      } else {
        throw new Error('No caption generated');
      }
    } catch (err) {
      Alert.alert('Caption Generation Failed', err.message || 'Failed to generate caption. Please try again.');
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  // Generate AI content
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      let finalPrompt = style ? `${style} style: ${prompt}` : prompt;

      if (isMusicEnabled && musicType) {
        finalPrompt += ` | Background music: ${musicType}`;
      }
      if (isVoiceOverEnabled) {
        finalPrompt += ` | Include voice over narration`;
      }

      const instagramContentType = mediaType === 'story' ? 'story' : 'post';

      if (mediaType === 'image') {
        const result = await generateImage(finalPrompt, instagramContentType, style);
        if (result && result.file_url) {
          setPreview({ type: 'image', data: result.file_url });
          await autoGenerateCaption(prompt, style);
        } else {
          throw new Error('No image URL returned');
        }
        return;
      }

      if (mediaType === 'video') {
        const result = await generateVideo(prompt, 'reel', style);
        if (result && result.file_url) {
          let finalVideoUrl = result.file_url;

          // Apply enhancements if enabled
          if (isMusicEnabled || isVoiceOverEnabled) {
            setIsEnhancing(true);
            try {
              const enhanceResult = await enhanceVideo({
                videoUrl: result.file_url,
                videoPrompt: prompt,
                addVoiceover: isVoiceOverEnabled,
                voice: voiceType,
                addMusic: isMusicEnabled,
                musicType: musicType || 'upbeat',
                musicVolume: 0.2,
                voiceoverVolume: 1.0,
              });

              if (enhanceResult && enhanceResult.enhanced_url) {
                finalVideoUrl = enhanceResult.enhanced_url;
              }
            } catch (enhanceErr) {
              Alert.alert('Enhancement Warning', 'Video was generated but enhancement failed. Using original video.');
            } finally {
              setIsEnhancing(false);
            }
          }

          setPreview({ type: 'video', data: finalVideoUrl });
          await autoGenerateCaption(prompt, style);
        } else {
          throw new Error('No video URL returned');
        }
        return;
      }

      if (mediaType === 'story') {
        const result = await generateText(finalPrompt);
        if (result && result.result_text) {
          setPreview({ type: 'story', data: result.result_text });
          setCaption(result.result_text);
        } else {
          throw new Error('No text returned');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to generate content. Please try again.');
      Alert.alert('Generation Failed', err.message || 'Failed to generate content. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare post data helper
  const preparePostData = async (status, scheduledDateTime = null) => {
    let mediaUrl = preview?.data;
    let mediaBase64 = null;
    let mediaContentType = null;

    if (contentSource === CONTENT_SOURCE.UPLOAD && uploadedContent) {
      try {
        mediaBase64 = await fileToBase64(uploadedContent.uri);
        mediaContentType = uploadedContent.type === 'image' ? 'image/jpeg' : 'video/mp4';
        mediaUrl = null;
      } catch (err) {
        throw new Error('Failed to prepare media for upload');
      }
    }

    return {
      media_type: mediaType,
      content_source: contentSource,
      platforms: selectedPlatforms,
      caption: caption,
      media_url: mediaUrl,
      media_base64: mediaBase64,
      media_content_type: mediaContentType,
      prompt: prompt || null,
      style: style || null,
      status,
      ...(scheduledDateTime && { scheduled_at: scheduledDateTime.toISOString() }),
    };
  };

  // Handle scheduling content
  const handleSchedulePost = async () => {
    if (isPosting) return;
    setIsPosting(true);

    try {
      const scheduledDateTime = new Date(scheduledDate);
      scheduledDateTime.setHours(scheduledTime.getHours());
      scheduledDateTime.setMinutes(scheduledTime.getMinutes());
      scheduledDateTime.setSeconds(0);

      const postData = await preparePostData('scheduled', scheduledDateTime);
      await createPost(postData);

      return {
        success: true,
        message: `Your post has been scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      };
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to schedule post. Please try again.');
      return { success: false };
    } finally {
      setIsPosting(false);
    }
  };

  // Handle saving as draft
  const handleSaveDraft = async () => {
    if (isPosting) return;
    setIsPosting(true);

    try {
      const postData = await preparePostData('draft');
      await createPost(postData);
      return { success: true, message: 'Your draft has been saved!' };
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save draft. Please try again.');
      return { success: false };
    } finally {
      setIsPosting(false);
    }
  };

  // Load connected accounts
  const loadConnectedAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const accounts = await getConnectedAccounts();
      setConnectedAccounts(accounts || []);
      const matchingAccountIds = (accounts || [])
        .filter((acc) => selectedPlatforms.includes(acc.platform))
        .map((acc) => acc.account_id);
      setSelectedAccountIds(matchingAccountIds);
    } catch (err) {
      setConnectedAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Update selected account IDs when platforms change
  useEffect(() => {
    const matchingAccountIds = connectedAccounts
      .filter((acc) => selectedPlatforms.includes(acc.platform))
      .map((acc) => acc.account_id);
    setSelectedAccountIds(matchingAccountIds);
  }, [selectedPlatforms, connectedAccounts]);

  // Load connected accounts on mount
  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  // Toggle account selection
  const toggleAccountSelection = (accountId) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  // Publish to connected social accounts
  const handlePublishToSocial = async (postId, mediaUrl) => {
    if (selectedAccountIds.length === 0) {
      Alert.alert('No Accounts Selected', 'Please select at least one connected account to publish to.');
      return null;
    }

    try {
      setIsPublishingToSocial(true);
      const result = await publishToSocial({
        post_id: postId,
        account_ids: selectedAccountIds,
        media_url: mediaUrl,
        media_type: mediaType,
        caption: caption,
      });

      if (result.failed > 0) {
        const failedPlatforms = result.results
          .filter((r) => !r.success)
          .map((r) => `${r.platform}: ${r.error}`)
          .join('\n');
        Alert.alert(
          'Partial Success',
          `Published to ${result.successful} account(s).\n\nFailed (${result.failed}):\n${failedPlatforms}`
        );
      } else {
        Alert.alert('Success', `Published to ${result.successful} account(s)!`);
      }

      return result;
    } catch (err) {
      Alert.alert('Publish Failed', err.message || 'Failed to publish to social media.');
      return null;
    } finally {
      setIsPublishingToSocial(false);
    }
  };

  return {
    // State
    selectedPlatforms,
    mediaType,
    contentSource,
    uploadedContent,
    prompt,
    style,
    preview,
    isMusicEnabled,
    isVoiceOverEnabled,
    musicType,
    voiceType,
    isEnhancing,
    loading,
    error,
    caption,
    isGeneratingCaption,
    showScheduleFields,
    scheduledDate,
    scheduledTime,
    isPosting,
    connectedAccounts,
    selectedAccountIds,
    isPublishingToSocial,
    loadingAccounts,

    // Computed
    canGenerate,
    canProceedWithUpload,
    hasPlatformsSelected,

    // Setters
    setSelectedPlatforms,
    setMediaType,
    setContentSource,
    setUploadedContent,
    setPrompt,
    setStyle,
    setPreview,
    setIsMusicEnabled,
    setIsVoiceOverEnabled,
    setMusicType,
    setVoiceType,
    setCaption,
    setShowScheduleFields,
    setScheduledDate,
    setScheduledTime,

    // Actions
    togglePlatform,
    resetForm,
    handleUploadPress,
    handleGenerateCaption,
    handleGenerate,
    handleSchedulePost,
    handleSaveDraft,
    loadConnectedAccounts,
    toggleAccountSelection,
    handlePublishToSocial,

    // Constants
    CONTENT_SOURCE,
    MIN_PROMPT_LENGTH,
  };
}
