import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, Button, Input } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { groupOrdersApi } from '@/lib/api';
import { infoAlert } from '@/lib/crossAlert';
import { useToast } from '@/components/ui/Toast';

export default function GroupOrdersScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { showToast } = useToast();

  const [groups, setGroups] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [joinQty, setJoinQty] = useState('1');

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    const { data } = await groupOrdersApi.getOpen();
    setGroups(data || []);
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) { infoAlert('Error', 'Enter an invite code'); return; }
    const { data, error } = await groupOrdersApi.getByCode(joinCode.trim());
    if (error || !data) { infoAlert('Error', 'Invalid code'); return; }
    const { error: joinErr } = await groupOrdersApi.join(data.id, profile?.id || '', parseInt(joinQty) || 1);
    if (joinErr) { infoAlert('Error', joinErr); } else {
      showToast('Joined group order! 🎉', 'success');
      setJoinCode(''); setJoinQty('1');
      fetchGroups();
    }
  };

  const handleJoin = async (groupId: string) => {
    if (!profile?.id) return;
    const { error } = await groupOrdersApi.join(groupId, profile.id, 1);
    if (error) { infoAlert('Error', error); } else {
      showToast('Joined! 🎉', 'success');
      fetchGroups();
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>👥 Group Orders</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={{ color: colors.onSurfaceVariant, marginBottom: 20, lineHeight: 20 }}>
          Join a group order to unlock bulk pricing! When the target is reached, the chef starts preparing.
        </Text>

        {/* Join by Code */}
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 15, marginBottom: 10 }}>🔗 Have an Invite Code?</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Input label="" placeholder="Enter code" value={joinCode} onChangeText={setJoinCode} /></View>
            <View style={{ flex: 0.5 }}><Input label="" placeholder="Qty" value={joinQty} onChangeText={setJoinQty} keyboardType="numeric" /></View>
          </View>
          <Button title="Join" onPress={handleJoinByCode} style={{ marginTop: 12 }} />
        </View>

        {/* Open Groups */}
        <Text style={[styles.section, { color: colors.onBackground }]}>Open Group Orders</Text>
        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.outline} />
            <Text style={{ color: colors.outline, marginTop: 12 }}>No group orders right now</Text>
          </View>
        ) : (
          groups.map((g) => {
            const progress = Math.min(100, (g.current_quantity / g.target_quantity) * 100);
            const timeLeft = Math.max(0, Math.floor((new Date(g.deadline).getTime() - Date.now()) / 3600000));
            return (
              <View key={g.id} style={[styles.groupCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 16 }}>{g.title}</Text>
                  <View style={[styles.timeBadge, { backgroundColor: timeLeft < 3 ? '#fce4ec' : '#fef3c7' }]}>
                    <Ionicons name="time" size={12} color={timeLeft < 3 ? '#dc2626' : '#b45309'} />
                    <Text style={{ color: timeLeft < 3 ? '#dc2626' : '#b45309', fontSize: 11, fontWeight: '600', marginLeft: 4 }}>{timeLeft}h left</Text>
                  </View>
                </View>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>
                  by {g.initiator?.full_name} · {g.menu_item?.title || 'Custom dish'}
                </Text>
                {g.menu_item?.base_price && (
                  <Text style={{ color: colors.primary, fontWeight: '600', marginTop: 4 }}>{g.menu_item.base_price} DA per unit</Text>
                )}

                {/* Progress Bar */}
                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>{g.current_quantity} / {g.target_quantity}</Text>
                    <Text style={{ color: progress >= 100 ? '#16a34a' : colors.primary, fontSize: 12, fontWeight: '700' }}>
                      {progress >= 100 ? '✅ Target Reached!' : `${Math.round(progress)}%`}
                    </Text>
                  </View>
                  <View style={[styles.progressBg, { backgroundColor: colors.surfaceContainerLow }]}>
                    <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: progress >= 100 ? '#16a34a' : colors.primary }]} />
                  </View>
                </View>

                {/* Invite Code */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 }}>
                  <Ionicons name="link" size={14} color={colors.outline} />
                  <Text style={{ color: colors.outline, fontSize: 12 }}>Code: {g.invite_code}</Text>
                </View>

                <TouchableOpacity style={[styles.joinBtn, { backgroundColor: progress >= 100 ? '#e5e7eb' : colors.primary }]}
                  disabled={progress >= 100} onPress={() => handleJoin(g.id)}>
                  <Ionicons name="person-add" size={16} color={progress >= 100 ? '#9ca3af' : '#fff'} />
                  <Text style={{ color: progress >= 100 ? '#9ca3af' : '#fff', fontWeight: '700', marginLeft: 6 }}>
                    {progress >= 100 ? 'Target Reached' : 'Join (+1)'}
                  </Text>
                </TouchableOpacity>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  section: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 12, marginTop: 20 },
  card: { padding: 18, borderRadius: 16, marginBottom: 16 },
  groupCard: { padding: 18, borderRadius: 16, marginBottom: 14 },
  timeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  progressBg: { height: 8, borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4 },
  joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, marginTop: 14 },
  empty: { alignItems: 'center', paddingVertical: 50 },
});
