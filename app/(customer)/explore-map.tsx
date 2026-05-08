import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { chefApi } from '@/lib';
import { MapView } from '@/components/MapView';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { crossAlert, infoAlert } from '@/lib/crossAlert';

export default function ExploreMapScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const [chefs, setChefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Generate map markers from real chef data
  const markers = chefs.map((c: any, i: number) => ({
    id: c.user_id || c.id,
    latitude: 36.7538 + (Math.random() - 0.5) * 0.01, // approximate — would come from addresses table
    longitude: 3.0588 + (Math.random() - 0.5) * 0.01,
    title: c.kitchen_name,
    subtitle: `⭐ ${c.rating_average || 0}`,
    type: 'chef' as const,
  }));

  return (
    <ScreenWrapper padded={false}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.onBackground }]}>Nearby Chefs</Text>
        <TouchableOpacity onPress={() => infoAlert('Filter', 'Filter by cuisine, rating, and distance coming soon!')}>
          <Ionicons name="filter-outline" size={22} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={{ paddingHorizontal: 20 }}>
        <MapView
          height={280}
          customerLocation={{ latitude: 36.7538, longitude: 3.0588 }}
          markers={markers}
          onMarkerPress={(id) => router.push(`/(customer)/chef/${id}`)}
        />
      </View>

      {/* Chef list below map */}
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
