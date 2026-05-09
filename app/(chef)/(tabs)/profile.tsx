import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { useChefProfileStore } from '@/stores/appStores';
import { useLanguage } from '@/hooks/useLanguage';
import { chefApi, followersApi } from '@/lib';
import { supabase } from '@/lib/supabase';
import { Button, Input, ScreenWrapper, AvatarImage, ProfilePhotoUpload } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { crossAlert, infoAlert } from '@/lib/crossAlert';
import { useThemeStore } from '@/stores/themeStore';
import { useToast } from '@/components/ui/Toast';
import { pickImage, uploadKitchenCover } from '@/lib/storage';

export default function ChefProfileScreen() {
  const { colors, shadows } = useTheme();
  const router = useRouter();
  const { profile, signOut } = useAuthStore();
  const { chefProfile, fetchProfile } = useChefProfileStore();
  const { t, currentLanguage, changeLanguage } = useLanguage();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const { mode: themeMode, setMode: setThemeMode, loadSavedMode } = useThemeStore();
  const { showToast } = useToast();
  const [editKitchen, setEditKitchen] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editRadius, setEditRadius] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [editCoverUri, setEditCoverUri] = useState<string | null>(null);
  const [editCoverBase64, setEditCoverBase64] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchProfile(profile.id);
      loadFollowers();
    }
  }, [profile?.id]);

  const loadFollowers = async () => {
    if (profile?.id) {
      const count = await followersApi.getFollowerCount(profile.id);
      setFollowerCount(count);
    }
  };

  const openEdit = () => {
    setEditKitchen(chefProfile?.kitchen_name || '');
    setEditBio(chefProfile?.bio || '');
    setEditTags((chefProfile?.specialty_tags || []).join(', '));
    setEditRadius(chefProfile?.delivery_radius_km?.toString() || '5');
    setShowEditModal(true);
    setEditCoverUri(null);
    setEditCoverBase64(null);
  };

  const handlePickCover = async () => {
    const { assets } = await pickImage({ aspect: [16, 9], quality: 0.8 });
    if (assets && assets[0]) {
      setEditCoverUri(assets[0].uri);
      if (assets[0].base64) setEditCoverBase64(assets[0].base64);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    setIsSaving(true);
    const { error } = await chefApi.updateChefProfile(profile.id, {
      kitchen_name: editKitchen.trim(),
      bio: editBio.trim() || null,
      specialty_tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
      delivery_radius_km: parseInt(editRadius) || 5,
    });
    // Upload cover photo if changed
    if (!error && editCoverBase64 && profile?.id) {
      try {
        const result = await uploadKitchenCover(profile.id, editCoverBase64);
        if (result.url) {
          await chefApi.updateChefProfile(profile.id, { cover_photo_url: result.url });
        }
      } catch (e) {
        console.log('Cover upload skipped');
      }
    }
    setIsSaving(false);
    if (error) {
      infoAlert('Error', error);
    } else {
      fetchProfile(profile.id);
      setShowEditModal(false);
      showToast('Kitchen settings updated!', 'success');
    }
  };

  const handleSetLocation = async () => {
    const saveLocation = async (lat: number, lng: number) => {
      if (!profile?.id) return;
      try {
        const { error } = await chefApi.updateChefProfile(profile.id, {
          latitude: lat,
          longitude: lng,
        });
        if (!error) {
          fetchProfile(profile.id);
          showToast('Kitchen location updated ✓', 'success');
        } else {
          // Column might not exist yet
          if (error.includes('latitude') || error.includes('column')) {
            showToast('Run supabase_add_location.sql first', 'warning', 5000);
          } else {
            showToast('Failed to save location', 'error');
          }
        }
      } catch (e) {
        showToast('Run supabase_add_location.sql to enable location', 'warning', 5000);
      }
    };

    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        showToast('Geolocation not supported', 'error');
        return;
      }
      showToast('Detecting location...', 'info');
      navigator.geolocation.getCurrentPosition(
        (pos) => saveLocation(pos.coords.latitude, pos.coords.longitude),
        () => showToast('Location access denied', 'warning'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      try {
        const Location = require('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          showToast('Location permission denied', 'warning');
          return;
        }
        showToast('Detecting location...', 'info');
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await saveLocation(loc.coords.latitude, loc.coords.longitude);
      } catch (e) {
        showToast('Could not get location', 'error');
      }
    }
  };

  const stats = [
    { n: (chefProfile?.total_orders_fulfilled || 0).toString(), l: 'Orders' },
    { n: chefProfile?.rating_average ? chefProfile.rating_average.toString() : '-', l: 'Rating' },
    { n: followerCount.toString(), l: 'Followers' },
  ];

  const MENU = [
    { icon: 'storefront-outline', label: 'Kitchen Settings', action: openEdit },
    { icon: 'images-outline', label: 'Kitchen Archive', route: '/(chef)/archive' },
    { icon: 'location-outline', label: chefProfile?.latitude ? `Location Set ✓` : 'Set Kitchen Location', action: handleSetLocation },
    { icon: 'language-outline', label: `Language — ${currentLanguage === 'en' ? 'English' : 'العربية'}`, action: () => setShowLangModal(true) },
    { icon: themeMode === 'dark' ? 'moon' : themeMode === 'light' ? 'sunny' : 'contrast-outline', label: `Theme — ${themeMode === 'system' ? 'System' : themeMode === 'dark' ? 'Dark' : 'Light'}`, action: () => setShowThemeModal(true) },
    { icon: 'information-circle-outline', label: 'About HomeChef', action: () => infoAlert('HomeChef', 'A marketplace connecting home cooks with local customers.\n\nVersion 1.0.0') },
  ];

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ProfilePhotoUpload size={80} showLabel={false} />
          <Text style={[styles.name, { color: colors.onBackground }]}>{profile?.full_name || 'Chef'}</Text>
          <Text style={[styles.kitchen, { color: colors.primary }]}>{chefProfile?.kitchen_name || 'My Kitchen'}</Text>
          <View style={styles.statRow}>
            {stats.map((s) => (
              <View key={s.l} style={styles.stat}>
                <Text style={[styles.statN, { color: colors.primary }]}>{s.n}</Text>
                <Text style={[styles.statL, { color: colors.onSurfaceVariant }]}>{s.l}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.menu, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          {MENU.map((item, idx) => (
            <TouchableOpacity key={item.label}
              onPress={() => {
                if ((item as any).action) (item as any).action();
                else if ((item as any).route) router.push((item as any).route as any);
              }}
              style={[styles.menuItem, idx < MENU.length - 1 && { borderBottomColor: colors.outlineVariant, borderBottomWidth: 0.5 }]}>
              <Ionicons name={item.icon as any} size={22} color={colors.onSurfaceVariant} />
              <Text style={[styles.menuLabel, { color: colors.onSurface }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.outline} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.logout, { borderColor: colors.error }]}
          onPress={() => crossAlert('Log Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: () => { signOut(); router.replace('/(auth)/login'); } },
          ])}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={{ color: colors.error, fontWeight: '600', fontSize: 15 }}>Log Out</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Kitchen Settings Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.editContent, { backgroundColor: colors.surfaceContainerLowest, ...shadows.lg }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.modalTitle, { color: colors.onBackground }]}>Kitchen Settings</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>
            {/* Cover Photo Picker */}
            <TouchableOpacity onPress={handlePickCover}
              style={{ height: 100, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden' }}>
              {editCoverUri ? (
                <Image source={{ uri: editCoverUri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="cover" />
              ) : chefProfile?.cover_photo_url ? (
                <Image source={{ uri: chefProfile.cover_photo_url }} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="cover" />
              ) : (
                <>
                  <Ionicons name="image-outline" size={24} color={colors.outline} />
                  <Text style={{ color: colors.outline, fontSize: 12, marginTop: 4 }}>Tap to set cover photo</Text>
                </>
              )}
            </TouchableOpacity>
            <Input label="Kitchen Name" value={editKitchen} onChangeText={setEditKitchen} icon="storefront-outline" />
            <Input label="Bio" value={editBio} onChangeText={setEditBio} multiline numberOfLines={3} style={{ minHeight: 70, textAlignVertical: 'top' }} />
            <Input label="Specialty Tags (comma-separated)" placeholder="Algerian, Pastries, Bread" value={editTags} onChangeText={setEditTags} icon="pricetag-outline" />
            <Input label="Delivery Radius (km)" value={editRadius} onChangeText={setEditRadius} keyboardType="numeric" icon="navigate-outline" />
            <Button title="Save Changes" onPress={handleSave} loading={isSaving} size="lg" />
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal visible={showLangModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLangModal(false)}>
          <View style={[styles.langContent, { backgroundColor: colors.surfaceContainerLowest, ...shadows.lg }]}>
            <Text style={[styles.modalTitle, { color: colors.onBackground }]}>Language</Text>
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
                <Text style={{ flex: 1, fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600', color: currentLanguage === lang.code ? colors.primary : colors.onSurface }}>{lang.label}</Text>
                {currentLanguage === lang.code && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Theme Modal */}
      <Modal visible={showThemeModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowThemeModal(false)}>
          <View style={[styles.langContent, { backgroundColor: colors.surfaceContainerLowest, ...shadows.lg }]}>
            <Text style={[styles.modalTitle, { color: colors.onBackground }]}>Theme</Text>
            {([
              { mode: 'system' as const, label: 'System Default', icon: 'contrast-outline' },
              { mode: 'light' as const, label: 'Light', icon: 'sunny-outline' },
              { mode: 'dark' as const, label: 'Dark', icon: 'moon-outline' },
            ]).map((opt) => (
              <TouchableOpacity key={opt.mode}
                onPress={() => { setThemeMode(opt.mode); setShowThemeModal(false); }}
                style={[styles.langOption, {
                  backgroundColor: themeMode === opt.mode ? colors.primaryFixed : 'transparent',
                  borderColor: themeMode === opt.mode ? colors.primary : colors.outlineVariant,
                }]}>
                <Ionicons name={opt.icon as any} size={24} color={themeMode === opt.mode ? colors.primary : colors.onSurfaceVariant} />
                <Text style={{ flex: 1, fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600', color: themeMode === opt.mode ? colors.primary : colors.onSurface }}>{opt.label}</Text>
                {themeMode === opt.mode && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
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
  name: { fontFamily: 'NotoSerif-Bold', fontSize: 24, fontWeight: '700', marginBottom: 2 },
  kitchen: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600' },
  statRow: { flexDirection: 'row', gap: 32, marginTop: 20 },
  stat: { alignItems: 'center' },
  statN: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, fontWeight: '700' },
  statL: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginTop: 2 },
  menu: { borderRadius: 16, marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16, gap: 14 },
  menuLabel: { flex: 1, fontFamily: 'PlusJakartaSans-Regular', fontSize: 15 },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  editContent: { width: '90%', maxWidth: 420, borderRadius: 20, padding: 24 },
  langContent: { width: '80%', maxWidth: 340, borderRadius: 20, padding: 24 },
  modalTitle: { fontFamily: 'NotoSerif-Bold', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  langOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1.5, marginBottom: 10, gap: 12 },
});
