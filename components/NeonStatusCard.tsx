import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type CardType = 'danger' | 'dispatch' | 'resolved' | 'info' | 'warning';

interface NeonStatusCardProps {
  type: CardType;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  loading?: boolean;
}

const colorMap = {
  danger: '#EF4444',
  dispatch: '#3B82F6',
  resolved: '#10B981',
  info: '#8B5CF6',
  warning: '#F59E0B',
};

const iconMap: Record<CardType, keyof typeof Ionicons.glyphMap> = {
  danger: 'warning',
  dispatch: 'car-sport',
  resolved: 'checkmark-circle',
  info: 'information-circle',
  warning: 'alert-circle',
};

export function NeonStatusCard({ type, title, subtitle, action, loading = false }: NeonStatusCardProps) {
  const color = colorMap[type];
  const icon = iconMap[type];
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0.5);
    }
  }, [loading, pulseAnim]);

  return (
    <View style={[styles.container, { borderColor: color, shadowColor: color }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Ionicons name={icon} size={24} color={color} style={styles.icon} />
          <Text style={[styles.title, { color: color }]}>{title}</Text>
        </View>
        {loading && (
          <Animated.View style={[styles.loadingIndicator, { backgroundColor: color, opacity: pulseAnim }]} />
        )}
      </View>

      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}

      {action && (
        <TouchableOpacity
          style={[styles.button, { borderColor: color }]}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, { color: color }]}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#E5E7EB',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
    lineHeight: 20,
  },
  button: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  loadingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  }
});
