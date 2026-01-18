import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function About() {
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
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>About MediaMint</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
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
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: '#E0FAFA',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="rocket" size={28} color="#0B3D2E" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>
                Our Mission
              </Text>
              <Text style={{ fontSize: 15, color: '#6B7280', lineHeight: 24 }}>
                MediaMint empowers content creators and businesses to streamline their social media presence with AI-powered content generation, intelligent scheduling, and automated engagement tools.
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
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: '#E0FAFA',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="bulb" size={28} color="#0B3D2E" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 16 }}>
                What We Do
              </Text>
              
              {[
                { icon: 'image', title: 'AI Content Generation', desc: 'Create stunning images, videos, and stories with advanced AI technology' },
                { icon: 'calendar', title: 'Smart Scheduling', desc: 'Plan and schedule your content across multiple platforms effortlessly' },
                { icon: 'chatbubbles', title: 'Automated Responses', desc: 'Engage with your audience using AI-powered reply suggestions' },
                { icon: 'analytics', title: 'Performance Analytics', desc: 'Track your content performance with detailed insights' },
              ].map((feature, index) => (
                <View key={index} style={{ flexDirection: 'row', marginBottom: 16 }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: '#E0FAFA',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Ionicons name={feature.icon} size={20} color="#0B3D2E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>
                      {feature.title}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
                      {feature.desc}
                    </Text>
                  </View>
                </View>
              ))}
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
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: '#E0FAFA',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="heart" size={28} color="#0B3D2E" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 16 }}>
                Our Values
              </Text>
              
              {[
                { title: 'Innovation', desc: 'Leveraging cutting-edge AI to transform content creation' },
                { title: 'Simplicity', desc: 'Making powerful tools accessible to everyone' },
                { title: 'Quality', desc: 'Delivering exceptional results with every generation' },
                { title: 'Privacy', desc: 'Protecting your data and creative work' },
              ].map((value, index) => (
                <View key={index} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#0B3D2E', marginBottom: 4 }}>
                    • {value.title}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20, paddingLeft: 12 }}>
                    {value.desc}
                  </Text>
                </View>
              ))}
            </View>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 300 }}
          >
            <View style={{
              backgroundColor: '#E0FAFA',
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>
                MediaMint
              </Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                Version 1.0.0
              </Text>
            </View>
          </MotiView>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
