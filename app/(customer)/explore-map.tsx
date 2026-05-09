import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { chefApi } from '@/lib';
import { MapView } from '@/components/MapView';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { infoAlert } from '@/lib/crossAlert';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = Platform.OS === 'web' && SCREEN_WIDTH > 768;

export default function ExploreMapScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const [chefs, setChefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapExpanded, setMapExpanded] = useState(false);

  useEffect(() => {
    loadChefs();
  }, []);

  const loadChefs = async () => {
    try {
      const { data } = await chefApi.getNearbyChefs();
      if (data) setChefs(data);
    } catch (e) {}
    setLoading(false);
  };

  // Use REAL coordinates from chef_profiles (latitude/longitude columns)
  // Falls back to city-based approximate coordinates if lat/lng is null
  const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
    'Bab El Oued': { lat: 36.7920, lng: 3.0513 },
    'Hydra': { lat: 36.7455, lng: 3.0325 },
    'Didouche Mourad': { lat: 36.7660, lng: 3.0540 },
    'Kouba': { lat: 36.7240, lng: 3.0850 },
    'El Biar': { lat: 36.7680, lng: 3.0300 },
  };

  const markers = chefs.map((c: any) => {
    // Priority: real lat/lng from chef_profiles > user city lookup > default
    const lat = c.latitude || CITY_COORDS[c.area]?.lat || 36.7538 + (Math.random() - 0.5) * 0.02;
    const lng = c.longitude || CITY_COORDS[c.area]?.lng || 3.0588 + (Math.random() - 0.5) * 0.02;
    return {
      id: c.user_id || c.id,
      latitude: lat,
      longitude: lng,
      title: c.kitchen_name,
      subtitle: `⭐ ${c.rating_average || 0}`,
      type: 'chef' as const,
    };
  });

  // Responsive map height
  const mapHeight = mapExpanded
    ? SCREEN_HEIGHT * 0.75
    : isDesktop
      ? Math.min(SCREEN_HEIGHT * 0.55, 500)
      : 280;

  return (
    <ScreenWrapper padded={false}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.onBackground }]}>Nearby Chefs</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => setMapExpanded(!mapExpanded)}>
            <Ionicons name={mapExpanded ? 'contract-outline' : 'expand-outline'} size={22} color={colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => infoAlert('Filter', 'Filter by cuisine, rating, and distance coming soon!')}>
            <Ionicons name="filter-outline" size={22} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map — responsive height */}
      <View style={{ paddingHorizontal: isDesktop ? 20 : 16 }}>
        <MapView
          height={mapHeight}
          customerLocation={{ latitude: 36.7538, longitude: 3.0588 }}
          markers={markers}
          onMarkerPress={(id) => router.push(`/(customer)/chef/${id}`)}
        />
      </View>

      {/* Chef list below map */}
      {!mapExpanded && (
        <>
          <View style={[styles.listHeader, { paddingHorizontal: 20 }]}>
            <Text style={[styles.listTitle, { color: colors.onBackground }]}>
              {chefs.filter((c: any) => c.is_open).length} open kitchens nearby
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : chefs.length > 0 ? (
            <FlatList data={chefs} keyExtractor={(i: any) => i.id || i.user_id}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 24 }}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/(customer)/chef/${item.user_id}`)}
                  style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
                  <View style={[styles.cardAvatar, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <Text style={{ fontSize: 24 }}>👨‍🍳</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.cardName, { color: colors.onSurface }]}>{item.kitchen_name}</Text>
                      {item.is_open && <View style={[styles.openDot, { backgroundColor: '#22c55e' }]} />}
                    </View>
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 }}>
                      {(item.specialty_tags || []).join(' • ')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {item.rating_average > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="star" size={14} color="#f59e0b" />
                        <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 14 }}>{item.rating_average}</Text>
                      </View>
                    )}
                    <Text style={{ color: item.is_open ? '#15803d' : colors.outline, fontSize: 11, marginTop: 2, fontWeight: '600' }}>
                      {item.is_open ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 30 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📍</Text>
              <Text style={{ color: colors.onSurfaceVariant }}>No chefs found nearby</Text>
            </View>
          )}
        </>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, marginBottom: 12 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  listHeader: { paddingTop: 16, paddingBottom: 10 },
  listTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, gap: 12 },
  cardAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  openDot: { width: 8, height: 8, borderRadius: 4 },
});
