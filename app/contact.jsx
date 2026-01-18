import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { submitContactForm } from '../api/contact';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !subject || !message) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const result = await submitContactForm({
        name,
        email,
        subject,
        message
      });

      Alert.alert(
        'Message Sent!',
        result.message || "Thank you for contacting us. We'll get back to you within 24 hours.",
        [
          {
            text: 'OK',
            onPress: () => {
              setName('');
              setEmail('');
              setSubject('');
              setMessage('');
            },
          },
        ]
      );
    } catch (err) {
      console.error('Contact form submission error:', err);
      Alert.alert(
        'Error',
        'Failed to send your message. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Contact Us</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <Text style={{ fontSize: 14, color: '#A7F3D0', textAlign: 'center', marginTop: 8 }}>
          We&apos;d love to hear from you
        </Text>
      </LinearGradient>

      
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          
          <View style={{ flexDirection: 'row', marginBottom: 24, gap: 12 }}>
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400 }}
              style={{ flex: 1 }}
            >
              <View style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#E0FAFA',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}>
                  <Ionicons name="mail" size={24} color="#0B3D2E" />
                </View>
                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Email</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1F2937', textAlign: 'center' }}>
                  support@mediamint.com
                </Text>
              </View>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 100 }}
              style={{ flex: 1 }}
            >
              <View style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#E0FAFA',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}>
                  <Ionicons name="time" size={24} color="#0B3D2E" />
                </View>
                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Response Time</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1F2937', textAlign: 'center' }}>
                  Within 24 hours
                </Text>
              </View>
            </MotiView>
          </View>

          
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
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 16 }}>
                Send us a message
              </Text>

              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Name
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 15,
                    color: '#1F2937',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}
                />
              </View>

              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your.email@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 15,
                    color: '#1F2937',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}
                />
              </View>

              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Subject
                </Text>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="What's this about?"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 15,
                    color: '#1F2937',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}
                />
              </View>

              
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Message
                </Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Tell us more..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 15,
                    color: '#1F2937',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    minHeight: 120,
                  }}
                />
              </View>

              
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
                style={{
                  backgroundColor: loading ? '#9CA3AF' : '#0B3D2E',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                {loading ? (
                  <>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: 'white', marginRight: 8 }}>
                      Sending...
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
                      Send Message
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </MotiView>

          
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 300 }}
          >
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 16, textAlign: 'center' }}>
                Follow us on social media
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                {[
                  { icon: 'logo-instagram', color: '#E1306C' },
                  { icon: 'logo-facebook', color: '#1877F2' },
                  { icon: 'logo-twitter', color: '#000000' },
                  { icon: 'logo-linkedin', color: '#0A66C2' },
                ].map((social, index) => (
                  <TouchableOpacity
                    key={index}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: '#F9FAFB',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={social.icon} size={24} color={social.color} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </MotiView>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
