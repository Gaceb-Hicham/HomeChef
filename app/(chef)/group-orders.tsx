import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, Button, Input } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { groupOrdersApi, prepMenuApi } from '@/lib/api';
import { infoAlert } from '@/lib/crossAlert';
import { useToast } from '@/components/ui/Toast';

export default function ChefGroupOrdersScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { showToast } = useToast();

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [targetQty, setTargetQty] = useState('10');
  const [deadline, setDeadline] = useState('24'); // hours from now
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!profile?.id) return;
    const { data: items } = await prepMenuApi.getByChef(profile.id);
    setMenuItems(items || []);
    const { data: groups } = await groupOrdersApi.getOpen();
    setMyGroups((groups || []).filter((g: any) => g.initiator_id === profile.id));
  };

  const handleCreate = async () => {
    if (!title) { infoAlert('Error', 'Title is required'); return; }
    if (!profile?.id) return;
    setIsLoading(true);
    const now = new Date();
    const dl = new Date(now.getTime() + parseInt(deadline) * 60 * 60 * 1000);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await groupOrdersApi.create({
      initiator_id: profile.id,
      chef_id: profile.id,
      title,
      menu_item_id: selectedItemId || null,
      target_quantity: parseInt(targetQty) || 10,
      current_quantity: 0,
      deadline: dl.toISOString(),
      invite_code: code,
      status: 'open',
    });
    setIsLoading(false);
    if (error) { infoAlert('Error', error); } else {
      showToast('Group order created! Share the invite code 🎉', 'success');
      setShowForm(false);
      setTitle('');
      loadData();
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>👥 Group Orders</Text>
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Ionicons name={showForm ? 'close' : 'add-circle'} size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={{ color: colors.onSurfaceVariant, marginBottom: 16, lineHeight: 20 }}>
          Create group orders so customers can pool together for bulk pricing. Share the invite code!
        </Text>

        {/* Create Form */}
        {showForm && (
          <View style={[styles.formCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <Text style={[styles.formTitle, { color: colors.onBackground }]}>New Group Order</Text>
            <Input label="Title" value={title} onChangeText={setTitle} icon="people-outline"
              placeholder="e.g. Weekly Couscous Group Buy" />
            <View style={{ height: 12 }} />

            {menuItems.length > 0 && (
              <>
                <Text style={{ color: colors.onSurfaceVariant, fontWeight: '600', marginBottom: 8 }}>Link to Prep Menu Item (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <TouchableOpacity onPress={() => setSelectedItemId(null)}
                    style={[styles.itemChip, { backgroundColor: !selectedItemId ? colors.primary : colors.surfaceContainerLow }]}>
                    <Text style={{ color: !selectedItemId ? '#fff' : colors.onSurface, fontWeight: '600', fontSize: 13 }}>None</Text>
                  </TouchableOpacity>
                  {menuItems.map((item: any) => (
                    <TouchableOpacity key={item.id} onPress={() => setSelectedItemId(item.id)}
                      style={[styles.itemChip, { backgroundColor: selectedItemId === item.id ? colors.primary : colors.surfaceContainerLow }]}>
                      <Text style={{ color: selectedItemId === item.id ? '#fff' : colors.onSurface, fontWeight: '600', fontSize: 13 }}>{item.title}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Target Quantity */}
            <Text style={{ color: colors.onSurfaceVariant, fontWeight: '600', marginBottom: 8 }}>Target Quantity</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <TouchableOpacity onPress={() => setTargetQty(String(Math.max(2, parseInt(targetQty) - 1)))}>
                <Ionicons name="remove-circle" size={32} color={colors.primary} />
              </TouchableOpacity>
              <Text style={{ color: colors.onSurface, fontWeight: '800', fontSize: 24 }}>{targetQty}</Text>
              <TouchableOpacity onPress={() => setTargetQty(String(parseInt(targetQty) + 1))}>
                <Ionicons name="add-circle" size={32} color={colors.primary} />
              </TouchableOpacity>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>portions needed</Text>
            </View>

            {/* Deadline */}
            <Text style={{ color: colors.onSurfaceVariant, fontWeight: '600', marginBottom: 8 }}>Deadline</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {['6', '12', '24', '48', '72'].map(h => (
                <TouchableOpacity key={h} onPress={() => setDeadline(h)}
                  style={[styles.itemChip, { backgroundColor: deadline === h ? colors.primary : colors.surfaceContainerLow }]}>
                  <Ionicons name="time-outline" size={13} color={deadline === h ? '#fff' : colors.onSurface} />
                  <Text style={{ color: deadline === h ? '#fff' : colors.onSurface, fontWeight: '600', fontSize: 13, marginLeft: 4 }}>
                    {parseInt(h) < 24 ? `${h}h` : `${parseInt(h) / 24}d`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Create Group Order" onPress={handleCreate} loading={isLoading} style={{ marginTop: 16 }} />
          </View>
        )}

        {/* My Active Group Orders */}
        <Text style={[styles.section, { color: colors.onBackground }]}>My Active Group Orders</Text>
        {myGroups.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.outline} />
            <Text style={{ color: colors.outline, marginTop: 12 }}>No active group orders</Text>
            <Button title="Create One" onPress={() => setShowForm(true)} variant="outline" style={{ marginTop: 16 }} />
          </View>
        ) : (
          myGroups.map((g: any) => {
            const progress = Math.min(100, (g.current_quantity / g.target_quantity) * 100);
            return (
              <View key={g.id} style={[styles.groupCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
                <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 16 }}>{g.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <Ionicons name="link" size={14} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>Code: {g.invite_code}</Text>
                </View>
                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>{g.current_quantity} / {g.target_quantity}</Text>
                    <Text style={{ color: progress >= 100 ? '#16a34a' : colors.primary, fontSize: 12, fontWeight: '700' }}>
                      {progress >= 100 ? '✅ Ready!' : `${Math.round(progress)}%`}
                    </Text>
                  </View>
                  <View style={[styles.progressBg, { backgroundColor: colors.surfaceContainerLow }]}>
                    <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: progress >= 100 ? '#16a34a' : colors.primary }]} />
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  section: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 12, marginTop: 20 },
  formCard: { padding: 18, borderRadius: 16, marginBottom: 20 },
  formTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 14 },
  itemChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, marginRight: 8 },
  groupCard: { padding: 18, borderRadius: 16, marginBottom: 14 },
  progressBg: { height: 8, borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4 },
  empty: { alignItems: 'center', paddingVertical: 50 },
});
