import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RNMapView, { Marker, Circle, Polyline } from 'react-native-maps';
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

const DEFAULT_REGION = {
  latitude: 36.7538,
  longitude: 3.0588,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

/**
 * Native MapView using react-native-maps (iOS/Android only)
 */
export function MapView({
  chefLocation,
  customerLocation,
  deliveryLocation,
  showRoute = false,
  radiusKm,
  height = 220,
  markers = [],
  onMarkerPress,
}: MapViewProps) {
  const region = chefLocation
    ? { ...chefLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : DEFAULT_REGION;

  return (
    <View style={[styles.container, { height }]}>
      <RNMapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
      >
        {chefLocation && (
          <Marker coordinate={chefLocation} title={chefLocation.name || 'Chef'} pinColor="#8d4b00" />
        )}
        {customerLocation && (
          <Marker coordinate={customerLocation} title="Your Location" pinColor="#0369a1" />
        )}
        {deliveryLocation && (
          <Marker coordinate={deliveryLocation} title="Delivery" pinColor="#15803d" />
        )}
        {markers.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
            title={m.title}
            description={m.subtitle}
            pinColor={m.type === 'chef' ? '#8d4b00' : m.type === 'customer' ? '#0369a1' : '#15803d'}
            onPress={() => onMarkerPress?.(m.id)}
          />
        ))}
        {radiusKm && chefLocation && (
          <Circle
            center={chefLocation}
            radius={radiusKm * 1000}
            fillColor="rgba(141, 75, 0, 0.08)"
            strokeColor="rgba(141, 75, 0, 0.25)"
            strokeWidth={1.5}
          />
        )}
        {showRoute && chefLocation && customerLocation && (
          <Polyline
            coordinates={[chefLocation, deliveryLocation || customerLocation]}
            strokeColor="#8d4b00"
            strokeWidth={3}
            lineDashPattern={[6, 3]}
          />
        )}
      </RNMapView>
    </View>
  );
}

/** Mini map for inline use */
export function MiniMapView({ latitude, longitude, size = 80 }: { latitude: number; longitude: number; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.miniMap, { width: size, height: size, backgroundColor: colors.surfaceContainerHigh }]}>
      <Text style={{ fontSize: 24 }}>📍</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, overflow: 'hidden' },
  map: { flex: 1 },
  miniMap: { borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
