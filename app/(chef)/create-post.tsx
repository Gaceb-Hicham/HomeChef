import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { usePostsStore } from '@/stores/postsStore';
import { pickImage, uploadPostPhotos } from '@/lib/storage';
import { Button, Input, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { crossAlert, infoAlert } from '@/lib/crossAlert';

export default function CreatePostScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { createPost, isLoading: storeLoading } = usePostsStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [deadline, setDeadline] = useState('14:00');
  const [delivery, setDelivery] = useState(true);
  const [pickup, setPickup] = useState(true);
  const [preorder, setPreorder] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<{ uri: string; base64: string }[]>([]);

  const handlePickPhotos = async () => {
    try {
      const { assets, canceled } = await pickImage({ allowsMultipleSelection: true, aspect: [4, 3], quality: 0.7 });
      if (!canceled && assets) {
        const newPhotos = assets.slice(0, 5 - selectedPhotos.length).map((a: any) => ({
          uri: a.uri,
          base64: a.base64 || '',
        }));
        setSelectedPhotos([...selectedPhotos, ...newPhotos]);
      }
    } catch (e) {
      // Fallback for web — photos are optional
      infoAlert('Info', 'Photo upload requires a native device. You can still publish without photos.');
    }
  };

  const removePhoto = (idx: number) => {
    setSelectedPhotos(selectedPhotos.filter((_, i) => i !== idx));
  };

  const handlePublish = async () => {
    if (!title.trim() || !price || !quantity) {
      infoAlert('Missing Fields', 'Please fill in title, price, and quantity.');
      return;
    }

    if (!profile?.id) {
      infoAlert('Error', 'Please log in first');
      return;
    }

    setIsLoading(true);

    // Safety timeout — never stay loading for more than 15s
    const timeout = setTimeout(() => {
      setIsLoading(false);
      infoAlert('Timeout', 'The operation took too long. Please try again.');
    }, 15000);

    try {
      // Upload photos if any
      let photoUrls: string[] = [];
      if (selectedPhotos.length > 0) {
        const { urls } = await uploadPostPhotos(
          profile.id,
          selectedPhotos.map((p) => ({ base64: p.base64 }))
        );
        photoUrls = urls;
      }

      // Create deadline timestamp (today + time)
      const today = new Date().toISOString().split('T')[0];
      const deadlineTime = `${today}T${deadline}:00.000Z`;

      const { error } = await createPost({
        chef_id: profile.id,
        title: title.trim(),
        description: description.trim() || null,
        photos: photoUrls,
        price: parseInt(price),
        available_quantity: parseInt(quantity),
        remaining_quantity: parseInt(quantity),
        order_deadline: deadlineTime,
        delivery_available: delivery,
        pickup_available: pickup,
        preorder_allowed: preorder,
        is_active: true,
        date: today,
      });

      clearTimeout(timeout);
      setIsLoading(false);

      if (error) {
        infoAlert('Error', error);
      } else {
        crossAlert('Published! 🎉', 'Your daily special is now live. All followers have been notified.', [
          { text: 'Done', onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      clearTimeout(timeout);
      setIsLoading(false);
      infoAlert('Error', e.message || 'Failed to publish');
    }
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
        {selectedPhotos.length === 0 ? (
          <TouchableOpacity onPress={handlePickPhotos}
            style={[styles.photoArea, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <Ionicons name="camera-outline" size={32} color={colors.outline} />
            <Text style={{ color: colors.outline, marginTop: 8, fontSize: 14 }}>Add Photos (up to 5)</Text>
            <Text style={{ color: colors.outline, fontSize: 12 }}>Tap to upload from gallery</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.photosRow}>
            {selectedPhotos.map((photo, idx) => (
              <View key={idx} style={styles.photoThumb}>
                <Image source={{ uri: photo.uri }} style={styles.photoImg} />
                <TouchableOpacity onPress={() => removePhoto(idx)} style={styles.removePhoto}>
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
            {selectedPhotos.length < 5 && (
              <TouchableOpacity onPress={handlePickPhotos}
                style={[styles.addPhotoBtn, { borderColor: colors.outlineVariant }]}>
                <Ionicons name="add" size={24} color={colors.outline} />
              </TouchableOpacity>
            )}
          </View>
        )}

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

        <Button title="Publish Special" onPress={handlePublish} loading={isLoading || storeLoading} size="lg" />
        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  photoArea: { height: 140, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  photosRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  photoThumb: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden' },
  photoImg: { width: '100%', height: '100%' },
  removePhoto: { position: 'absolute', top: 2, right: 2 },
  addPhotoBtn: { width: 80, height: 80, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  toggleCard: { borderRadius: 16, marginBottom: 24, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  toggleLabel: { flex: 1, fontFamily: 'PlusJakartaSans-Regular', fontSize: 15 },
});
