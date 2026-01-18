/**
 * Social Accounts Manager Component
 * Allows users to connect and manage their Facebook and Instagram accounts
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { MotiView } from 'moti';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {
    disconnectAccount,
    getConnectedAccounts,
    initiateMetaOAuth
} from '../api/social';

const PLATFORMS = {
  facebook: {
    name: 'Facebook',
    icon: 'logo-facebook',
    color: '#1877F2',
    bgColor: '#E7F3FF',
    description: 'Post to Pages, Stories, and Reels'
  },
  instagram: {
    name: 'Instagram',
    icon: 'logo-instagram',
    color: '#E1306C',
    bgColor: '#FFEEF2',
    description: 'Post to Feed, Stories, and Reels'
  }
};

const AccountCard = ({ account, onDisconnect, isDisconnecting }) => {
  const platform = PLATFORMS[account.platform] || PLATFORMS.facebook;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
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
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 50,
          height: 50,
          borderRadius: 14,
          backgroundColor: platform.bgColor,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}>
          <Ionicons name={platform.icon} size={26} color={platform.color} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
            {account.username || account.page_name || 'Connected Account'}
          </Text>
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
            {platform.name}
            {account.instagram_username && account.platform === 'facebook' && (
              <Text> • IG: @{account.instagram_username}</Text>
            )}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {account.is_active && (
            <View style={{
              backgroundColor: '#D1FAE5',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              marginRight: 8,
            }}>
              <Text style={{ fontSize: 11, color: '#059669', fontWeight: '500' }}>Active</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => onDisconnect(account.account_id)}
            disabled={isDisconnecting}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: '#FEE2E2',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isDisconnecting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </MotiView>
  );
};

const ConnectButton = ({ platform, onPress, isConnecting }) => {
  const platformData = PLATFORMS[platform];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isConnecting}
      activeOpacity={0.8}
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: platformData.color,
        borderStyle: 'dashed',
      }}
    >
      <View style={{
        width: 50,
        height: 50,
        borderRadius: 14,
        backgroundColor: platformData.bgColor,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
      }}>
        <Ionicons name={platformData.icon} size={26} color={platformData.color} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
          Connect {platformData.name}
        </Text>
        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
          {platformData.description}
        </Text>
      </View>

      {isConnecting ? (
        <ActivityIndicator size="small" color={platformData.color} />
      ) : (
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: platformData.bgColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Ionicons name="add" size={22} color={platformData.color} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function SocialAccountsManager({ visible, onClose, onAccountsChanged }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadAccounts();
    }
  }, [visible]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await getConnectedAccounts();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAccounts();
  };

  const handleConnectMeta = async () => {
    try {
      setIsConnecting(true);

      // Get OAuth URL from backend
      const { oauth_url } = await initiateMetaOAuth();

      // Open OAuth URL in system browser (not in-app browser)
      // This allows the backend callback to handle the OAuth response
      const supported = await Linking.canOpenURL(oauth_url);

      if (supported) {
        await Linking.openURL(oauth_url);

        // Show message to user
        Alert.alert(
          'Connect Your Account',
          'Complete the authorization in your browser. Once done, return to the app and pull down to refresh.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Cannot open OAuth URL');
      }

    } catch (err) {
      console.error('OAuth error:', err);
      Alert.alert('Connection Failed', 'Failed to connect your account. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (accountId) => {
    Alert.alert(
      'Disconnect Account',
      'Are you sure you want to disconnect this account? You will need to reconnect to post to this account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              setDisconnectingId(accountId);
              await disconnectAccount(accountId);
              setAccounts(prev => prev.filter(a => a.account_id !== accountId));
              if (onAccountsChanged) {
                onAccountsChanged();
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to disconnect account. Please try again.');
            } finally {
              setDisconnectingId(null);
            }
          }
        }
      ]
    );
  };

  const facebookAccounts = accounts.filter(a => a.platform === 'facebook');
  const instagramAccounts = accounts.filter(a => a.platform === 'instagram');
  const hasAnyAccount = accounts.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        {/* Header */}
        <LinearGradient
          colors={['#0B3D2E', '#145A32']}
          style={{
            paddingTop: 60,
            paddingBottom: 24,
            paddingHorizontal: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
                Connected Accounts
              </Text>
              <Text style={{ fontSize: 14, color: '#A7F3D0', marginTop: 4 }}>
                Manage your social media connections
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color="#0B3D2E" />
              <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading accounts...</Text>
            </View>
          ) : (
            <>
              {/* Connect New Account Section */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 17, fontWeight: '600', color: '#1F2937', marginBottom: 12 }}>
                  Connect New Account
                </Text>
                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
                  Connect your Facebook Page to post to both Facebook and Instagram
                </Text>

                <ConnectButton
                  platform="facebook"
                  onPress={handleConnectMeta}
                  isConnecting={isConnecting}
                />

                <View style={{
                  backgroundColor: '#FEF3C7',
                  borderRadius: 12,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                }}>
                  <Ionicons name="information-circle" size={20} color="#D97706" style={{ marginRight: 8, marginTop: 1 }} />
                  <Text style={{ flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 }}>
                    Instagram Business accounts are connected through Facebook Pages.
                    Make sure your Instagram account is linked to a Facebook Page.
                  </Text>
                </View>
              </View>

              {/* Connected Accounts Section */}
              {hasAnyAccount && (
                <View>
                  <Text style={{ fontSize: 17, fontWeight: '600', color: '#1F2937', marginBottom: 12 }}>
                    Your Accounts ({accounts.length})
                  </Text>

                  {facebookAccounts.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 8 }}>
                        Facebook Pages
                      </Text>
                      {facebookAccounts.map(account => (
                        <AccountCard
                          key={account.account_id}
                          account={account}
                          onDisconnect={handleDisconnect}
                          isDisconnecting={disconnectingId === account.account_id}
                        />
                      ))}
                    </View>
                  )}

                  {instagramAccounts.length > 0 && (
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 8 }}>
                        Instagram Accounts
                      </Text>
                      {instagramAccounts.map(account => (
                        <AccountCard
                          key={account.account_id}
                          account={account}
                          onDisconnect={handleDisconnect}
                          isDisconnecting={disconnectingId === account.account_id}
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Empty State */}
              {!hasAnyAccount && (
                <MotiView
                  from={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'timing', duration: 400 }}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 20,
                    padding: 32,
                    alignItems: 'center',
                    marginTop: 20,
                  }}
                >
                  <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: '#E6F4F1',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                  }}>
                    <Ionicons name="share-social-outline" size={40} color="#0B3D2E" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937', textAlign: 'center' }}>
                    No Accounts Connected
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                    Connect your Facebook and Instagram accounts to start publishing your content directly from MediaMint.
                  </Text>
                </MotiView>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
