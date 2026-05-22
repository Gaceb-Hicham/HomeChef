import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, Button, Input } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { specialtiesApi } from '@/lib/api';
import { crossAlert, infoAlert } from '@/lib/crossAlert';
import { useToast } from '@/components/ui/Toast';

const CATEGORIES = ['Desserts', 'Savory', 'Pastries', 'Drinks', 'Healthy', 'Traditional', 'Other'];
const AVAILABILITY = [
  { value: 'always', label: 'Always Available', icon: 'checkmark-circle', color: '#16a34a' },
  { value: 'seasonal', label: 'Seasonal', icon: 'leaf', color: '#b45309' },
  { value: 'on_request', label: 'On Request', icon: 'chatbubble', color: '#4338ca' },
];

export default function SpecialtiesScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { showToast } = useToast();

  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [prepTime, setPrepTime] = useState('24');
  const [availability, setAvailability] = useState('always');
  const [category, setCategory] = useState('Other');

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    if (!profile?.id) return;
    const { data } = await specialtiesApi.getByChef(profile.id);
    setItems(data || []);
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setPriceMin(''); setPriceMax('');
    setPrepTime('24'); setAvailability('always'); setCategory('Other');
    setEditingId(null); setShowForm(false);
  };

  const handleSave = async () => {
    if (!title || !priceMin || !priceMax) { infoAlert('Error', 'Title and price range required'); return; }
    const payload = {
      chef_id: profile?.id, title, description,
      price_range_min: parseInt(priceMin), price_range_max: parseInt(priceMax),
      prep_time_hours: parseInt(prepTime) || 24, availability, category,
    };

    if (editingId) {
      const { error } = await specialtiesApi.update(editingId, payload);
      if (error) { infoAlert('Error', error); } else { showToast('Updated!', 'success'); resetForm(); fetchItems(); }
    } else {
      const { error } = await specialtiesApi.create(payload);
      if (error) { infoAlert('Error', error); } else { showToast('Specialty added!', 'success'); resetForm(); fetchItems(); }
    }
  };

  const handleEdit = (item: any) => {
    setTitle(item.title); setDescription(item.description || '');
    setPriceMin(String(item.price_range_min)); setPriceMax(String(item.price_range_max));
    setPrepTime(String(item.prep_time_hours)); setAvailability(item.availability);
    setCategory(item.category || 'Other'); setEditingId(item.id); setShowForm(true);
  };

  const handleDelete = (id: string) => {
    crossAlert('Delete Specialty', 'Remove this from your catalog?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await specialtiesApi.remove(id); showToast('Removed', 'success'); fetchItems(); } },
    ]);
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>Specialties</Text>
          <TouchableOpacity onPress={() => { resetForm(); setShowForm(!showForm); }}>
            <Ionicons name={showForm ? 'close' : 'add-circle'} size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {showForm && (
          <View style={[styles.formCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <Text style={[styles.formTitle, { color: colors.onBackground }]}>{editingId ? 'Edit Specialty' : 'New Specialty'}</Text>
            <Input label="Name" value={title} onChangeText={setTitle} icon="star-outline" />
            <View style={{ height: 12 }} />
            <Input label="Description" value={description} onChangeText={setDescription} multiline icon="document-text-outline" />
            <View style={{ height: 12 }} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}><Input label="Price Min (DA)" value={priceMin} onChangeText={setPriceMin} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Input label="Price Max (DA)" value={priceMax} onChangeText={setPriceMax} keyboardType="numeric" /></View>
            </View>
            <View style={{ height: 12 }} />
            <Input label="Prep Time (hours)" value={prepTime} onChangeText={setPrepTime} keyboardType="numeric" icon="time-outline" />

            {/* Category */}
            <Text style={{ color: colors.onSurfaceVariant, fontWeight: '600', marginTop: 14, marginBottom: 8 }}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
                  style={[styles.catChip, { backgroundColor: category === cat ? colors.primary : colors.surfaceContainerLow }]}>
                  <Text style={{ color: category === cat ? '#fff' : colors.onSurface, fontSize: 13, fontWeight: '600' }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Availability */}
            <Text style={{ color: colors.onSurfaceVariant, fontWeight: '600', marginTop: 14, marginBottom: 8 }}>Availability</Text>
            {AVAILABILITY.map((a) => (
              <TouchableOpacity key={a.value} onPress={() => setAvailability(a.value)}
                style={[styles.availRow, { borderColor: availability === a.value ? a.color : colors.outlineVariant }]}>
                <Ionicons name={a.icon as any} size={18} color={a.color} />
                <Text style={{ flex: 1, color: colors.onSurface, marginLeft: 10, fontWeight: '600' }}>{a.label}</Text>
                {availability === a.value && <Ionicons name="checkmark-circle" size={20} color={a.color} />}
              </TouchableOpacity>
            ))}

            <Button title={editingId ? 'Update' : 'Add Specialty'} onPress={handleSave} style={{ marginTop: 16 }} />
          </View>
        )}

        {/* Grid */}
        {items.length === 0 && !showForm ? (
          <View style={styles.empty}>
            <Ionicons name="star-outline" size={48} color={colors.outline} />
            <Text style={{ color: colors.outline, fontSize: 16, marginTop: 12 }}>No specialties yet</Text>
            <Button title="Add First Specialty" onPress={() => setShowForm(true)} variant="outline" style={{ marginTop: 16 }} />
          </View>
        ) : (
          <View style={styles.grid}>
            {items.map((item) => (
              <View key={item.id} style={[styles.gridItem, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
                <View style={[styles.gridIcon, { backgroundColor: colors.surfaceContainerLow }]}>
                  <Ionicons name="star" size={24} color={colors.primary} />
                </View>
                <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 14, marginTop: 8 }} numberOfLines={2}>{item.title}</Text>
                <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 4 }}>{item.price_range_min}-{item.price_range_max} DA</Text>
                <View style={[styles.catBadge, { backgroundColor: '#f1f5f9' }]}>
                  <Text style={{ color: '#64748b', fontSize: 10 }}>{item.category}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 'auto', paddingTop: 10 }}>
                  <TouchableOpacity onPress={() => handleEdit(item)}><Ionicons name="create-outline" size={18} color={colors.primary} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}><Ionicons name="trash-outline" size={18} color="#dc2626" /></TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  formCard: { padding: 18, borderRadius: 16, marginBottom: 20 },
  formTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 14 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, marginRight: 8 },
  availRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47%', padding: 14, borderRadius: 16, minHeight: 160 },
  gridIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 6 },
  empty: { alignItems: 'center', paddingVertical: 60 },
});
