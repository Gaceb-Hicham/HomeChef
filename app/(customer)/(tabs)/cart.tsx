import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useCartStore } from '@/stores/cartStore';
import { Button, ScreenWrapper, PostImage } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/hooks/useLanguage';

export default function CartScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const { items, updateQuantity, removeItem, getSubtotal, getTotal, promoDiscount } = useCartStore();
  const { t } = useLanguage();

  if (items.length === 0) {
    return (
      <ScreenWrapper>
        <Text style={[styles.title, { color: colors.onBackground }]}>{t('cart.title')}</Text>
        <View style={styles.empty}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>🛒</Text>
          <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>{t('cart.empty')}</Text>
          <Text style={[styles.emptySub, { color: colors.onSurfaceVariant }]}>
            {t('cart.empty_subtitle')}
          </Text>
          <Button title={t('cart.browse')} onPress={() => router.push('/(customer)/(tabs)/home')}
            size="md" style={{ marginTop: 24 }} fullWidth={false} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Text style={[styles.title, { color: colors.onBackground }]}>{t('cart.title')}</Text>
      <FlatList data={items} keyExtractor={(i) => i.postId}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <PostImage uri={item.photo} height={60} borderRadius={14} fallbackSize={32} style={{ width: 60 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: colors.onSurface }]}>{item.title}</Text>
              <Text style={[styles.itemChef, { color: colors.onSurfaceVariant }]}>{item.chefName}</Text>
              <Text style={[styles.itemPrice, { color: colors.primary }]}>{item.price} DA</Text>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={[styles.qtyBtn, { borderColor: colors.outlineVariant }]}
                onPress={() => updateQuantity(item.postId, item.quantity - 1)}>
                <Ionicons name="remove" size={16} color={colors.onSurface} />
              </TouchableOpacity>
              <Text style={[styles.qtyText, { color: colors.onSurface }]}>{item.quantity}</Text>
              <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.primary }]}
                onPress={() => updateQuantity(item.postId, item.quantity + 1)}>
                <Ionicons name="add" size={16} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          <View style={[styles.summary, { borderTopColor: colors.outlineVariant }]}>
            <View style={styles.sumRow}>
              <Text style={[styles.sumLabel, { color: colors.onSurfaceVariant }]}>{t('cart.subtotal')}</Text>
              <Text style={[styles.sumValue, { color: colors.onSurface }]}>{getSubtotal()} DA</Text>
            </View>
            {promoDiscount > 0 && (
              <View style={styles.sumRow}>
                <Text style={[styles.sumLabel, { color: '#16a34a' }]}>Promo discount</Text>
                <Text style={{ color: '#16a34a', fontWeight: '600' }}>-{promoDiscount} DA</Text>
              </View>
            )}
            <View style={styles.sumRow}>
              <Text style={[styles.totalLabel, { color: colors.onBackground }]}>{t('cart.total')}</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>{getTotal()} DA</Text>
            </View>
            <Button title={t('cart.checkout')} onPress={() => router.push('/(customer)/checkout')} size="lg" />
          </View>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 28, fontWeight: '700', marginTop: 8, marginBottom: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 20, fontWeight: '600' },
  emptySub: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, textAlign: 'center', marginTop: 6 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 10, gap: 12 },
  itemImg: { width: 60, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  itemChef: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginTop: 2 },
  itemPrice: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 15, fontWeight: '700', marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600', width: 20, textAlign: 'center' },
  summary: { borderTopWidth: 1, marginTop: 16, paddingTop: 16, gap: 10 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sumLabel: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 14 },
  sumValue: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600' },
  totalLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 17, fontWeight: '700' },
  totalValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, fontWeight: '700' },
});
