import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SectionTitle = ({ icon, title }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 20 }}>
    <View style={{
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: '#E0FAFA',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    }}>
      <Ionicons name={icon} size={20} color="#0B3D2E" />
    </View>
    <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937' }}>
      {title}
    </Text>
  </View>
);

export default function Privacy() {
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
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Privacy Policy</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <Text style={{ fontSize: 14, color: '#A7F3D0', textAlign: 'center', marginTop: 8 }}>
          Last updated: December 25, 2025
        </Text>
      </LinearGradient>

      
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
          >
            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <Text style={{ fontSize: 15, color: '#6B7280', lineHeight: 24 }}>
                At MediaMint, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
              </Text>
            </View>
          </MotiView>

          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
          >
            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <SectionTitle icon="information-circle" title="Information We Collect" />
              
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginTop: 16, marginBottom: 8 }}>
                Personal Information
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 12 }}>
                • Name, email address, and phone number{'\n'}
                • Account credentials (username and encrypted password){'\n'}
                • Profile information and preferences{'\n'}
                • Social media account connections (with your permission)
              </Text>

              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginTop: 8, marginBottom: 8 }}>
                Content Data
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 12 }}>
                • Content you create or upload (images, videos, text){'\n'}
                • AI generation prompts and preferences{'\n'}
                • Scheduled posts and captions{'\n'}
                • Analytics and performance data
              </Text>

              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginTop: 8, marginBottom: 8 }}>
                Usage Information
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 22 }}>
                • Device information (type, OS, unique identifiers){'\n'}
                • App usage patterns and interactions{'\n'}
                • Error logs and performance data{'\n'}
                • IP address and location data (if permitted)
              </Text>
            </View>
          </MotiView>

          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
          >
            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <SectionTitle icon="construct" title="How We Use Your Information" />
              
              <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 22, marginTop: 12 }}>
                We use your information to:{'\n\n'}
                • Provide and maintain our services{'\n'}
                • Generate AI content based on your prompts{'\n'}
                • Schedule and publish content to your social media accounts{'\n'}
                • Improve and personalize your experience{'\n'}
                • Send you important updates and notifications{'\n'}
                • Analyze usage patterns to enhance our features{'\n'}
                • Detect and prevent fraud or abuse{'\n'}
                • Comply with legal obligations
              </Text>
            </View>
          </MotiView>

          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 300 }}
          >
            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <SectionTitle icon="shield-checkmark" title="Data Security" />
              
              <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 22, marginTop: 12 }}>
                We implement industry-standard security measures to protect your data:{'\n\n'}
                • End-to-end encryption for sensitive data{'\n'}
                • Secure cloud storage with Firebase{'\n'}
                • Regular security audits and updates{'\n'}
                • Limited employee access to personal data{'\n'}
                • Secure authentication with OAuth 2.0{'\n'}
                • Automatic logout after inactivity
              </Text>
            </View>
          </MotiView>

          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 400 }}
          >
            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <SectionTitle icon="people" title="Data Sharing and Disclosure" />
              
              <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 22, marginTop: 12 }}>
                We do not sell your personal information. We may share your data with:{'\n\n'}
                • <Text style={{ fontWeight: '600' }}>Service Providers:</Text> Third-party services that help us operate (AWS, Firebase, analytics){'\n\n'}
                • <Text style={{ fontWeight: '600' }}>Social Media Platforms:</Text> When you authorize us to post content on your behalf{'\n\n'}
                • <Text style={{ fontWeight: '600' }}>Legal Requirements:</Text> When required by law or to protect our rights{'\n\n'}
                • <Text style={{ fontWeight: '600' }}>Business Transfers:</Text> In case of merger, acquisition, or sale of assets
              </Text>
            </View>
          </MotiView>

          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 500 }}
          >
            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <SectionTitle icon="hand-right" title="Your Rights" />
              
              <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 22, marginTop: 12 }}>
                You have the right to:{'\n\n'}
                • Access your personal data{'\n'}
                • Correct inaccurate information{'\n'}
                • Delete your account and data{'\n'}
                • Revoke social media permissions{'\n'}
                • Object to data processing
              </Text>
            </View>
          </MotiView>

          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 600 }}
          >
            <View style={{
              backgroundColor: '#E0FAFA',
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
            }}>
              <Ionicons name="mail" size={32} color="#0B3D2E" style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
                Questions about privacy?
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 16 }}>
                Contact us at privacy@mediamint.com
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
                  Contact Us
                </Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
