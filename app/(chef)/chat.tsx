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
  order_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export default function ChefChatScreen() {
  const { orderId, customerId, customerName } = useLocalSearchParams<{
    orderId: string; customerId: string; customerName: string;
  }>();
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!orderId) return;
    const load = async () => {
      try {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true });
        if (data) setMessages(data);
      } catch (e) {}
    };
    load();

    const channel = supabase
      .channel(`chef-chat-${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `order_id=eq.${orderId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || !profile?.id || !orderId) return;
    setSending(true);
    try {
      await supabase.from('messages').insert({
        order_id: orderId,
        sender_id: profile.id,
        receiver_id: customerId,
        content: input.trim(),
      });
      setInput('');
    } catch (e) {}
    setSending(false);
  };

  const isMe = (msg: Message) => msg.sender_id === profile?.id;

  return (
    <ScreenWrapper padded={false}>
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AvatarImage uri={null} size={36} emoji="👤" />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 16 }}>
            {customerName || 'Customer'}
          </Text>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 11 }}>
            Order #{orderId?.substring(0, 8)}
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>💬</Text>
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, textAlign: 'center' }}>
              No messages yet.{'\n'}The customer may reach out about their order.
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
