import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, Button } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { prepRequestsApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { infoAlert } from '@/lib/crossAlert';
import { useToast } from '@/components/ui/Toast';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#fef3c7', text: '#b45309', label: 'Pending' },
  accepted: { bg: '#dcfce7', text: '#16a34a', label: 'Accepted' },
  rejected: { bg: '#fce4ec', text: '#c62828', label: 'Rejected' },
  countered: { bg: '#e0e7ff', text: '#4338ca', label: 'Counter-Offer' },
};

export default function PrepRequestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { showToast } = useToast();

  const [request, setRequest] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRequest();
    fetchMessages();
    // Real-time messages
    const channel = supabase
      .channel(`prep-request-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `reference_id=eq.${id}` },
        (payload: any) => setMessages((prev) => [...prev, payload.new])
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const fetchRequest = async () => {
    const { data } = await supabase
      .from('prep_requests')
      .select(`*, menu_item:prep_menu_items(*), chef:users!chef_id(full_name, profile_photo_url, chef_profiles(kitchen_name)), customer:users!customer_id(full_name, profile_photo_url)`)
      .eq('id', id)
      .single();
    setRequest(data);
    setIsLoading(false);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:users!sender_id(full_name, profile_photo_url)')
      .eq('reference_id', id)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile?.id) return;
    const recipientId = profile.id === request?.customer_id ? request?.chef_id : request?.customer_id;
    await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: recipientId,
      content: newMessage.trim(),
      reference_id: id,
      reference_type: 'prep_request',
    });
    setNewMessage('');
  };

  const handleAcceptCounter = async () => {
    if (!request) return;
    const { error } = await prepRequestsApi.respond(request.id, { status: 'accepted' });
    if (error) { infoAlert('Error', error); } else {
      showToast('Counter-offer accepted!', 'success');
      fetchRequest();
    }
  };

  const handleDeclineCounter = async () => {
    if (!request) return;
    const { error } = await prepRequestsApi.respond(request.id, { status: 'rejected' });
    if (error) { infoAlert('Error', error); } else {
      showToast('Request declined', 'info');
      fetchRequest();
    }
  };

  if (isLoading || !request) {
    return (<ScreenWrapper><View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colors.outline }}>Loading...</Text>
    </View></ScreenWrapper>);
  }

  const statusInfo = STATUS_COLORS[request.status] || STATUS_COLORS.pending;
  const isCustomer = profile?.id === request.customer_id;

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.onBackground }]}>Request Details</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <Text style={{ color: statusInfo.text, fontSize: 12, fontWeight: '700' }}>{statusInfo.label}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Request Details Card */}
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <Text style={[styles.cardTitle, { color: colors.onBackground }]}>
            {request.menu_item?.title || 'Dish'}
          </Text>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={{ color: colors.onSurfaceVariant, marginLeft: 8 }}>
              {new Date(request.requested_date).toLocaleDateString()} at {new Date(request.requested_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={16} color={colors.primary} />
            <Text style={{ color: colors.onSurfaceVariant, marginLeft: 8 }}>Quantity: {request.quantity}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color={colors.primary} />
            <Text style={{ color: colors.onSurfaceVariant, marginLeft: 8 }}>Offered: {request.offered_price} DA</Text>
          </View>
          {request.note && (
            <View style={[styles.noteBox, { backgroundColor: colors.surfaceContainerLow }]}>
              <Text style={{ color: colors.onSurfaceVariant, fontStyle: 'italic' }}>{request.note}</Text>
            </View>
          )}
        </View>

        {/* Counter-Offer Card */}
        {request.status === 'countered' && (
          <View style={[styles.card, { backgroundColor: '#eef2ff', borderColor: '#818cf8', borderWidth: 1 }]}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#4338ca', marginBottom: 10 }}>
              ⚡ Counter-Offer from Chef
            </Text>
            {request.counter_price && (
              <View style={styles.detailRow}>
                <Ionicons name="pricetag" size={16} color="#4338ca" />
                <Text style={{ color: '#4338ca', fontWeight: '600', marginLeft: 8 }}>
                  New Price: {request.counter_price} DA
                </Text>
              </View>
            )}
            {request.counter_date && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={16} color="#4338ca" />
                <Text style={{ color: '#4338ca', fontWeight: '600', marginLeft: 8 }}>
                  New Date: {new Date(request.counter_date).toLocaleDateString()}
                </Text>
              </View>
            )}
            {request.chef_response_note && (
              <Text style={{ color: '#4338ca', marginTop: 8, fontStyle: 'italic' }}>"{request.chef_response_note}"</Text>
            )}
            {isCustomer && (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#16a34a' }]} onPress={handleAcceptCounter}>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dc2626' }]} onPress={handleDeclineCounter}>
                  <Ionicons name="close" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Decline</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Accepted → Pay Now */}
        {request.status === 'accepted' && isCustomer && (
          <TouchableOpacity
            style={[styles.payBtn, { ...shadows.md }]}
            onPress={() => router.push({ pathname: '/(customer)/checkout', params: { fromPrepRequest: request.id } })}
          >
            <Ionicons name="card" size={20} color="#fff" />
            <Text style={styles.payBtnText}>Pay Now — {request.counter_price || request.offered_price} DA</Text>
          </TouchableOpacity>
        )}

        {/* Messages Thread */}
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>💬 Conversation</Text>
        {messages.length === 0 ? (
          <Text style={{ color: colors.outline, textAlign: 'center', marginVertical: 20 }}>No messages yet. Start the conversation!</Text>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === profile?.id;
            return (
              <View key={msg.id} style={[styles.msgBubble, isMine ? styles.myMsg : styles.theirMsg, { backgroundColor: isMine ? colors.primary : colors.surfaceContainerLow }]}>
                <Text style={{ color: isMine ? '#fff' : colors.onSurface, fontSize: 14 }}>{msg.content}</Text>
                <Text style={{ color: isMine ? 'rgba(255,255,255,0.6)' : colors.outline, fontSize: 10, marginTop: 4, textAlign: 'right' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Message Input */}
      <View style={[styles.inputRow, { backgroundColor: colors.surfaceContainerLowest, borderTopColor: colors.outlineVariant }]}>
        <TextInput
          style={[styles.msgInput, { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.outline}
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={sendMessage}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 20, fontWeight: '700', flex: 1, marginLeft: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  card: { padding: 18, borderRadius: 16, marginBottom: 16 },
  cardTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  noteBox: { padding: 12, borderRadius: 10, marginTop: 8 },
  sectionTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  payBtn: { backgroundColor: '#16a34a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, marginBottom: 16 },
  payBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  msgBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
  myMsg: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirMsg: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1 },
  msgInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, fontSize: 14 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
