import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import '../global.css'

// All social media platforms - only Instagram and Facebook are enabled
const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E1306C', bgColor: '#FFEEF2', enabled: true },
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2', bgColor: '#E7F3FF', enabled: true },
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok', color: '#000000', bgColor: '#F0F0F0', enabled: false },
  { id: 'twitter', name: 'X', icon: 'logo-twitter', color: '#000000', bgColor: '#F5F5F5', enabled: false },
  { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2', bgColor: '#E8F4FC', enabled: false },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000', bgColor: '#FFE8E8', enabled: false },
  { id: 'pinterest', name: 'Pinterest', icon: 'logo-pinterest', color: '#E60023', bgColor: '#FFE8EB', enabled: false },
  { id: 'snapchat', name: 'Snapchat', icon: 'logo-snapchat', color: '#FFFC00', bgColor: '#FFFDE8', enabled: false },
]

const PlatformSelector = ({ selectedPlatforms = [], onChange, showLabels = false }) => {
  const [selected, setSelected] = useState(selectedPlatforms)

  useEffect(() => {
    setSelected(selectedPlatforms)
  }, [selectedPlatforms])

  const toggle = (platform) => {
    // Only allow toggling enabled platforms
    const platformData = PLATFORMS.find(p => p.id === platform)
    if (!platformData?.enabled) return

    setSelected((prev) => {
      const newSelection = prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
      onChange && onChange(newSelection)
      return newSelection
    })
  }

  return (
    <View style={styles.container}>
      {PLATFORMS.map((platform) => {
        const isSelected = selected.includes(platform.id)
        const isDisabled = !platform.enabled

        return (
          <TouchableOpacity
            key={platform.id}
            onPress={() => toggle(platform.id)}
            activeOpacity={isDisabled ? 1 : 0.7}
            style={[
              styles.platformButton,
              isSelected && { backgroundColor: platform.bgColor, borderColor: platform.color },
              isDisabled && styles.disabledButton,
            ]}
          >
            <Ionicons
              name={platform.icon}
              size={22}
              color={isDisabled ? '#D1D5DB' : platform.color}
              style={{ opacity: isSelected ? 1 : isDisabled ? 0.4 : 0.6 }}
            />
            {showLabels && (
              <Text style={[
                styles.label,
                { color: isDisabled ? '#D1D5DB' : isSelected ? platform.color : '#6B7280' }
              ]}>
                {platform.name}
              </Text>
            )}
            {isSelected && (
              <View style={[styles.checkmark, { backgroundColor: platform.color }]}>
                <Ionicons name="checkmark" size={10} color="white" />
              </View>
            )}
            {isDisabled && (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Soon</Text>
              </View>
            )}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  disabledButton: {
    backgroundColor: '#FAFAFA',
    borderColor: '#F3F4F6',
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  checkmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#9CA3AF',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  comingSoonText: {
    fontSize: 7,
    color: 'white',
    fontWeight: '600',
  },
})

export default PlatformSelector
