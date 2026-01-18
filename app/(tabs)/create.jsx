import CaptionInput from '@/components/CaptionInput';
import CustomSpinnerDatePicker from '@/components/DatePicker';
import GeneratorPrompt from '@/components/GeneratorPromt';
import SocialAccountsManager from '@/components/SocialAccountsManager';
import StyleSelector from '@/components/StyleSelector';
import TimePicker from '@/components/TimePicker';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { generateImage } from "../../api/images";
import { createPost, fileToBase64 } from "../../api/posts";
import { getConnectedAccounts, publishToSocial } from "../../api/social";
import { generateText } from "../../api/text";
import { generateVideo } from "../../api/videos";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MIN_PROMPT_LENGTH = 10;

const SectionHeader = ({ title, icon, subtitle }) => (
  <View style={{ marginBottom: 12, marginTop: 16 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {icon && (
        <View style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          backgroundColor: '#E0FAFA',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 8,
        }}>
          <Ionicons name={icon} size={12} color="#0B3D2E" />
        </View>
      )}
      <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937' }}>{title}</Text>
    </View>
    {subtitle && (
      <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, marginLeft: icon ? 32 : 0 }}>{subtitle}</Text>
    )}
  </View>
);






// Content source options
const CONTENT_SOURCE = {
  UPLOAD: 'upload',
  AI: 'ai',
};

// Platform styling data
const PLATFORM_STYLES = {
  instagram: { name: 'Instagram', icon: 'logo-instagram', color: '#E1306C', bgColor: '#FFEEF2' },
  facebook: { name: 'Facebook', icon: 'logo-facebook', color: '#1877F2', bgColor: '#E7F3FF' },
};




