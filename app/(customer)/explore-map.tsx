import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { MapView } from '@/components/MapView';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const NEARBY_CHEFS = [
  { id: 'aaaa1111', latitude: 36.7548, longitude: 3.0578, title: 'Mama Sarah Kitchen', subtitle: '⭐ 4.8 • 0.5 km', type: 'chef' as const, specialty: 'Traditional', rating: 4.8, open: true },
  { id: 'bbbb2222', latitude: 36.7510, longitude: 3.0620, title: 'Sweet Ahmed', subtitle: '⭐ 4.6 • 1.2 km', type: 'chef' as const, specialty: 'Pastries', rating: 4.6, open: true },
  { id: 'cccc3333', latitude: 36.7570, longitude: 3.0550, title: "Fatima's Fresh Kitchen", subtitle: '⭐ 4.9 • 2.1 km', type: 'chef' as const, specialty: 'Healthy', rating: 4.9, open: true },
  { id: 'dddd4444', latitude: 36.7490, longitude: 3.0640, title: 'Karim Bakery', subtitle: '⭐ 4.5 • 3.0 km', type: 'chef' as const, specialty: 'Bakery', rating: 4.5, open: false },
];

export default function ExploreMapScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();

  return (
    <ScreenWrapper padded={false}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.onBackground }]}>Nearby Chefs</Text>
        <TouchableOpacity>
          <Ionicons name="filter-outline" size={22} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={{ paddingHorizontal: 20 }}>
        <MapView
          height={280}
          customerLocation={{ latitude: 36.7538, longitude: 3.0588 }}
          markers={NEARBY_CHEFS.map((c) => ({
            id: c.id,
            latitude: c.latitude,
            longitude: c.longitude,
            title: c.title,
            subtitle: c.subtitle,
            type: 'chef',
          }))}
          onMarkerPress={(id) => router.push(`/(customer)/chef/${id}`)}
        />
      </View>

      {/* Chef list below map */}
      <View style={[styles.listHeader, { paddingHorizontal: 20 }]}>
        <Text style={[styles.listTitle, { color: colors.onBackground }]}>
          {NEARBY_CHEFS.filter((c) => c.open).length} open kitchens nearby
        </Text>
      </View>

      <FlatList data={NEARBY_CHEFS} keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(customer)/chef/${item.id}`)}
            style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <View style={[styles.cardAvatar, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Text style={{ fontSize: 24 }}>👨‍🍳</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.cardName, { color: colors.onSurface }]}>{item.title}</Text>
                {item.open && <View style={[styles.openDot, { backgroundColor: '#22c55e' }]} />}
              </View>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 }}>
                {item.specialty} • {item.subtitle?.split('•')[1]?.trim()}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="star" size={14} color="#f59e0b" />
                <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 14 }}>{item.rating}</Text>
              </View>
              <Text style={{ color: item.open ? '#15803d' : colors.outline, fontSize: 11, marginTop: 2, fontWeight: '600' }}>
                {item.open ? 'Open' : 'Closed'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
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
