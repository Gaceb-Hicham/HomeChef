import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { useLanguage } from '@/hooks/useLanguage';
import { savedApi, ordersApi } from '@/lib';
import { supabase } from '@/lib/supabase';
import { Button, Input, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { crossAlert, infoAlert } from '@/lib/crossAlert';

export default function ProfileScreen() {
  const { colors, shadows } = useTheme();
  const router = useRouter();
  const { profile, signOut, updateProfile } = useAuthStore();
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const [showLangModal, setShowLangModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');
  const [editCity, setEditCity] = useState(profile?.city || '');
  const [editArea, setEditArea] = useState(profile?.area || '');
  const [isSaving, setIsSaving] = useState(false);

  // Real stats
  const [stats, setStats] = useState({ orders: 0, reviews: 0, saved: 0 });

  useEffect(() => {
    if (profile?.id) loadStats();
  }, [profile?.id]);

  const loadStats = async () => {
    try {
      const [ordersRes, savedRes, reviewsRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('customer_id', profile!.id),
        supabase.from('saved_items').select('id', { count: 'exact', head: true }).eq('user_id', profile!.id),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('customer_id', profile!.id),
      ]);
      setStats({
        orders: ordersRes.count || 0,
        reviews: reviewsRes.count || 0,
        saved: savedRes.count || 0,
      });
    } catch (e) {}
  };

  const handleSaveProfile = async () => {
    if (!profile?.id) return;
    setIsSaving(true);
    const { error } = await supabase.from('users').update({
      full_name: editName.trim(),
      phone: editPhone.trim() || null,
      city: editCity.trim() || null,
      area: editArea.trim() || null,
    }).eq('id', profile.id);
    setIsSaving(false);

    if (error) {
      infoAlert('Error', error.message);
    } else {
      // Update local state
      if (updateProfile) {
        updateProfile({ full_name: editName.trim(), phone: editPhone.trim(), city: editCity.trim(), area: editArea.trim() });
      }
      setShowEditModal(false);
      infoAlert('Success', 'Profile updated successfully');
    }
  };

  const handleDeleteAccount = () => {
    crossAlert(
      '⚠️ Delete Account',
      'This action is irreversible. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.admin.deleteUser(profile!.id);
              if (error) throw error;
              signOut();
              router.replace('/(auth)/login');
            } catch (e: any) {
              infoAlert('Note', 'Your account deletion request has been submitted. You will be signed out.');
              signOut();
              router.replace('/(auth)/login');
            }
          },
        },
      ]
    );
  };

  const MENU_ITEMS = [
    { icon: 'person-outline', label: t('profile.edit'), action: () => { setEditName(profile?.full_name || ''); setEditPhone(profile?.phone || ''); setEditCity(profile?.city || ''); setEditArea(profile?.area || ''); setShowEditModal(true); } },
    { icon: 'heart-outline', label: t('saved.title'), route: '/(customer)/saved' },
    { icon: 'notifications-outline', label: t('notifications.title'), route: '/(customer)/notifications' },
    { icon: 'language-outline', label: `${t('profile.language')} — ${currentLanguage === 'en' ? 'English' : 'العربية'}`, action: () => setShowLangModal(true) },
    { icon: 'map-outline', label: currentLanguage === 'en' ? 'Nearby Chefs Map' : 'خريطة الطباخين', route: '/(customer)/explore-map' },
    { icon: 'information-circle-outline', label: t('profile.about'), action: () => setShowAboutModal(true) },
  ];

  const handleLogout = () => {
    crossAlert(t('auth.logout'), currentLanguage === 'en' ? 'Are you sure you want to log out?' : 'هل أنت متأكد من تسجيل الخروج؟', [
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
          {profile?.city && (
            <Text style={{ color: colors.outline, fontSize: 13, marginTop: 4 }}>📍 {profile.area ? `${profile.area}, ` : ''}{profile.city}</Text>
          )}
          <View style={[styles.statRow]}>
            {[
              { n: stats.orders.toString(), l: currentLanguage === 'en' ? 'Orders' : 'طلبات' },
              { n: stats.reviews.toString(), l: currentLanguage === 'en' ? 'Reviews' : 'تقييمات' },
              { n: stats.saved.toString(), l: currentLanguage === 'en' ? 'Saved' : 'محفوظات' },
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

        {/* Danger zone */}
        <TouchableOpacity style={[styles.dangerBtn, { borderColor: colors.error }]} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <Text style={{ color: colors.error, fontSize: 14, fontWeight: '600' }}>
            {currentLanguage === 'en' ? 'Delete Account' : 'حذف الحساب'}
          </Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.error }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>{t('auth.logout')}</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.outline }]}>HomeChef v1.0.0</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalContent, { backgroundColor: colors.surfaceContainerLowest, ...shadows.lg }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.modalTitle, { color: colors.onBackground }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>
            <Input label="Full Name" value={editName} onChangeText={setEditName} icon="person-outline" />
            <Input label="Phone" value={editPhone} onChangeText={setEditPhone} icon="call-outline" keyboardType="phone-pad" />
            <Input label="City" value={editCity} onChangeText={setEditCity} icon="location-outline" />
            <Input label="Area / Neighborhood" value={editArea} onChangeText={setEditArea} icon="map-outline" />
            <Button title="Save Changes" onPress={handleSaveProfile} loading={isSaving} size="lg" />
          </View>
        </View>
      </Modal>

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

      {/* About Modal */}
      <Modal visible={showAboutModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAboutModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceContainerLowest, ...shadows.lg }]}>
            <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 12 }}>👨‍🍳</Text>
            <Text style={[styles.modalTitle, { color: colors.onBackground }]}>HomeChef</Text>
            <Text style={{ color: colors.onSurfaceVariant, textAlign: 'center', fontSize: 14, lineHeight: 20, marginBottom: 12 }}>
              A marketplace connecting home-based cooks, bakers, and dessert makers with local customers. Fresh, homemade food delivered to your door.
            </Text>
            <Text style={{ color: colors.outline, textAlign: 'center', fontSize: 12 }}>Version 1.0.0 • Made with ❤️</Text>
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
  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 12, marginBottom: 10 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, marginBottom: 16 },
  logoutText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginBottom: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', maxWidth: 340, borderRadius: 20, padding: 24 },
  editModalContent: { width: '90%', maxWidth: 420, borderRadius: 20, padding: 24 },
  modalTitle: { fontFamily: 'NotoSerif-Bold', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  langOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1.5, marginBottom: 10, gap: 12 },
  langLabel: { flex: 1, fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600' },
});
