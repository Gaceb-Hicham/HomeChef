import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { Button, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const MENU_ITEMS = [
  { icon: 'person-outline', label: 'Edit Profile', route: '' },
  { icon: 'location-outline', label: 'My Addresses', route: '' },
  { icon: 'card-outline', label: 'Payment Methods', route: '' },
  { icon: 'heart-outline', label: 'Saved Favorites', route: '/(customer)/saved' },
  { icon: 'notifications-outline', label: 'Notifications', route: '/(customer)/notifications' },
  { icon: 'language-outline', label: 'Language', route: '' },
  { icon: 'moon-outline', label: 'Dark Mode', route: '' },
  { icon: 'help-circle-outline', label: 'Help & Support', route: '' },
  { icon: 'information-circle-outline', label: 'About HomeChef', route: '' },
];

export default function ProfileScreen() {
  const { colors, shadows } = useTheme();
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { signOut(); router.replace('/(auth)/login'); } },
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
            {[{ n: '12', l: 'Orders' }, { n: '5', l: 'Reviews' }, { n: '8', l: 'Saved' }].map((s) => (
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
              onPress={() => item.route && router.push(item.route as any)}
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
          <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.outline }]}>HomeChef v1.0.0</Text>
      </ScrollView>
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
});
