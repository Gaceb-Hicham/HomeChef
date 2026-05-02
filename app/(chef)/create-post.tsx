import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Button, Input, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

export default function CreatePostScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [deadline, setDeadline] = useState('14:00');
  const [delivery, setDelivery] = useState(true);
  const [pickup, setPickup] = useState(true);
  const [preorder, setPreorder] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePublish = () => {
    if (!title.trim() || !price || !quantity) {
      Alert.alert('Missing Fields', 'Please fill in title, price, and quantity.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Published! 🎉', 'Your daily special is now live. All followers have been notified.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    }, 2000);
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>Post Special</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Photo upload area */}
        <TouchableOpacity style={[styles.photoArea, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
          <Ionicons name="camera-outline" size={32} color={colors.outline} />
          <Text style={{ color: colors.outline, marginTop: 8, fontSize: 14 }}>Add Photos (up to 5)</Text>
          <Text style={{ color: colors.outline, fontSize: 12 }}>Tap to upload or drag to reorder</Text>
        </TouchableOpacity>

        <Input label="Dish Name *" placeholder="e.g. Couscous Royal" value={title} onChangeText={setTitle} icon="restaurant-outline" />
        <Input label="Description" placeholder="Describe your dish..." value={description} onChangeText={setDescription}
          multiline numberOfLines={3} style={{ minHeight: 70, textAlignVertical: 'top' }} />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Input label="Price (DA) *" placeholder="850" value={price} onChangeText={setPrice} keyboardType="numeric" icon="pricetag-outline" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Quantity *" placeholder="15" value={quantity} onChangeText={setQuantity} keyboardType="numeric" icon="layers-outline" />
          </View>
        </View>

        <Input label="Order Deadline *" placeholder="14:00" value={deadline} onChangeText={setDeadline} icon="time-outline" />

        {/* Toggles */}
        <View style={[styles.toggleCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          {[
            { label: 'Delivery Available', value: delivery, onChange: setDelivery, icon: 'bicycle-outline' },
            { label: 'Pickup Available', value: pickup, onChange: setPickup, icon: 'storefront-outline' },
            { label: 'Allow Pre-orders', value: preorder, onChange: setPreorder, icon: 'calendar-outline' },
          ].map((t, idx) => (
            <View key={t.label} style={[styles.toggleRow, idx < 2 && { borderBottomColor: colors.outlineVariant, borderBottomWidth: 0.5 }]}>
              <Ionicons name={t.icon as any} size={20} color={colors.onSurfaceVariant} />
              <Text style={[styles.toggleLabel, { color: colors.onSurface }]}>{t.label}</Text>
              <Switch value={t.value} onValueChange={t.onChange} trackColor={{ true: colors.primary, false: colors.outlineVariant }}
                thumbColor="#fff" />
            </View>
          ))}
        </View>

        <Button title="Publish Special" onPress={handlePublish} loading={isLoading} size="lg" />
        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  photoArea: { height: 140, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  toggleCard: { borderRadius: 16, marginBottom: 24, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  toggleLabel: { flex: 1, fontFamily: 'PlusJakartaSans-Regular', fontSize: 15 },
});
