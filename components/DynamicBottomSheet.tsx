import React, { ReactNode } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DynamicBottomSheetProps {
  snapPoints?: number[]; // Values between 0 and 1 representing percentages of screen height
  children: ReactNode;
  onClose?: () => void;
  showHandle?: boolean;
}

export function DynamicBottomSheet({
  snapPoints = [0.4, 0.8],
  children,
  onClose,
  showHandle = true,
}: DynamicBottomSheetProps) {
  // Determine pixel values for snap points
  const snapHeights = snapPoints.map((p) => p * SCREEN_HEIGHT);
  const minSnap = snapHeights[0];
  const maxSnap = snapHeights[snapHeights.length - 1];

  // We animate translationY from 0 (at minSnap) upwards
  const translateY = useSharedValue(0); // 0 means bottom sheet is at minSnap height

  const panGesture = Gesture.Pan()
    .onChange((event) => {
      let nextY = translateY.value + event.changeY;

      // Limit upward drag to maxSnap difference
      const maxUpwardTranslate = minSnap - maxSnap;
      if (nextY < maxUpwardTranslate) {
          nextY = maxUpwardTranslate;
      }

      translateY.value = nextY;
    })
    .onEnd((event) => {
      // Basic snapping logic
      // We are at translateY.value. We can be between 0 (minSnap) and (minSnap - maxSnap) (maxSnap)
      // Or we can be > 0 (dragged down to close)

      if (translateY.value > 50) { // Dragged down a bit to close
          translateY.value = withSpring(SCREEN_HEIGHT, { damping: 20, stiffness: 100 }, () => {
              if (onClose) {
                  runOnJS(onClose)();
              }
          });
          return;
      }

      // Find closest snap point
      const currentHeight = minSnap - translateY.value; // effective height from bottom

      let closestSnap = snapHeights[0];
      let minDiff = Math.abs(currentHeight - closestSnap);

      for(let i=1; i < snapHeights.length; i++) {
          const diff = Math.abs(currentHeight - snapHeights[i]);
          if(diff < minDiff) {
              minDiff = diff;
              closestSnap = snapHeights[i];
          }
      }

      const targetTranslateY = minSnap - closestSnap;
      translateY.value = withSpring(targetTranslateY, { damping: 20, stiffness: 100 });
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.sheetContainer, { height: maxSnap, bottom: -(maxSnap - minSnap) }, animatedStyle]}>
          {showHandle && (
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          )}
          <View style={styles.content}>
              {children}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    zIndex: 900,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
});
