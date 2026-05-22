import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, Button, Input } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { teasersApi } from '@/lib/api';
import { infoAlert } from '@/lib/crossAlert';
import { useToast } from '@/components/ui/Toast';

export default function TeaserScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePublish = async () => {
    if (!title) { infoAlert('Error', 'Title is required'); return; }
    if (!profile?.id) return;
    setIsLoading(true);
    const { error } = await teasersApi.create({
      chef_id: profile.id,
      title,
      description: description || null,
      planned_date: plannedDate || null,
    });
    setIsLoading(false);
    if (error) { infoAlert('Error', error); } else {
      showToast('Teaser published! 🎬', 'success');
      router.back();
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>🎬 Teaser Post</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={{ color: colors.onSurfaceVariant, marginBottom: 24, lineHeight: 20 }}>
          Give your followers a sneak peek of what's coming! Teasers build anticipation and let customers tap "I'm interested" so you know the demand.
        </Text>

        {/* Preview Card */}
        <View style={[styles.previewCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.md }]}>
          <View style={[styles.comingSoonBadge]}>
            <Ionicons name="time" size={14} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12, marginLeft: 4 }}>COMING SOON</Text>
          </View>
          <Text style={[styles.previewTitle, { color: colors.onSurface }]}>{title || 'Your dish name here...'}</Text>
          {description ? (
            <Text style={{ color: colors.onSurfaceVariant, marginTop: 6, lineHeight: 20 }}>{description}</Text>
          ) : (
            <Text style={{ color: colors.outline, marginTop: 6, fontStyle: 'italic' }}>Add a description...</Text>
          )}
          {plannedDate && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 }}>
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '600' }}>{plannedDate}</Text>
            </View>
          )}
          <View style={[styles.interestRow, { borderTopColor: colors.outlineVariant }]}>
            <TouchableOpacity style={[styles.interestBtn, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="heart" size={16} color="#b45309" />
              <Text style={{ color: '#b45309', fontWeight: '700', marginLeft: 6 }}>I'm Interested!</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.outline, fontSize: 12 }}>0 interested</Text>
          </View>
        </View>

        {/* Form */}
        <Text style={[styles.section, { color: colors.onBackground }]}>Details</Text>
        <Input label="Dish Name" value={title} onChangeText={setTitle} icon="restaurant-outline" placeholder="e.g. Couscous Royal Special" />
        <View style={{ height: 14 }} />
        <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3}
          icon="document-text-outline" placeholder="Tease what makes this dish special..." style={{ minHeight: 80, textAlignVertical: 'top' }} />
        <View style={{ height: 14 }} />
        <Input label="Planned Date (optional)" value={plannedDate} onChangeText={setPlannedDate}
          icon="calendar-outline" placeholder="YYYY-MM-DD" />

        <View style={{ marginTop: 24 }}>
          <Button title="🎬 Publish Teaser" onPress={handlePublish} loading={isLoading} size="lg" />
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  section: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 24 },
  previewCard: { padding: 20, borderRadius: 20, marginBottom: 8 },
  comingSoonBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#8b5cf6', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  previewTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, fontWeight: '700', marginTop: 12 },
  interestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTopWidth: 1 },
  interestBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
});
