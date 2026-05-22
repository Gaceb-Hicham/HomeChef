import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/hooks/useLanguage';
import { useThemeStore } from '@/stores/themeStore';
import { crossAlert } from '@/lib/crossAlert';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const isDark = useThemeStore((s) => s.mode === 'dark');
  const toggleTheme = () => useThemeStore.getState().setMode(useThemeStore.getState().mode === 'dark' ? 'light' : 'dark');
  const signOut = useAuthStore((s) => s.signOut);

  const [notifOrders, setNotifOrders] = useState(true);
  const [notifPromos, setNotifPromos] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);

  const handleLogout = () => {
    crossAlert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { signOut(); router.replace('/(auth)/login'); } },
    ]);
  };

  const handleDeleteAccount = () => {
    crossAlert('Delete Account', 'This will permanently delete your account and all data. This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('users').delete().eq('id', user.id);
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          }
        }
      },
    ]);
  };

  const SettingRow = ({ icon, title, subtitle, right, onPress, danger }: any) => (
    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.outlineVariant }]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.iconBox, { backgroundColor: danger ? '#fce4ec' : colors.surfaceContainerLow }]}>
        <Ionicons name={icon} size={20} color={danger ? '#dc2626' : colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ color: danger ? '#dc2626' : colors.onSurface, fontSize: 15, fontWeight: '600' }}>{title}</Text>
        {subtitle && <Text style={{ color: colors.outline, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {right || <Ionicons name="chevron-forward" size={18} color={colors.outline} />}
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: colors.outline }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <SettingRow icon="moon-outline" title="Dark Mode" right={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: colors.primary }} />} />
          <SettingRow icon="language-outline" title="Language" subtitle={currentLanguage === 'ar' ? 'العربية' : 'English'}
            right={
              <TouchableOpacity style={[styles.langToggle, { backgroundColor: colors.primary }]} onPress={() => changeLanguage(currentLanguage === 'ar' ? 'en' : 'ar')}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{currentLanguage === 'ar' ? 'EN' : 'AR'}</Text>
              </TouchableOpacity>
            }
          />
        </View>

        {/* Notifications */}
        <Text style={[styles.sectionLabel, { color: colors.outline }]}>NOTIFICATIONS</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <SettingRow icon="bag-check-outline" title="Order Updates" right={<Switch value={notifOrders} onValueChange={setNotifOrders} trackColor={{ true: colors.primary }} />} />
          <SettingRow icon="megaphone-outline" title="Promotions" right={<Switch value={notifPromos} onValueChange={setNotifPromos} trackColor={{ true: colors.primary }} />} />
          <SettingRow icon="chatbubble-outline" title="Messages" right={<Switch value={notifMessages} onValueChange={setNotifMessages} trackColor={{ true: colors.primary }} />} />
        </View>

        {/* Account */}
        <Text style={[styles.sectionLabel, { color: colors.outline }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <SettingRow icon="person-outline" title="Edit Profile" onPress={() => router.push('/(customer)/edit-profile')} />
          <SettingRow icon="location-outline" title="My Addresses" onPress={() => router.push('/(customer)/addresses')} />
          <SettingRow icon="shield-checkmark-outline" title="Privacy" subtitle="Data & permissions" onPress={() => {}} />
        </View>

        {/* Support */}
        <Text style={[styles.sectionLabel, { color: colors.outline }]}>SUPPORT</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <SettingRow icon="help-circle-outline" title="Help & Support" onPress={() => router.push('/(customer)/help')} />
          <SettingRow icon="information-circle-outline" title="About" onPress={() => router.push('/(customer)/about')} />
        </View>

        {/* Danger Zone */}
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm, marginTop: 20 }]}>
          <SettingRow icon="log-out-outline" title="Logout" danger onPress={handleLogout} />
          <SettingRow icon="trash-outline" title="Delete Account" danger subtitle="Permanently delete all data" onPress={handleDeleteAccount} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginTop: 24, marginBottom: 10, marginLeft: 4 },
  card: { borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  langToggle: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
});
