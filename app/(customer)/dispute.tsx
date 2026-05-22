import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, Button, Input } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { disputesApi } from '@/lib/api';
import { infoAlert } from '@/lib/crossAlert';
import { useToast } from '@/components/ui/Toast';

const REASONS = [
  { value: 'not_delivered', label: 'Order Not Delivered', icon: 'close-circle' },
  { value: 'wrong_order', label: 'Wrong Order Received', icon: 'swap-horizontal' },
  { value: 'quality_issue', label: 'Quality Issue', icon: 'thumbs-down' },
  { value: 'late_delivery', label: 'Very Late Delivery', icon: 'time' },
  { value: 'other', label: 'Other Issue', icon: 'help-circle' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: '#fef3c7', text: '#b45309', label: 'Open' },
  chef_responded: { bg: '#e0e7ff', text: '#4338ca', label: 'Chef Responded' },
  resolved: { bg: '#dcfce7', text: '#16a34a', label: 'Resolved' },
  refunded: { bg: '#d1fae5', text: '#059669', label: 'Refunded' },
  escalated: { bg: '#fce4ec', text: '#dc2626', label: 'Escalated' },
};

export default function DisputeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId: string; chefId: string }>();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { showToast } = useToast();

  const [disputes, setDisputes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(!!params.orderId);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { fetchDisputes(); }, []);

  const fetchDisputes = async () => {
    if (!profile?.id) return;
    const { data } = await disputesApi.getByCustomer(profile.id);
    setDisputes(data || []);
  };

  const handleSubmit = async () => {
    if (!reason) { infoAlert('Error', 'Select a reason'); return; }
    if (!description.trim()) { infoAlert('Error', 'Describe the issue'); return; }
    setIsLoading(true);
    const { error } = await disputesApi.create({
      order_id: params.orderId,
      customer_id: profile?.id,
      chef_id: params.chefId,
      reason,
      description: description.trim(),
    });
    setIsLoading(false);
    if (error) { infoAlert('Error', error); } else {
      showToast('Dispute submitted. Chef has 24h to respond.', 'success');
      setShowForm(false); setReason(''); setDescription('');
      fetchDisputes();
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>⚖️ Disputes</Text>
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Ionicons name={showForm ? 'close' : 'add-circle'} size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* New Dispute Form */}
        {showForm && (
          <View style={[styles.formCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <Text style={{ color: colors.onBackground, fontWeight: '700', fontSize: 16, marginBottom: 14 }}>Open a Dispute</Text>
            <Text style={{ color: colors.onSurfaceVariant, fontWeight: '600', marginBottom: 8 }}>Reason</Text>
            {REASONS.map((r) => (
              <TouchableOpacity key={r.value} onPress={() => setReason(r.value)}
                style={[styles.reasonRow, { borderColor: reason === r.value ? colors.primary : colors.outlineVariant, backgroundColor: reason === r.value ? `${colors.primary}10` : 'transparent' }]}>
                <Ionicons name={r.icon as any} size={18} color={reason === r.value ? colors.primary : colors.outline} />
                <Text style={{ color: reason === r.value ? colors.primary : colors.onSurface, fontWeight: '600', marginLeft: 10, flex: 1 }}>{r.label}</Text>
                {reason === r.value && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}

            <Text style={{ color: colors.onSurfaceVariant, fontWeight: '600', marginTop: 14, marginBottom: 8 }}>Description</Text>
            <TextInput
              style={[styles.descInput, { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface }]}
              placeholder="Describe what happened in detail..."
              placeholderTextColor={colors.outline}
              value={description} onChangeText={setDescription}
              multiline numberOfLines={4}
            />
            <Button title="Submit Dispute" onPress={handleSubmit} loading={isLoading} style={{ marginTop: 16 }} />
          </View>
        )}

        {/* Disputes List */}
        <Text style={[styles.section, { color: colors.onBackground }]}>Your Disputes</Text>
        {disputes.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="shield-checkmark-outline" size={48} color={colors.outline} />
            <Text style={{ color: colors.outline, marginTop: 12 }}>No disputes. That's great!</Text>
          </View>
        ) : (
          disputes.map((d) => {
            const sc = STATUS_COLORS[d.status] || STATUS_COLORS.open;
            return (
              <View key={d.id} style={[styles.disputeCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: colors.onSurface, fontWeight: '700' }}>
                    {REASONS.find(r => r.value === d.reason)?.label || d.reason}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={{ color: sc.text, fontSize: 11, fontWeight: '700' }}>{sc.label}</Text>
                  </View>
                </View>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, lineHeight: 18 }}>{d.description}</Text>
                <Text style={{ color: colors.outline, fontSize: 11, marginTop: 6 }}>
                  Opened: {new Date(d.created_at).toLocaleDateString()}
                </Text>

                {d.chef_response && (
                  <View style={[styles.responseBox, { backgroundColor: colors.surfaceContainerLow }]}>
                    <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12, marginBottom: 4 }}>Chef's Response</Text>
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>{d.chef_response}</Text>
                  </View>
                )}

                {d.resolution && (
                  <View style={[styles.responseBox, { backgroundColor: '#dcfce7' }]}>
                    <Text style={{ color: '#16a34a', fontWeight: '600', fontSize: 12, marginBottom: 4 }}>Resolution</Text>
                    <Text style={{ color: '#15803d', fontSize: 13 }}>{d.resolution}</Text>
                  </View>
                )}
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
  section: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 12 },
  formCard: { padding: 18, borderRadius: 16, marginBottom: 20 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
  descInput: { padding: 12, borderRadius: 12, fontSize: 14, minHeight: 100, textAlignVertical: 'top' },
  disputeCard: { padding: 16, borderRadius: 16, marginBottom: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  responseBox: { padding: 12, borderRadius: 10, marginTop: 10 },
  empty: { alignItems: 'center', paddingVertical: 50 },
});
