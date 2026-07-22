import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Animated } from 'react-native';
import { Marker, LatLng } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import haversine from 'haversine-distance';

interface HapticGeoMarkerProps {
  coordinate: LatLng;
  userCoordinate: LatLng | null;
  type?: 'hotspot' | 'police' | 'safe';
  threshold?: number; // Distance in meters to trigger haptics
  title?: string;
}

export function HapticGeoMarker({
  coordinate,
  userCoordinate,
  type = 'hotspot',
  threshold = 500,
  title,
}: HapticGeoMarkerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isWeb = Platform.OS === 'web';
  const lastHapticTime = useRef(0);

  const colors = {
    hotspot: 'rgba(239, 68, 68, 0.8)', // Red
    police: 'rgba(59, 130, 246, 0.8)',  // Blue
    safe: 'rgba(16, 185, 129, 0.8)',    // Green
  };

  const coreColors = {
    hotspot: '#EF4444',
    police: '#3B82F6',
    safe: '#10B981',
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 1000,
          useNativeDriver: !isWeb,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: !isWeb,
        }),
      ])
    ).start();
  }, [pulseAnim, isWeb]);

  useEffect(() => {
    if (isWeb || !userCoordinate) return;

    const distance = haversine(
      { latitude: userCoordinate.latitude, longitude: userCoordinate.longitude },
      { latitude: coordinate.latitude, longitude: coordinate.longitude }
    );

    if (distance <= threshold) {
      const now = Date.now();
      // Throttle haptics based on proximity
      const throttleTime = Math.max(1000, (distance / threshold) * 3000); // Pulse faster when closer

      if (now - lastHapticTime.current > throttleTime) {
        let hapticIntensity = Haptics.ImpactFeedbackStyle.Light;
        if (distance < threshold * 0.3) {
            hapticIntensity = Haptics.ImpactFeedbackStyle.Heavy;
        } else if (distance < threshold * 0.6) {
            hapticIntensity = Haptics.ImpactFeedbackStyle.Medium;
        }

        Haptics.impactAsync(hapticIntensity).catch(() => {});
        lastHapticTime.current = now;
      }
    }
  }, [userCoordinate, coordinate, threshold, isWeb]);

  if (isWeb) {
      // Fallback for web where Marker from react-native-maps might not be fully supported in the same way without mapbox-gl
      return (
          <View style={[styles.webMarker, { backgroundColor: coreColors[type] }]} />
      );
  }

  return (
    <Marker coordinate={coordinate} title={title}>
      <View style={styles.markerContainer}>
        <Animated.View
          style={[
            styles.pulse,
            {
              backgroundColor: colors[type],
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <View style={[styles.core, { backgroundColor: coreColors[type] }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  core: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  webMarker: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#FFFFFF',
  }
});
