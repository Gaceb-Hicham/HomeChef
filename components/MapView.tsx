import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface MapViewProps {
  chefLocation?: { latitude: number; longitude: number; name?: string };
  customerLocation?: { latitude: number; longitude: number };
  deliveryLocation?: { latitude: number; longitude: number };
  showRoute?: boolean;
  radiusKm?: number;
  height?: number;
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    subtitle?: string;
    type: 'chef' | 'customer' | 'delivery';
  }>;
  onMarkerPress?: (id: string) => void;
}

/**
 * Web-only MapView — styled visualization (no native maps dependency)
 */
export function MapView({
  chefLocation,
  customerLocation,
  deliveryLocation,
  showRoute = false,
  radiusKm,
  height = 220,
  markers = [],
}: MapViewProps) {
  const { colors } = useTheme();
  const [dots, setDots] = useState<Array<{ x: number; y: number; type: string; label: string }>>([]);

  useEffect(() => {
    const newDots: typeof dots = [];

    if (chefLocation) {
      newDots.push({ x: 45 + Math.random() * 10, y: 35 + Math.random() * 10, type: 'chef', label: '👨‍🍳' });
    }
    if (customerLocation) {
      newDots.push({ x: 55 + Math.random() * 10, y: 55 + Math.random() * 10, type: 'customer', label: '📍' });
    }
    if (deliveryLocation) {
      newDots.push({ x: 50 + Math.random() * 10, y: 45 + Math.random() * 10, type: 'delivery', label: '🛵' });
    }

    markers.forEach((m, i) => {
      newDots.push({
        x: 20 + (i * 15) % 60 + Math.random() * 10,
        y: 20 + (i * 20) % 60 + Math.random() * 10,
        type: m.type,
        label: m.type === 'chef' ? '👨‍🍳' : '📍',
      });
    });

    if (newDots.length === 0) {
      newDots.push(
        { x: 40, y: 35, type: 'chef', label: '👨‍🍳' },
        { x: 60, y: 55, type: 'customer', label: '📍' },
      );
    }

    setDots(newDots);
  }, [chefLocation, customerLocation, deliveryLocation, markers]);

  return (
    <View style={[styles.webMap, { height, backgroundColor: colors.surfaceContainerHigh }]}>
      {/* Grid lines */}
      {[20, 40, 60, 80].map((p) => (
        <View key={`h${p}`} style={[styles.gridLine, styles.gridH, { top: `${p}%`, backgroundColor: colors.outlineVariant }]} />
      ))}
      {[20, 40, 60, 80].map((p) => (
        <View key={`v${p}`} style={[styles.gridLine, styles.gridV, { left: `${p}%`, backgroundColor: colors.outlineVariant }]} />
      ))}

      {/* Radius circle */}
      {radiusKm && (
        <View style={[styles.radiusCircle, {
          width: Math.min(height * 0.8, radiusKm * 40),
          height: Math.min(height * 0.8, radiusKm * 40),
          borderColor: 'rgba(141, 75, 0, 0.25)',
          backgroundColor: 'rgba(141, 75, 0, 0.06)',
        }]} />
      )}

      {/* Route dashed line */}
      {showRoute && dots.length >= 2 && (
        <View style={[styles.routeLine, { backgroundColor: colors.primary }]} />
      )}

      {/* Dots */}
      {dots.map((d, i) => (
        <View key={i} style={[styles.mapDot, { left: `${d.x}%`, top: `${d.y}%` }]}>
          <Text style={{ fontSize: 20 }}>{d.label}</Text>
        </View>
      ))}

      {/* Label */}
      <View style={[styles.mapLabel, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <Text style={styles.mapLabelText}>
          {showRoute ? '🗺️ Live Tracking' : radiusKm ? `📍 ${radiusKm}km radius` : '🗺️ Map View'}
        </Text>
      </View>
    </View>
  );
}

/** Mini map for inline use */
export function MiniMapView({ size = 80 }: { latitude: number; longitude: number; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.miniMap, { width: size, height: size, backgroundColor: colors.surfaceContainerHigh }]}>
      <Text style={{ fontSize: 24 }}>📍</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  webMap: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
  gridLine: { position: 'absolute', opacity: 0.3 },
  gridH: { left: 0, right: 0, height: 0.5 },
  gridV: { top: 0, bottom: 0, width: 0.5 },
  radiusCircle: { position: 'absolute', borderRadius: 999, borderWidth: 1.5, top: '50%', left: '50%', transform: [{ translateX: '-50%' }, { translateY: '-50%' }] },
  routeLine: { position: 'absolute', top: '40%', left: '35%', width: '30%', height: 2, opacity: 0.4, transform: [{ rotate: '30deg' }] },
  mapDot: { position: 'absolute', transform: [{ translateX: -10 }, { translateY: -10 }] },
  mapLabel: { position: 'absolute', bottom: 10, left: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  mapLabelText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  miniMap: { borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
