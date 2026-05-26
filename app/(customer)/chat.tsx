import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { ScreenWrapper, AvatarImage } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  order_id?: string;
  reference_id?: string;
  reference_type?: string;
};

export default function ChatScreen() {
  const { orderId, chefId, chefName } = useLocalSearchParams<{
    orderId?: string; chefId?: string; chefName?: string;
  }>();
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Determine chat context: order-based or direct message
  const isOrderChat = !!orderId;
  const targetUserId = chefId || '';

  // Generate a stable channel ID for direct messages
  const channelId = isOrderChat
    ? orderId!
    : [profile?.id, targetUserId].sort().join('-');

  // Fetch messages
  useEffect(() => {
    if (!profile?.id) return;
    const load = async () => {
      try {
        let query;
        if (isOrderChat) {
          // Order-based chat
          query = supabase
            .from('messages')
            .select('*')
            .eq('order_id', orderId!)
            .order('created_at', { ascending: true });
        } else {
          // Direct message chat — fetch messages between the two users
          query = supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${profile.id})`)
            .is('order_id', null)
            .order('created_at', { ascending: true });
        }
        const { data } = await query;
        if (data) setMessages(data);
      } catch (e) {}
    };
    load();

    // Subscribe to new messages
    const filterCol = isOrderChat ? 'order_id' : 'reference_id';
    const filterVal = isOrderChat ? orderId! : `dm-${channelId}`;
    const channel = supabase
      .channel(`chat-${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const newMsg = payload.new as Message;
        // Only add if relevant to this chat
        if (isOrderChat && newMsg.order_id === orderId) {
          setMessages((prev) => [...prev, newMsg]);
        } else if (!isOrderChat && (
          (newMsg.sender_id === profile?.id && newMsg.receiver_id === targetUserId) ||
          (newMsg.sender_id === targetUserId && newMsg.receiver_id === profile?.id)
        )) {
          setMessages((prev) => [...prev, newMsg]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, targetUserId, profile?.id]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || !profile?.id) return;
    setSending(true);
    try {
      const msgData: any = {
        sender_id: profile.id,
        receiver_id: targetUserId,
        content: input.trim(),
      };
      if (isOrderChat) {
        msgData.order_id = orderId;
      } else {
        // Direct message — no order_id
        msgData.reference_type = 'direct_message';
        msgData.reference_id = `dm-${channelId}`;
      }
      await supabase.from('messages').insert(msgData);
      setInput('');
    } catch (e) {}
    setSending(false);
  };

  const isMe = (msg: Message) => msg.sender_id === profile?.id;

  return (
    <ScreenWrapper padded={false}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AvatarImage uri={null} size={36} emoji="👨‍🍳" />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 16 }}>
            {chefName || 'Chat'}
          </Text>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 11 }}>
            {isOrderChat ? `Order #${orderId?.substring(0, 8)}` : 'Direct Message'}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>💬</Text>
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, textAlign: 'center' }}>
              Start a conversation.{'\n'}Be polite and specific!
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.bubble, {
            alignSelf: isMe(item) ? 'flex-end' : 'flex-start',
            backgroundColor: isMe(item) ? colors.primary : colors.surfaceContainerLow,
            borderBottomRightRadius: isMe(item) ? 4 : 16,
            borderBottomLeftRadius: isMe(item) ? 16 : 4,
          }]}>
            <Text style={{ color: isMe(item) ? colors.onPrimary : colors.onSurface, fontSize: 15, lineHeight: 22 }}>
              {item.content}
            </Text>
            <Text style={{ color: isMe(item) ? 'rgba(255,255,255,0.6)' : colors.outline, fontSize: 10, marginTop: 4, textAlign: 'right' }}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputBar, { backgroundColor: colors.surfaceContainerLowest, borderTopColor: colors.outlineVariant }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.outline}
            style={[styles.textInput, { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface }]}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity onPress={sendMessage} disabled={!input.trim() || sending}
            style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.surfaceContainerHigh }]}>
            <Ionicons name="send" size={20} color={input.trim() ? colors.onPrimary : colors.outline} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10, borderTopWidth: 1 },
  textInput: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100, fontFamily: 'PlusJakartaSans-Regular' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
