import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface OmniFABProps {
  onTap?: () => void;
  onHold?: () => void;
}

export function OmniFAB({ onTap, onHold }: OmniFABProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[styles.pulseContainer, animatedStyle]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={onTap}
          onLongPress={onHold}
          activeOpacity={0.8}
        >
          <Ionicons name="apps" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF9933',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9933',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
});
