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
import { useToast } from '@/components/ui/Toast';

export default function ChefSettingsScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const { locale, setLocale } = useLanguage();
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(true);
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifRequests, setNotifRequests] = useState(true);
  const [notifReviews, setNotifReviews] = useState(true);

  const handleToggleOpen = async (val: boolean) => {
    setIsOpen(val);
    if (profile?.id) {
      await supabase.from('chef_profiles').update({ is_open: val }).eq('user_id', profile.id);
      showToast(val ? 'Kitchen is now OPEN' : 'Kitchen is now CLOSED', val ? 'success' : 'info');
    }
  };

  const handleLogout = () => {
    crossAlert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const handleDelete = () => {
    crossAlert('Delete Account', 'This permanently deletes your account, all posts, and earnings data. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Forever', style: 'destructive', onPress: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) { await supabase.from('users').delete().eq('id', user.id); await supabase.auth.signOut(); router.replace('/(auth)/login'); }
      }},
    ]);
  };

  const Row = ({ icon, title, subtitle, right, onPress, danger }: any) => (
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
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>Chef Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Kitchen Status */}
        <View style={[styles.statusCard, { backgroundColor: isOpen ? '#dcfce7' : '#fce4ec', ...shadows.sm }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: isOpen ? '#16a34a' : '#dc2626' }}>
              {isOpen ? '🟢 Kitchen Open' : '🔴 Kitchen Closed'}
            </Text>
            <Text style={{ color: isOpen ? '#15803d' : '#b91c1c', fontSize: 12, marginTop: 4 }}>
              {isOpen ? 'You are accepting new orders' : 'Customers cannot place orders'}
            </Text>
          </View>
          <Switch value={isOpen} onValueChange={handleToggleOpen} trackColor={{ true: '#16a34a', false: '#fca5a5' }} />
        </View>

        {/* Kitchen Management */}
        <Text style={[styles.sectionLabel, { color: colors.outline }]}>KITCHEN</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <Row icon="restaurant-outline" title="Prep Menu" subtitle="Manage what you can cook on request" onPress={() => router.push('/(chef)/prep-menu')} />
          <Row icon="star-outline" title="Specialties" subtitle="Your signature dishes catalog" onPress={() => router.push('/(chef)/specialties')} />
          <Row icon="flash-outline" title="Flash Sales" subtitle="Create time-limited discounts" onPress={() => router.push('/(chef)/flash-sale')} />
          <Row icon="megaphone-outline" title="Teaser Posts" subtitle="Preview tomorrow's special" onPress={() => router.push('/(chef)/teaser')} />
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: colors.outline }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <Row icon="moon-outline" title="Dark Mode" right={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: colors.primary }} />} />
          <Row icon="language-outline" title="Language" subtitle={locale === 'ar' ? 'العربية' : 'English'}
            right={<TouchableOpacity style={[styles.langBtn, { backgroundColor: colors.primary }]} onPress={() => setLocale(locale === 'ar' ? 'en' : 'ar')}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{locale === 'ar' ? 'EN' : 'AR'}</Text>
            </TouchableOpacity>} />
        </View>

        {/* Notifications */}
        <Text style={[styles.sectionLabel, { color: colors.outline }]}>NOTIFICATIONS</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <Row icon="bag-check-outline" title="New Orders" right={<Switch value={notifOrders} onValueChange={setNotifOrders} trackColor={{ true: colors.primary }} />} />
          <Row icon="hand-left-outline" title="Prep Requests" right={<Switch value={notifRequests} onValueChange={setNotifRequests} trackColor={{ true: colors.primary }} />} />
          <Row icon="star-half-outline" title="Reviews" right={<Switch value={notifReviews} onValueChange={setNotifReviews} trackColor={{ true: colors.primary }} />} />
        </View>

        {/* Account */}
        <Text style={[styles.sectionLabel, { color: colors.outline }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <Row icon="chatbubbles-outline" title="Reviews Received" onPress={() => router.push('/(chef)/reviews')} />
          <Row icon="help-circle-outline" title="Help & Support" />
        </View>

        {/* Danger */}
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm, marginTop: 20 }]}>
          <Row icon="log-out-outline" title="Logout" danger onPress={handleLogout} />
          <Row icon="trash-outline" title="Delete Account" danger subtitle="Permanently delete everything" onPress={handleDelete} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginTop: 24, marginBottom: 10, marginLeft: 4 },
  statusCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 16, marginBottom: 8 },
  card: { borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  langBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
});
