import { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity } from 'react-native';
import '../global.css';

const CustomSwitch = ({ value, onValueChange, disabled }) => {
  const animation = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const toggle = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const backgroundColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#f3f4f6', '#235247'],
  });

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.8} 
      onPress={toggle}
    >
      <Animated.View
        style={{
          width: 50,
          height: 28,
          borderRadius: 20,
          backgroundColor,
          padding: 2,
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1, 
        }}
      >
        <Animated.View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: 'white',
            transform: [{ translateX }],
          }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default CustomSwitch;
