import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const ARCHIVE = [
  { id: '1', title: 'Couscous Royal', emoji: '🍲', price: 850, date: 'May 2', orders: 12 },
  { id: '2', title: 'Baklava Box', emoji: '🍰', price: 450, date: 'May 2', orders: 8 },
  { id: '3', title: 'Chorba Frik', emoji: '🍜', price: 400, date: 'May 1', orders: 15 },
  { id: '4', title: 'Tajine Zitoune', emoji: '🥘', price: 700, date: 'Apr 30', orders: 10 },
  { id: '5', title: 'Makrout', emoji: '🍯', price: 350, date: 'Apr 29', orders: 20 },
  { id: '6', title: 'Bourek', emoji: '🥟', price: 300, date: 'Apr 28', orders: 18 },
];

export default function ArchiveScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.onBackground }]}>Kitchen Archive</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList data={ARCHIVE} keyExtractor={(i) => i.id} numColumns={2} columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <View style={[styles.cardImg, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Text style={{ fontSize: 36 }}>{item.emoji}</Text>
            </View>
            <View style={{ padding: 10 }}>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.cardPrice, { color: colors.primary }]}>{item.price} DA</Text>
              <View style={styles.cardMeta}>
                <Text style={[styles.cardDate, { color: colors.outline }]}>{item.date}</Text>
                <Text style={[styles.cardOrders, { color: colors.onSurfaceVariant }]}>{item.orders} orders</Text>
              </View>
            </View>
          </View>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  card: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  cardImg: { height: 100, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600' },
  cardPrice: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, fontWeight: '700', marginTop: 2 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cardDate: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11 },
  cardOrders: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11 },
});
