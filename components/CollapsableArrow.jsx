import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, TouchableOpacity } from 'react-native';
import '../global.css';

const CollapsableArrow = ({ value, onValueChange, size }) => {
  const animation = useRef(new Animated.Value(value ? 1 : 0)).current;
  if (!size){
    size=27;}
    
  useEffect(() => {
    Animated.timing(animation, {
      toValue: value ? 1 : 0,
      duration: 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [value]);

  const toggle = () => onValueChange(!value);

  const rotate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '0deg'],
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={toggle} className='mx-2'>
      <Animated.View
        style={{
          transform: [{ rotate }],
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name="chevron-down" size={size} color="#235247" />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default CollapsableArrow;
