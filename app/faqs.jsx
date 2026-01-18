import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AnimatePresence, MotiView } from 'moti';
import { useState } from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FAQItem = ({ question, answer, isOpen, onToggle }) => (
  <MotiView
    from={{ opacity: 0, translateY: 20 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 400 }}
    style={{ marginBottom: 12 }}
  >
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#1F2937', marginRight: 12 }}>
          {question}
        </Text>
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: isOpen ? '#0B3D2E' : '#E0FAFA',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={isOpen ? 'white' : '#0B3D2E'}
          />
        </View>
      </View>

      <AnimatePresence>
        {isOpen && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'timing', duration: 250 }}
          >
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
              <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 22 }}>
                {answer}
              </Text>
            </View>
          </MotiView>
        )}
      </AnimatePresence>
    </TouchableOpacity>
  </MotiView>
);

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: 'General',
      items: [
        {
          question: 'What is MediaMint?',
          answer: 'MediaMint is an AI-powered social media management platform that helps you create, schedule, and manage content across multiple social media platforms. We use advanced AI to generate images, videos, and text content tailored to your needs.',
        },
        {
          question: 'Which platforms does MediaMint support?',
          answer: 'Currently, MediaMint supports Instagram and Facebook, with TikTok, X, LinkedIn, YouTube, Pinterest, and Snapchat coming soon. You can create and schedule content for all enabled platforms from a single dashboard.',
        },
        {
          question: 'Is MediaMint free to use?',
          answer: 'MediaMint offers both free and premium plans. The free plan includes basic content generation and scheduling features. Premium plans unlock advanced AI models, unlimited generations, and priority support.',
        },
      ],
    },
    {
      category: 'Content Creation',
      items: [
        {
          question: 'How does AI content generation work?',
          answer: 'Our AI uses state-of-the-art models to generate content based on your prompts. Simply describe what you want, choose a style, and our AI will create images, videos, or text content in seconds. You can then customize and schedule the content for posting.',
        },
        {
          question: 'Can I upload my own content?',
          answer: 'Yes! MediaMint supports both AI-generated content and user-uploaded content. You can upload your own images and videos, add captions, and schedule them for posting across your connected platforms.',
        },
        {
          question: 'What content types can I create?',
          answer: 'You can create images, videos, and stories using AI. For images and videos, you can choose from various artistic styles. For stories, our AI generates engaging text content based on your prompts.',
        },
        {
          question: 'How long does content generation take?',
          answer: 'Image and text generation typically takes 5-10 seconds. Video generation takes longer, usually 30-60 seconds, due to the complexity of the process. You\'ll see a progress indicator while content is being generated.',
        },
      ],
    },
    {
      category: 'Scheduling',
      items: [
        {
          question: 'How do I schedule posts?',
          answer: 'After creating or uploading content, select the platforms you want to post to, add a caption, and choose your desired date and time. MediaMint will automatically publish your content at the scheduled time.',
        },
        {
          question: 'Can I schedule posts for multiple platforms at once?',
          answer: 'Yes! You can select multiple platforms when scheduling a post. MediaMint will optimize the content format for each platform and post simultaneously or at different times based on your preferences.',
        },
        {
          question: 'Can I edit or delete scheduled posts?',
          answer: 'Absolutely! You can view all scheduled posts in the Scheduler tab, where you can edit, reschedule, or delete them before they\'re published.',
        },
      ],
    },
    {
      category: 'AI Responses',
      items: [
        {
          question: 'What are AI Responses?',
          answer: 'AI Responses help you engage with your audience by generating intelligent reply suggestions for comments and messages. Choose a tone (friendly, professional, casual, or enthusiastic) and provide custom instructions for personalized responses.',
        },
        {
          question: 'Can I customize AI response tone?',
          answer: 'Yes! You can select from multiple tones including friendly, professional, casual, and enthusiastic. You can also provide custom instructions to guide the AI in generating responses that match your brand voice.',
        },
      ],
    },
    {
      category: 'Account & Privacy',
      items: [
        {
          question: 'Is my data secure?',
          answer: 'Yes, we take data security seriously. All your content and account information is encrypted and stored securely. We never share your data with third parties without your explicit consent.',
        },
        {
          question: 'How do I connect my social media accounts?',
          answer: 'You can connect your social media accounts in the Profile settings. We use secure OAuth authentication to ensure your credentials are never stored on our servers.',
        },
        {
          question: "How do I upgrade my plan?",
          answer: "Go to Profile > Subscription to see available plans. You can upgrade or downgrade at any time. We&apos;ll prorate the difference.",
        },
        {
          question: 'Can I delete my account?',
          answer: 'Yes, you can delete your account at any time from the Profile settings. This will permanently remove all your data, scheduled posts, and generated content from our servers.',
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B3D2E' }} edges={['top']}>
      <StatusBar barStyle="light-content" />

      
      <LinearGradient
        colors={['#0B3D2E', '#145A32', '#1a6b3c']}
        style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>FAQs</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <Text style={{ fontSize: 14, color: '#A7F3D0', textAlign: 'center', marginTop: 8 }}>
          Find answers to common questions
        </Text>
      </LinearGradient>

      
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {faqs.map((category, categoryIndex) => (
            <View key={categoryIndex} style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#E0FAFA',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}>
                  <Ionicons name="help-circle" size={18} color="#0B3D2E" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937' }}>
                  {category.category}
                </Text>
              </View>

              {category.items.map((faq, itemIndex) => {
                const globalIndex = `${categoryIndex}-${itemIndex}`;
                return (
                  <FAQItem
                    key={globalIndex}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openIndex === globalIndex}
                    onToggle={() => setOpenIndex(openIndex === globalIndex ? null : globalIndex)}
                  />
                );
              })}
            </View>
          ))}

          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
          >
            <View style={{
              backgroundColor: '#E0FAFA',
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
            }}>
              <Ionicons name="chatbubbles" size={32} color="#0B3D2E" style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
                Still have questions?
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 }}>
                We&apos;re here to help! Contact our support team.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/contact')}
                style={{
                  backgroundColor: '#0B3D2E',
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>
                  Contact Support
                </Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
