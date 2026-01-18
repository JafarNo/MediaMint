import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import '../global.css';

const TabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  
  // Instagram-style tab configuration (icons only, no labels)
  const tabs = {
    home: {
      icon: 'home',
      iconOutline: 'home-outline',
    },
    scheduler: {
      icon: 'calendar',
      iconOutline: 'calendar-outline',
    },
    create: {
      icon: 'add-box',
      iconOutline: 'add-box-outline',
      isCenter: true,
    },
    responses: {
      icon: 'chatbubbles',
      iconOutline: 'chatbubbles-outline',
    },
    profile: {
      icon: 'person-circle',
      iconOutline: 'person-circle-outline',
    },
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Top border line like Instagram */}
      <View style={styles.topBorder} />

      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const tab = tabs[route.name];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Center Create button - Instagram style square with rounded corners
          if (tab?.isCenter) {
            return (
              <TouchableOpacity
                key={route.key}
                style={styles.tabButton}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.6}
              >
                <View style={[
                  styles.createButton,
                  isFocused && styles.createButtonActive
                ]}>
                  <Ionicons
                    name="add"
                    size={24}
                    color={isFocused ? 'white' : '#0B3D2E'}
                  />
                </View>
              </TouchableOpacity>
            );
          }

          // Profile tab - show as circle like Instagram
          if (route.name === 'profile') {
            return (
              <TouchableOpacity
                key={route.key}
                style={styles.tabButton}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.6}
              >
                <View style={[
                  styles.profileIcon,
                  isFocused && styles.profileIconActive
                ]}>
                  <LinearGradient
                    colors={['#0B3D2E', '#145A32']}
                    style={styles.profileGradient}
                  >
                    <Ionicons name="person" size={16} color="white" />
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabButton}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.6}
            >
              <Ionicons
                name={isFocused ? tab?.icon : tab?.iconOutline}
                size={26}
                color="#0B3D2E"
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
  },
  topBorder: {
    height: 0.5,
    backgroundColor: '#DBDBDB',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  createButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0B3D2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonActive: {
    backgroundColor: '#0B3D2E',
    borderColor: '#0B3D2E',
  },
  profileIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    padding: 2,
    backgroundColor: 'transparent',
  },
  profileIconActive: {

  },
  profileGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TabBar;
