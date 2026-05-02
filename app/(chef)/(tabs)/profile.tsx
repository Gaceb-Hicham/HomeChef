import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const MENU = [
  { icon: 'storefront-outline', label: 'Kitchen Settings' },
  { icon: 'images-outline', label: 'Kitchen Archive', route: '/(chef)/archive' },
  { icon: 'location-outline', label: 'Delivery Settings' },
  { icon: 'notifications-outline', label: 'Notifications' },
  { icon: 'card-outline', label: 'Bank Account' },
  { icon: 'language-outline', label: 'Language' },
  { icon: 'help-circle-outline', label: 'Help & Support' },
];

export default function ChefProfileScreen() {
  const { colors, shadows } = useTheme();
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryFixed }]}>
            <Text style={{ fontSize: 40 }}>👨‍🍳</Text>
          </View>
          <Text style={[styles.name, { color: colors.onBackground }]}>{profile?.full_name || 'Chef'}</Text>
          <Text style={[styles.kitchen, { color: colors.primary }]}>Mama's Kitchen</Text>
          <View style={styles.statRow}>
            {[{ n: '423', l: 'Orders' }, { n: '4.8', l: 'Rating' }, { n: '156', l: 'Followers' }].map((s) => (
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
              onPress={() => item.route && router.push(item.route as any)}
              style={[styles.menuItem, idx < MENU.length - 1 && { borderBottomColor: colors.outlineVariant, borderBottomWidth: 0.5 }]}>
              <Ionicons name={item.icon as any} size={22} color={colors.onSurfaceVariant} />
              <Text style={[styles.menuLabel, { color: colors.onSurface }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.outline} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.logout, { borderColor: colors.error }]}
          onPress={() => Alert.alert('Log Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: () => { signOut(); router.replace('/(auth)/login'); } },
          ])}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={{ color: colors.error, fontWeight: '600', fontSize: 15 }}>Log Out</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
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
});
