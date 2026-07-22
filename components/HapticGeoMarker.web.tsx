import React from 'react';
import { View, StyleSheet } from 'react-native';

interface LatLng {
  latitude: number;
  longitude: number;
}

interface HapticGeoMarkerProps {
  coordinate: LatLng;
  userCoordinate: LatLng | null;
  type?: 'hotspot' | 'police' | 'safe';
  threshold?: number;
  title?: string;
}

export function HapticGeoMarker({
  type = 'hotspot',
}: HapticGeoMarkerProps) {
  const coreColors = {
    hotspot: '#EF4444',
    police: '#3B82F6',
    safe: '#10B981',
  };

  // Web fallback for react-native-maps Marker which causes errors on Web
  return (
    <View style={[styles.webMarker, { backgroundColor: coreColors[type] }]} />
  );
}

const styles = StyleSheet.create({
  webMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
