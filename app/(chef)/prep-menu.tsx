import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, Button, Input } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { prepMenuApi } from '@/lib/api';
import { crossAlert, infoAlert } from '@/lib/crossAlert';
import { useToast } from '@/components/ui/Toast';
import { PostImage } from '@/components/ui/PostImage';

export default function PrepMenuScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { showToast } = useToast();

  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [minQty, setMinQty] = useState('1');
  const [minNotice, setMinNotice] = useState('24');

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    const { data } = await prepMenuApi.getByChef(profile.id);
    setItems(data || []);
    setIsLoading(false);
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setBasePrice(''); setNegotiable(false);
    setMinQty('1'); setMinNotice('24'); setEditingId(null); setShowForm(false);
  };

  const handleSave = async () => {
    if (!title || !basePrice) { infoAlert('Error', 'Title and price are required'); return; }
    const payload = {
      chef_id: profile?.id,
      title, description, base_price: parseInt(basePrice),
      price_negotiable: negotiable, min_order_qty: parseInt(minQty) || 1,
      min_notice_hours: parseInt(minNotice) || 24,
    };

    if (editingId) {
      const { error } = await prepMenuApi.update(editingId, payload);
      if (error) { infoAlert('Error', error); } else { showToast('Item updated!', 'success'); resetForm(); fetchItems(); }
    } else {
      const { error } = await prepMenuApi.create(payload);
      if (error) { infoAlert('Error', error); } else { showToast('Item added!', 'success'); resetForm(); fetchItems(); }
    }
  };

  const handleEdit = (item: any) => {
    setTitle(item.title); setDescription(item.description || '');
    setBasePrice(String(item.base_price)); setNegotiable(item.price_negotiable);
    setMinQty(String(item.min_order_qty)); setMinNotice(String(item.min_notice_hours));
    setEditingId(item.id); setShowForm(true);
  };

  const handleDelete = (id: string) => {
    crossAlert('Delete Item', 'This will remove the item from your prep menu.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await prepMenuApi.remove(id);
        showToast('Item removed', 'success');
        fetchItems();
      }},
    ]);
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>Prep Menu</Text>
          <TouchableOpacity onPress={() => { resetForm(); setShowForm(!showForm); }}>
            <Ionicons name={showForm ? 'close' : 'add-circle'} size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={{ color: colors.outline, marginBottom: 16 }}>
          Items customers can request you to prepare on demand
        </Text>

        {/* Add/Edit Form */}
        {showForm && (
          <View style={[styles.formCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <Text style={[styles.formTitle, { color: colors.onBackground }]}>{editingId ? 'Edit Item' : 'New Prep Item'}</Text>
            <Input label="Dish Name" value={title} onChangeText={setTitle} icon="restaurant-outline" />
            <View style={{ height: 12 }} />
            <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={2} icon="document-text-outline" />
            <View style={{ height: 12 }} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}><Input label="Base Price (DA)" value={basePrice} onChangeText={setBasePrice} keyboardType="numeric" icon="cash-outline" /></View>
              <View style={{ flex: 1 }}><Input label="Min Quantity" value={minQty} onChangeText={setMinQty} keyboardType="numeric" icon="cube-outline" /></View>
            </View>
            <View style={{ height: 12 }} />
            <Input label="Min Notice (hours)" value={minNotice} onChangeText={setMinNotice} keyboardType="numeric" icon="time-outline" />
            <TouchableOpacity style={[styles.toggleRow, { borderColor: colors.outlineVariant }]} onPress={() => setNegotiable(!negotiable)}>
              <Text style={{ color: colors.onSurface, fontWeight: '600' }}>Price Negotiable</Text>
              <View style={[styles.toggleDot, { backgroundColor: negotiable ? colors.primary : colors.outline }]}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{negotiable ? 'ON' : 'OFF'}</Text>
              </View>
            </TouchableOpacity>
            <Button title={editingId ? 'Update Item' : 'Add Item'} onPress={handleSave} style={{ marginTop: 16 }} />
          </View>
        )}

        {/* Items List */}
        {items.length === 0 && !showForm ? (
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={48} color={colors.outline} />
            <Text style={{ color: colors.outline, fontSize: 16, marginTop: 12 }}>No prep menu items yet</Text>
            <Button title="Add First Item" onPress={() => setShowForm(true)} variant="outline" style={{ marginTop: 16 }} />
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 16 }}>{item.title}</Text>
                {item.description && <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, marginTop: 4 }} numberOfLines={2}>{item.description}</Text>}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                  <View style={[styles.chip, { backgroundColor: '#dcfce7' }]}>
                    <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '600' }}>{item.base_price} DA</Text>
                  </View>
                  <View style={[styles.chip, { backgroundColor: '#f1f5f9' }]}>
                    <Text style={{ color: '#64748b', fontSize: 11 }}>Min {item.min_order_qty}</Text>
                  </View>
                  <View style={[styles.chip, { backgroundColor: '#f1f5f9' }]}>
                    <Text style={{ color: '#64748b', fontSize: 11 }}>{item.min_notice_hours}h notice</Text>
                  </View>
                  {item.price_negotiable && (
                    <View style={[styles.chip, { backgroundColor: '#fef3c7' }]}>
                      <Text style={{ color: '#b45309', fontSize: 11 }}>Negotiable</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={{ gap: 8 }}>
                <TouchableOpacity onPress={() => handleEdit(item)}>
                  <Ionicons name="create-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Ionicons name="trash-outline" size={22} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  formCard: { padding: 18, borderRadius: 16, marginBottom: 20 },
  formTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, marginTop: 12, borderTopWidth: 1 },
  toggleDot: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  itemCard: { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'flex-start' },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  empty: { alignItems: 'center', paddingVertical: 60 },
});