const Create = () => {
  // Step 1: Platform selection
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);

  // Step 2: Media type selection
  const [mediaType, setMediaType] = useState("");

  // Step 3: Content source: 'upload' or 'ai'
  const [contentSource, setContentSource] = useState(null);

  // User uploaded content
  const [uploadedContent, setUploadedContent] = useState(null);

  // AI generation fields
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");

  // Preview (final content to post)
  const [preview, setPreview] = useState(null);



  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [caption, setCaption] = useState("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  // Scheduling state
  const [showScheduleFields, setShowScheduleFields] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [isPosting, setIsPosting] = useState(false);

  // Social accounts state
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [showAccountsManager, setShowAccountsManager] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);
  const [isPublishingToSocial, setIsPublishingToSocial] = useState(false);


  // Can generate AI content
  const canGenerate =
    !loading &&
    contentSource === CONTENT_SOURCE.AI &&
    prompt.trim().length >= MIN_PROMPT_LENGTH &&
    style.trim().length > 0 &&
    !!mediaType &&
    selectedPlatforms.length > 0;

  // Can proceed with uploaded content
  const canProceedWithUpload =
    !loading &&
    contentSource === CONTENT_SOURCE.UPLOAD &&
    uploadedContent !== null &&
    !!mediaType &&
    selectedPlatforms.length > 0;

  // Toggle platform selection
  const togglePlatform = (platformId) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  // Check if platforms are selected to proceed
  const hasPlatformsSelected = selectedPlatforms.length > 0;

  // Reset all fields
  const resetForm = () => {
    setSelectedPlatforms([]);
    setMediaType("");
    setContentSource(null);
    setUploadedContent(null);
    setPrompt("");
    setStyle("");
    setPreview(null);

    setCaption("");
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
      Alert.alert(
        'Add Image',
        'Choose how you want to add your image',
        [
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Gallery', onPress: pickImage },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else if (mediaType === 'video') {
      pickVideo();
    }
  };

  // Auto-generate caption based on prompt and style
  async function autoGenerateCaption(contentPrompt, contentStyle) {
    try {
      const captionPrompt = `Write a short, engaging social media caption (max 150 characters) for a post about: "${contentPrompt}". Style: ${contentStyle || 'professional'}. Include 2-3 relevant hashtags. Make it catchy and suitable for Instagram/Facebook.`;

      const result = await generateText(captionPrompt);
      if (result && result.result_text) {
        setCaption(result.result_text);
      }
    } catch (err) {
      // Don't show error - caption generation is optional
    }
  }

  // Generate AI caption on demand
  async function handleGenerateCaption() {
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
        throw new Error("No caption generated");
      }
    } catch (err) {
      Alert.alert('Caption Generation Failed', err.message || 'Failed to generate caption. Please try again.');
    } finally {
      setIsGeneratingCaption(false);
    }
  }

  // Generate AI content
  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      let finalPrompt = style ? `${style} style: ${prompt}` : prompt;


      const instagramContentType = mediaType === 'story' ? 'story' :
        selectedPlatforms.includes('instagram') ? 'post' : 'post';

      let result;

      if (mediaType === "image") {

        result = await generateImage(finalPrompt, instagramContentType, style);
        console.log('Image generation result:', result);
        if (result && result.file_url) {
          console.log('Setting preview with URL:', result.file_url);
          setPreview({ type: "image", data: result.file_url });
          await autoGenerateCaption(prompt, style);
        } else {
          throw new Error("No image URL returned");
        }
        return;
      }

      if (mediaType === "video") {
        // Pass content type and style for Instagram Reels optimization
        result = await generateVideo(prompt, 'reel', style);
        if (result && result.file_url) {
          setPreview({ type: "video", data: result.file_url });
          // Auto-generate caption based on prompt
          await autoGenerateCaption(prompt, style);
        } else {
          throw new Error("No video URL returned");
        }
        return;
      }

      if (mediaType === "story") {
        result = await generateText(finalPrompt);
        if (result && result.result_text) {
          setPreview({ type: "story", data: result.result_text });
          // Use the generated story text as caption
          setCaption(result.result_text);
        } else {
          throw new Error("No text returned");
        }
        return;
      }

    } catch (err) {
      setError(err.message || "Failed to generate content. Please try again.");
      Alert.alert('Generation Failed', err.message || 'Failed to generate content. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  // Handle scheduling content
  async function handleSchedulePost() {
    // Prevent double submission
    if (isPosting) {
      return;
    }
    setIsPosting(true);
    try {
      let mediaUrl = preview?.data;
      let mediaBase64 = null;
      let mediaContentType = null;

      // For uploaded content, convert to base64
      if (contentSource === CONTENT_SOURCE.UPLOAD && uploadedContent) {
        try {
          mediaBase64 = await fileToBase64(uploadedContent.uri);
          mediaContentType = uploadedContent.type === 'image' ? 'image/jpeg' : 'video/mp4';
          mediaUrl = null;
        } catch (err) {
          console.error("Failed to convert file to base64:", err);
          throw new Error("Failed to prepare media for upload");
        }
      }

      // Combine date and time for scheduling
      const scheduledDateTime = new Date(scheduledDate);
      scheduledDateTime.setHours(scheduledTime.getHours());
      scheduledDateTime.setMinutes(scheduledTime.getMinutes());
      scheduledDateTime.setSeconds(0);

      const postData = {
        media_type: mediaType,
        content_source: contentSource,
        platforms: selectedPlatforms,
        caption: caption,
        media_url: mediaUrl,
        media_base64: mediaBase64,
        media_content_type: mediaContentType,
        prompt: prompt || null,
        style: style || null,
        status: 'scheduled',
        scheduled_at: scheduledDateTime.toISOString()
      };

      const result = await createPost(postData);

      Alert.alert('Scheduled!', `Your post has been scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, [
        { text: 'View Posts', onPress: () => { resetForm(); router.push('/posts'); } },
        { text: 'Create Another', onPress: () => resetForm() }
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to schedule post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  }

  // Handle saving as draft
  async function handleSaveDraft() {
    // Prevent double submission
    if (isPosting) {
      return;
    }
    setIsPosting(true);
    try {
      let mediaUrl = preview?.data;
      let mediaBase64 = null;
      let mediaContentType = null;

      if (contentSource === CONTENT_SOURCE.UPLOAD && uploadedContent) {
        try {
          mediaBase64 = await fileToBase64(uploadedContent.uri);
          mediaContentType = uploadedContent.type === 'image' ? 'image/jpeg' : 'video/mp4';
          mediaUrl = null;
        } catch (err) {
          console.error("Failed to convert file to base64:", err);
          throw new Error("Failed to prepare media for upload");
        }
      }

      const postData = {
        media_type: mediaType,
        content_source: contentSource,
        platforms: selectedPlatforms,
        caption: caption,
        media_url: mediaUrl,
        media_base64: mediaBase64,
        media_content_type: mediaContentType,
        prompt: prompt || null,
        style: style || null,
        status: 'draft'
      };

      const result = await createPost(postData);

      Alert.alert('Saved', 'Your draft has been saved!', [
        { text: 'View Posts', onPress: () => { resetForm(); router.push('/posts'); } },
        { text: 'Create Another', onPress: () => resetForm() }
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save draft. Please try again.');
    } finally {
      setIsPosting(false);
    }
  }

  // Load connected accounts on mount and when platforms change
  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    try {
      // setLoadingAccounts(true);
      const accounts = await getConnectedAccounts();
      setConnectedAccounts(accounts || []);
      // Auto-select accounts that match selected platforms
      const matchingAccountIds = (accounts || [])
        .filter(acc => selectedPlatforms.includes(acc.platform))
        .map(acc => acc.account_id);
      setSelectedAccountIds(matchingAccountIds);
    } catch (err) {
      // Silently fail - user may not be authenticated yet or no accounts connected
      setConnectedAccounts([]);
    } finally {
      // setLoadingAccounts(false);
    }
  };

  // Update selected account IDs when platforms change
  useEffect(() => {
    const matchingAccountIds = connectedAccounts
      .filter(acc => selectedPlatforms.includes(acc.platform))
      .map(acc => acc.account_id);
    setSelectedAccountIds(matchingAccountIds);
  }, [selectedPlatforms, connectedAccounts]);

  // Toggle account selection
  const toggleAccountSelection = (accountId) => {
    setSelectedAccountIds(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
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
        caption: caption
      });

      if (result.failed > 0) {
        const failedPlatforms = result.results
          .filter(r => !r.success)
          .map(r => `${r.platform}: ${r.error}`)
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
      console.error('Failed to publish to social:', err);
      Alert.alert('Publish Failed', err.message || 'Failed to publish to social media.');
      return null;
    } finally {
      setIsPublishingToSocial(false);
    }
  };

  const platforms = [
    { id: 'instagram', icon: 'logo-instagram', color: '#E1306C', bgColor: '#FFEEF2' },
    { id: 'facebook', icon: 'logo-facebook', color: '#1877F2', bgColor: '#E7F3FF' },
  ];



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B3D2E' }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B3D2E" translucent={false} />


      <LinearGradient
        colors={['#0B3D2E', '#145A32']}
        style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Create</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(contentSource || preview) && (
              <TouchableOpacity
                onPress={resetForm}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="refresh-outline" size={20} color="white" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/home')}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="home-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>


      <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -12 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          <View style={{ marginBottom: 20 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: mediaType ? '#10B981' : '#0B3D2E',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
                {mediaType ? (
                  <Ionicons name="checkmark" size={14} color="white" />
                ) : (
                  <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>1</Text>
                )}
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937' }}>
                  Choose content type
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  Select one option to continue
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { type: 'image', icon: 'image', label: 'Image', desc: 'Photo post', disabled: false },
                { type: 'video', icon: 'videocam', label: 'Video', desc: 'Reel or clip', disabled: false },
                { type: 'story', icon: 'albums', label: 'Story', desc: 'Coming soon', disabled: true },
              ].map((item) => (
                <TouchableOpacity
                  key={item.type}
                  onPress={() => {
                    if (item.disabled) return;
                    setMediaType(item.type);
                    setUploadedContent(null);
                    setPreview(null);
                  }}
                  activeOpacity={item.disabled ? 1 : 0.8}
                  style={{
                    flex: 1,
                    backgroundColor: item.disabled ? '#F9FAFB' : mediaType === item.type ? '#0B3D2E' : 'white',
                    borderRadius: 16,
                    paddingVertical: 16,
                    paddingHorizontal: 8,
                    alignItems: 'center',
                    borderWidth: mediaType === item.type && !item.disabled ? 2 : 1.5,
                    borderColor: item.disabled ? '#E5E7EB' : mediaType === item.type ? '#0B3D2E' : '#E5E7EB',
                    shadowColor: mediaType === item.type && !item.disabled ? '#0B3D2E' : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: mediaType === item.type && !item.disabled ? 0.2 : 0,
                    shadowRadius: 4,
                    elevation: mediaType === item.type && !item.disabled ? 3 : 0,
                    opacity: item.disabled ? 0.6 : 1,
                  }}
                >
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: item.disabled ? '#E5E7EB' : mediaType === item.type ? 'rgba(255,255,255,0.2)' : '#F3F4F6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}>
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={item.disabled ? '#9CA3AF' : mediaType === item.type ? 'white' : '#0B3D2E'}
                    />
                  </View>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: item.disabled ? '#9CA3AF' : mediaType === item.type ? 'white' : '#1F2937',
                  }}>
                    {item.label}
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    color: item.disabled ? '#D1D5DB' : mediaType === item.type ? 'rgba(255,255,255,0.7)' : '#9CA3AF',
                    marginTop: 2,
                  }}>
                    {item.desc}
                  </Text>
                  {mediaType === item.type && !item.disabled && (
                    <View style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: '#10B981',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: 'white',
                    }}>
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>


          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Share to
              </Text>
              {hasPlatformsSelected && (
                <View style={{
                  marginLeft: 8,
                  backgroundColor: '#10B981',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 10,
                }}>
                  <Text style={{ fontSize: 11, color: 'white', fontWeight: '700' }}>
                    {selectedPlatforms.length} selected
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {connectedAccounts.length === 0 ? (
                <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 16, alignItems: 'center' }}>
                  <Ionicons name="link-outline" size={32} color="#D1D5DB" />
                  <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 8, textAlign: 'center' }}>No connected accounts</Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>Connect your social accounts in Profile</Text>
                </View>
              ) : (
                connectedAccounts.map((account) => {
                  const platformStyle = PLATFORM_STYLES[account.platform] || { name: account.platform, icon: 'globe-outline', color: '#6B7280', bgColor: '#F3F4F6' };
                  return (
                    <TouchableOpacity
                      key={account.account_id}
                      onPress={() => togglePlatform(account.platform)}
                      activeOpacity={0.8}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: selectedPlatforms.includes(account.platform) ? platformStyle.bgColor : 'white',
                        borderRadius: 12,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderWidth: 1.5,
                        borderColor: selectedPlatforms.includes(account.platform) ? platformStyle.color : '#E5E7EB',
                      }}
                    >
                      <Ionicons name={platformStyle.icon} size={18} color={platformStyle.color} />
                      <Text style={{
                        marginLeft: 8,
                        fontSize: 13,
                        fontWeight: '600',
                        color: selectedPlatforms.includes(account.platform) ? platformStyle.color : '#374151'
                      }}>
                        {platformStyle.name}
                      </Text>
                      {selectedPlatforms.includes(account.platform) && (
                        <View style={{
                          marginLeft: 8,
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: '#10B981',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Ionicons name="checkmark" size={12} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>


          {mediaType && hasPlatformsSelected && !contentSource && (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300 }}
              style={{ marginTop: 8 }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                How do you want to create?
              </Text>

              <View style={{ flexDirection: 'row', gap: 12 }}>

                {mediaType !== 'story' && (
                  <TouchableOpacity
                    onPress={() => setContentSource(CONTENT_SOURCE.UPLOAD)}
                    activeOpacity={0.85}
                    style={{
                      flex: 1,
                      backgroundColor: 'white',
                      borderRadius: 16,
                      padding: 20,
                      alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: '#E5E7EB',
                    }}
                  >
                    <View style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      backgroundColor: '#F3F4F6',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}>
                      <Ionicons name="cloud-upload-outline" size={26} color="#0B3D2E" />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937' }}>Upload</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>From your gallery</Text>
                  </TouchableOpacity>
                )}


                <TouchableOpacity
                  onPress={() => setContentSource(CONTENT_SOURCE.AI)}
                  activeOpacity={0.85}
                  style={{
                    flex: 1,
                    borderRadius: 16,
                    overflow: 'hidden',
                    shadowColor: '#0B3D2E',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <LinearGradient
                    colors={['#0B3D2E', '#145A32']}
                    style={{
                      padding: 20,
                      alignItems: 'center',
                    }}
                  >
                    <View style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}>
                      <Ionicons name="sparkles" size={26} color="white" />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>AI Generate</Text>
                    <Text style={{ fontSize: 12, color: '#A7F3D0', marginTop: 4 }}>Create with AI magic</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </MotiView>
          )}


          {mediaType && hasPlatformsSelected && contentSource && mediaType !== 'story' && (
            <View style={{
              flexDirection: 'row',
              backgroundColor: '#F3F4F6',
              borderRadius: 12,
              padding: 4,
              marginTop: 8,
              marginBottom: 12,
            }}>
              <TouchableOpacity
                onPress={() => {
                  if (contentSource !== CONTENT_SOURCE.UPLOAD) {
                    setContentSource(CONTENT_SOURCE.UPLOAD);
                    setPreview(null);
                    setPrompt('');
                    setStyle('');
                  }
                }}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: contentSource === CONTENT_SOURCE.UPLOAD ? 'white' : 'transparent',
                  shadowColor: contentSource === CONTENT_SOURCE.UPLOAD ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: contentSource === CONTENT_SOURCE.UPLOAD ? 0.1 : 0,
                  shadowRadius: 2,
                  elevation: contentSource === CONTENT_SOURCE.UPLOAD ? 2 : 0,
                }}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={16}
                  color={contentSource === CONTENT_SOURCE.UPLOAD ? '#0B3D2E' : '#6B7280'}
                  style={{ marginRight: 6 }}
                />
                <Text style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: contentSource === CONTENT_SOURCE.UPLOAD ? '#0B3D2E' : '#6B7280',
                }}>
                  Upload
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (contentSource !== CONTENT_SOURCE.AI) {
                    setContentSource(CONTENT_SOURCE.AI);
                    setUploadedContent(null);
                    setPreview(null);
                  }
                }}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: contentSource === CONTENT_SOURCE.AI ? 'white' : 'transparent',
                  shadowColor: contentSource === CONTENT_SOURCE.AI ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: contentSource === CONTENT_SOURCE.AI ? 0.1 : 0,
                  shadowRadius: 2,
                  elevation: contentSource === CONTENT_SOURCE.AI ? 2 : 0,
                }}
              >
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={contentSource === CONTENT_SOURCE.AI ? '#0B3D2E' : '#6B7280'}
                  style={{ marginRight: 6 }}
                />
                <Text style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: contentSource === CONTENT_SOURCE.AI ? '#0B3D2E' : '#6B7280',
                }}>
                  AI Generate
                </Text>
              </TouchableOpacity>
            </View>
          )}


          {mediaType && hasPlatformsSelected && contentSource === CONTENT_SOURCE.UPLOAD && (
            <>

              {!uploadedContent ? (
                <TouchableOpacity
                  onPress={handleUploadPress}
                  activeOpacity={0.7}
                  style={{
                    borderWidth: 1.5,
                    borderColor: '#D1D5DB',
                    borderStyle: 'dashed',
                    borderRadius: 12,
                    padding: 24,
                    alignItems: 'center',
                    backgroundColor: 'white',
                  }}
                >
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: '#E0FAFA',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}>
                    <Ionicons
                      name={mediaType === 'image' ? 'image-outline' : 'videocam-outline'}
                      size={24}
                      color="#0B3D2E"
                    />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>
                    Tap to {mediaType === 'image' ? 'add image' : 'select video'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                    {mediaType === 'image' ? 'Photo or gallery' : 'Max 60 seconds'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}>
                  {uploadedContent.type === 'image' && (
                    <Image
                      source={{ uri: uploadedContent.uri }}
                      style={{ width: '100%', height: 200, resizeMode: 'cover' }}
                    />
                  )}
                  {uploadedContent.type === 'video' && (
                    <View style={{
                      width: '100%',
                      height: 150,
                      backgroundColor: '#1F2937',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Ionicons name="videocam" size={36} color="white" />
                      <Text style={{ color: 'white', marginTop: 6, fontSize: 12 }}>Video Selected</Text>
                    </View>
                  )}
                  <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity
                      onPress={handleUploadPress}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#E0FAFA',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                      }}
                    >
                      <Ionicons name="swap-horizontal" size={16} color="#0B3D2E" />
                      <Text style={{ marginLeft: 4, color: '#0B3D2E', fontWeight: '500', fontSize: 12 }}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setUploadedContent(null);
                        setPreview(null);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#FEE2E2',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                      <Text style={{ marginLeft: 4, color: '#DC2626', fontWeight: '500', fontSize: 12 }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}


          {mediaType && hasPlatformsSelected && contentSource === CONTENT_SOURCE.AI && (
            <>

              <View style={{ marginTop: 4 }}>
                <SectionHeader title="Describe Your Content" icon="create-outline" />
                <GeneratorPrompt prompt={prompt} setPrompt={setPrompt} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ fontSize: 11, color: prompt.length >= MIN_PROMPT_LENGTH ? '#10B981' : '#6B7280' }}>
                    {prompt.length >= MIN_PROMPT_LENGTH ? '✓ Ready' : `${MIN_PROMPT_LENGTH - prompt.length} more chars`}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{prompt.length}/300</Text>
                </View>
              </View>


              <View>
                <SectionHeader title="Style" icon="color-palette-outline" />
                <StyleSelector style={style} setStyle={setStyle} />
              </View>





              <View>
                <SectionHeader title="Preview" icon="eye-outline" />
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: 16,
                  minHeight: 150,
                  alignItems: preview ? 'stretch' : 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}>
                  {loading ? (
                    <View style={{ alignItems: 'center' }}>
                      <View style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: '#E0FAFA',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                      }}>
                        <ActivityIndicator size="large" color="#0B3D2E" />
                      </View>
                      <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '600' }}>
                        {mediaType === 'video' ? 'Creating your video...' : mediaType === 'image' ? 'Creating your image...' : 'Writing your story...'}
                      </Text>
                      <Text style={{ marginTop: 4, color: '#6B7280', fontSize: 12 }}>
                        {mediaType === 'video' ? 'This may take 30-60 seconds' : 'Just a moment...'}
                      </Text>
                    </View>
                  ) : preview ? (
                    <View style={{ width: '100%' }}>
                      {mediaType === 'video' ? (
                        <Video
                          source={{ uri: preview.data }}
                          style={{ width: '100%', height: 250, borderRadius: 10 }}
                          useNativeControls
                          resizeMode="contain"
                          shouldPlay={false}
                        />
                      ) : (
                        <Image
                          source={{ uri: preview.data }}
                          style={{ width: '100%', height: 250, borderRadius: 10 }}
                          resizeMode="cover"
                        />
                      )}
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                      <View style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: '#F3F4F6',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                      }}>
                        <Ionicons name="sparkles-outline" size={28} color="#9CA3AF" />
                      </View>
                      <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center' }}>
                        Your AI-generated content will appear here
                      </Text>
                    </View>
                  )}
                </View>
              </View>


              {error && (
                <View style={{
                  backgroundColor: '#FEE2E2',
                  borderLeftWidth: 4,
                  borderLeftColor: '#DC2626',
                  borderRadius: 12,
                  padding: 14,
                  marginTop: 12,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: '#DC2626',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}>
                    <Ionicons name="alert-circle" size={16} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#991B1B', marginBottom: 4 }}>
                      Generation Failed
                    </Text>
                    <Text style={{ fontSize: 12, color: '#7F1D1D', lineHeight: 18 }}>
                      {error}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setError(null)}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="close" size={18} color="#991B1B" />
                  </TouchableOpacity>
                </View>
              )}


              <View style={{ marginTop: 16 }}>
                <TouchableOpacity
                  onPress={handleGenerate}
                  disabled={!canGenerate}
                  activeOpacity={0.85}
                  style={{
                    shadowColor: canGenerate ? '#0B3D2E' : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: canGenerate ? 0.3 : 0,
                    shadowRadius: 8,
                    elevation: canGenerate ? 4 : 0,
                  }}
                >
                  <LinearGradient
                    colors={canGenerate ? ['#0B3D2E', '#145A32'] : ['#D1D5DB', '#D1D5DB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 14,
                      paddingVertical: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                    ) : (
                      <Ionicons name="sparkles" size={20} color="white" style={{ marginRight: 8 }} />
                    )}
                    <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }}>
                      {loading ? 'Generating...' : 'Generate Content'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                {!canGenerate && !loading && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: '#FEF3C7',
                    borderRadius: 8,
                  }}>
                    <Ionicons name="information-circle" size={16} color="#D97706" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, color: '#92400E', fontWeight: '500' }}>
                      {!prompt.trim() ? 'Enter a description to continue' :
                        prompt.length < MIN_PROMPT_LENGTH ? `Need ${MIN_PROMPT_LENGTH - prompt.length} more characters` :
                          !style ? 'Select a style to continue' : 'Complete all fields to generate'}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}


          {preview && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400 }}
            >

              <View style={{
                backgroundColor: '#ECFDF5',
                borderRadius: 12,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 20,
                marginBottom: 8,
              }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#10B981',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="checkmark" size={18} color="white" />
                </View>
                <Text style={{ flex: 1, fontSize: 14, color: '#065F46', fontWeight: '500' }}>
                  {contentSource === CONTENT_SOURCE.AI ? 'Content generated successfully!' : 'Content ready to post!'}
                </Text>
              </View>


              <SectionHeader title="Add Caption" icon="chatbubble-outline" />
              <CaptionInput value={caption} onChange={setCaption} />
              <TouchableOpacity
                style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}
                onPress={handleGenerateCaption}
                disabled={isGeneratingCaption}
              >
                {isGeneratingCaption ? (
                  <>
                    <ActivityIndicator size="small" color="#0B3D2E" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '600' }}>
                      Generating caption...
                    </Text>
                  </>
                ) : (
                  <Text style={{ fontSize: 14, color: '#0B3D2E', fontWeight: '600' }}>
                    ✨ Generate AI Caption
                  </Text>
                )}
              </TouchableOpacity>

              <SectionHeader title="What would you like to do?" icon="rocket-outline" />


              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowScheduleFields(!showScheduleFields)}
                style={{
                  backgroundColor: showScheduleFields ? '#EFF6FF' : 'white',
                  borderRadius: 16,
                  padding: 18,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                  borderWidth: 2,
                  borderColor: '#3B82F6',
                }}
              >
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: showScheduleFields ? '#3B82F6' : '#EFF6FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}>
                  <Ionicons name="calendar" size={24} color={showScheduleFields ? 'white' : '#3B82F6'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                    Schedule for Later
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                    {showScheduleFields ? 'Tap to collapse' : 'Pick a date and time to post'}
                  </Text>
                </View>
                <Ionicons name={showScheduleFields ? 'chevron-up' : 'chevron-down'} size={20} color="#3B82F6" />
              </TouchableOpacity>


              {showScheduleFields && (
                <MotiView
                  from={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ type: 'timing', duration: 300 }}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                      Select Date
                    </Text>
                    <CustomSpinnerDatePicker onChange={setScheduledDate} initialDate={new Date()} />
                  </View>
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                      Select Time
                    </Text>
                    <TimePicker onChange={setScheduledTime} initialTime={new Date()} selectedDate={scheduledDate} />
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Schedule Post',
                        `Your ${mediaType} will be scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${selectedPlatforms.map(p => platforms.find(pl => pl.id === p)?.name).join(', ')}. Continue?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Schedule',
                            onPress: handleSchedulePost
                          },
                        ]
                      );
                    }}
                    activeOpacity={0.9}
                    disabled={isPosting}
                  >
                    <LinearGradient
                      colors={['#3B82F6', '#2563EB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        borderRadius: 12,
                        paddingVertical: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="calendar" size={18} color="white" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>
                        Schedule Post
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </MotiView>
              )}

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isPosting}
                onPress={() => {
                  Alert.alert(
                    'Save Draft',
                    'Save this content as a draft to continue editing later?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Save Draft', onPress: handleSaveDraft }
                    ]
                  );
                }}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
              >
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}>
                  <Ionicons name="bookmark-outline" size={24} color="#6B7280" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                    Save as Draft
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                    Continue editing later
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>


              <SectionHeader title="Publish to Connected Accounts" icon="share-social-outline" />


              <TouchableOpacity
                onPress={() => setShowAccountsManager(true)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#E0FAFA',
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Ionicons name="settings-outline" size={20} color="#0B3D2E" style={{ marginRight: 10 }} />
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: '#0B3D2E' }}>
                  Manage Connected Accounts
                </Text>
                <View style={{
                  backgroundColor: '#0B3D2E',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}>
                  <Text style={{ fontSize: 12, color: 'white', fontWeight: '500' }}>
                    {connectedAccounts.length}
                  </Text>
                </View>
              </TouchableOpacity>


              {connectedAccounts.length > 0 ? (
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
                    Select accounts to publish to:
                  </Text>
                  {connectedAccounts
                    .filter(acc => selectedPlatforms.includes(acc.platform))
                    .map(account => {
                      const isSelected = selectedAccountIds.includes(account.account_id);
                      const platformData = account.platform === 'instagram'
                        ? { color: '#E1306C', bgColor: '#FFEEF2', icon: 'logo-instagram' }
                        : { color: '#1877F2', bgColor: '#E7F3FF', icon: 'logo-facebook' };

                      return (
                        <TouchableOpacity
                          key={account.account_id}
                          onPress={() => toggleAccountSelection(account.account_id)}
                          activeOpacity={0.7}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: '#F3F4F6',
                          }}
                        >
                          <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            backgroundColor: platformData.bgColor,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                          }}>
                            <Ionicons name={platformData.icon} size={20} color={platformData.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '500', color: '#1F2937' }}>
                              {account.username || account.page_name}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#6B7280' }}>
                              {account.platform === 'instagram' ? 'Instagram' : 'Facebook Page'}
                            </Text>
                          </View>
                          <View style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: isSelected ? '#10B981' : '#E5E7EB',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}

                  {connectedAccounts.filter(acc => selectedPlatforms.includes(acc.platform)).length === 0 && (
                    <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 16 }}>
                      No accounts connected for selected platforms.{'\n'}
                      Tap Manage Connected Accounts to add one.
                    </Text>
                  )}
                </View>
              ) : (
                <View style={{
                  backgroundColor: '#FEF3C7',
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <Ionicons name="warning-outline" size={24} color="#D97706" style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#92400E' }}>
                      No accounts connected
                    </Text>
                    <Text style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>
                      Connect your Facebook or Instagram to publish directly.
                    </Text>
                  </View>
                </View>
              )}


              {selectedAccountIds.length > 0 && preview?.data && (
                <TouchableOpacity
                  onPress={async () => {
                    // Prevent double submission
                    if (isPosting || isPublishingToSocial) {
                      return;
                    }

                    const mediaUrl = preview.data;
                    if (!mediaUrl) {
                      Alert.alert('Error', 'No media to publish');
                      return;
                    }

                    // First save the post to get an ID
                    try {
                      setIsPosting(true);
                      let postMediaUrl = mediaUrl;
                      let mediaBase64 = null;
                      let mediaContentType = null;

                      if (contentSource === CONTENT_SOURCE.UPLOAD && uploadedContent) {
                        mediaBase64 = await fileToBase64(uploadedContent.uri);
                        mediaContentType = uploadedContent.type === 'image' ? 'image/jpeg' : 'video/mp4';
                        postMediaUrl = null;
                      }

                      const postData = {
                        media_type: mediaType,
                        content_source: contentSource,
                        platforms: selectedPlatforms,
                        caption: caption,
                        media_url: postMediaUrl,
                        media_base64: mediaBase64,
                        media_content_type: mediaContentType,
                        prompt: prompt || null,
                        style: style || null,
                        status: 'published'
                      };

                      const result = await createPost(postData);

                      Alert.alert('Success', 'Your post has been published!');

                      resetForm();
                    } catch (err) {
                      console.error('Failed to publish:', err);
                      Alert.alert('Error', err.message || 'Failed to publish');
                    } finally {
                      setIsPosting(false);
                    }
                  }}
                  disabled={isPosting || isPublishingToSocial}
                  activeOpacity={0.9}
                  style={{ marginTop: 16 }}
                >
                  <LinearGradient
                    colors={['#E1306C', '#C13584']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 16,
                      paddingVertical: 18,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {(isPosting || isPublishingToSocial) ? (
                      <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                    ) : (
                      <Ionicons name="share-social" size={20} color="white" style={{ marginRight: 8 }} />
                    )}
                    <Text style={{ fontSize: 17, fontWeight: '600', color: 'white' }}>
                      {isPublishingToSocial ? 'Publishing...' : `Publish to ${selectedAccountIds.length} Account${selectedAccountIds.length > 1 ? 's' : ''}`}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </MotiView>
          )}
        </ScrollView>
      </View>





      <SocialAccountsManager
        visible={showAccountsManager}
        onClose={() => setShowAccountsManager(false)}
        onAccountsChanged={loadConnectedAccounts}
      />
    </SafeAreaView>
  );
};

export default Create;
