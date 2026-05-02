import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Button, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { colors, shadows } = useTheme();
  const router = useRouter();
  const { profile, signOut } = useAuthStore();
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const [showLangModal, setShowLangModal] = useState(false);

  const MENU_ITEMS = [
    { icon: 'person-outline', label: t('profile.edit'), route: '' },
    { icon: 'location-outline', label: t('cart.checkout') === 'Checkout' ? 'My Addresses' : 'عناويني', route: '' },
    { icon: 'card-outline', label: t('checkout.payment'), route: '' },
    { icon: 'heart-outline', label: t('saved.title'), route: '/(customer)/saved' },
    { icon: 'notifications-outline', label: t('notifications.title'), route: '/(customer)/notifications' },
    { icon: 'language-outline', label: `${t('profile.language')} — ${currentLanguage === 'en' ? 'English' : 'العربية'}`, action: () => setShowLangModal(true) },
    { icon: 'map-outline', label: currentLanguage === 'en' ? 'Nearby Chefs Map' : 'خريطة الطباخين', route: '/(customer)/explore-map' },
    { icon: 'help-circle-outline', label: t('profile.help'), route: '' },
    { icon: 'information-circle-outline', label: t('profile.about'), route: '' },
  ];

  const handleLogout = () => {
    Alert.alert(t('auth.logout'), currentLanguage === 'en' ? 'Are you sure you want to log out?' : 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('auth.logout'), style: 'destructive', onPress: () => { signOut(); router.replace('/(auth)/login'); } },
    ]);
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryFixed }]}>
            <Text style={{ fontSize: 40 }}>👤</Text>
          </View>
          <Text style={[styles.name, { color: colors.onBackground }]}>{profile?.full_name || 'Guest User'}</Text>
          <Text style={[styles.email, { color: colors.onSurfaceVariant }]}>{profile?.email || 'guest@homechef.app'}</Text>
          <View style={[styles.statRow]}>
            {[
              { n: '12', l: currentLanguage === 'en' ? 'Orders' : 'طلبات' },
              { n: '5', l: currentLanguage === 'en' ? 'Reviews' : 'تقييمات' },
              { n: '8', l: currentLanguage === 'en' ? 'Saved' : 'محفوظات' },
            ].map((s) => (
              <View key={s.l} style={styles.stat}>
                <Text style={[styles.statNum, { color: colors.primary }]}>{s.n}</Text>
                <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>{s.l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu */}
        <View style={[styles.menu, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity key={item.label}
              onPress={() => {
                if ((item as any).action) (item as any).action();
                else if ((item as any).route) router.push((item as any).route as any);
              }}
              style={[styles.menuItem, idx < MENU_ITEMS.length - 1 && { borderBottomColor: colors.outlineVariant, borderBottomWidth: 0.5 }]}>
              <Ionicons name={item.icon as any} size={22} color={colors.onSurfaceVariant} />
              <Text style={[styles.menuLabel, { color: colors.onSurface }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.outline} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.error }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>{t('auth.logout')}</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.outline }]}>HomeChef v1.0.0</Text>
      </ScrollView>

      {/* Language Modal */}
      <Modal visible={showLangModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLangModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceContainerLowest, ...shadows.lg }]}>
            <Text style={[styles.modalTitle, { color: colors.onBackground }]}>{t('profile.language')}</Text>

            {[
              { code: 'en' as const, label: 'English', flag: '🇬🇧' },
              { code: 'ar' as const, label: 'العربية', flag: '🇩🇿' },
            ].map((lang) => (
              <TouchableOpacity key={lang.code}
                onPress={() => { changeLanguage(lang.code); setShowLangModal(false); }}
                style={[styles.langOption, {
                  backgroundColor: currentLanguage === lang.code ? colors.primaryFixed : 'transparent',
                  borderColor: currentLanguage === lang.code ? colors.primary : colors.outlineVariant,
                }]}>
                <Text style={{ fontSize: 24 }}>{lang.flag}</Text>
                <Text style={[styles.langLabel, { color: currentLanguage === lang.code ? colors.primary : colors.onSurface }]}>
                  {lang.label}
                </Text>
                {currentLanguage === lang.code && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  name: { fontFamily: 'NotoSerif-Bold', fontSize: 24, fontWeight: '700', marginBottom: 4 },
  email: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 14 },
  statRow: { flexDirection: 'row', gap: 32, marginTop: 20 },
  stat: { alignItems: 'center' },
  statNum: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, fontWeight: '700' },
  statLabel: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginTop: 2 },
  menu: { borderRadius: 16, marginBottom: 20, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16, gap: 14 },
  menuLabel: { flex: 1, fontFamily: 'PlusJakartaSans-Regular', fontSize: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, marginBottom: 16 },
  logoutText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginBottom: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', maxWidth: 340, borderRadius: 20, padding: 24 },
  modalTitle: { fontFamily: 'NotoSerif-Bold', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  langOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1.5, marginBottom: 10, gap: 12 },
  langLabel: { flex: 1, fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600' },
});
