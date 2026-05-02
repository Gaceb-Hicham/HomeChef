import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const CHEF = {
  id: 'c1', name: 'Sarah K.', kitchen: "Mama's Kitchen", bio: 'Passionate about traditional Algerian cuisine. Every dish is made with love and the finest ingredients.',
  avatar: '👩‍🍳', rating: 4.9, reviews: 47, orders: 423, followers: 156, isOpen: true,
  specialties: ['Couscous', 'Tajine', 'Chorba', 'Baklava'],
};

const ARCHIVE = [
  { id: '1', title: 'Couscous Royal', emoji: '🍲', price: 850, date: 'Today' },
  { id: '2', title: 'Baklava Box', emoji: '🍰', price: 450, date: 'Today' },
  { id: '3', title: 'Chorba Frik', emoji: '🍜', price: 400, date: 'Yesterday' },
  { id: '4', title: 'Tajine Zitoune', emoji: '🥘', price: 700, date: '28 Apr' },
  { id: '5', title: 'Makrout', emoji: '🍯', price: 350, date: '27 Apr' },
  { id: '6', title: 'Bourek', emoji: '🥟', price: 300, date: '26 Apr' },
];

export default function ChefProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <ScreenWrapper padded={false} safeArea={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View style={[styles.cover, { backgroundColor: colors.primaryContainer }]}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: 'rgba(0,0,0,0.3)' }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.md }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryFixed }]}>
            <Text style={{ fontSize: 44 }}>{CHEF.avatar}</Text>
          </View>
          <Text style={[styles.name, { color: colors.onBackground }]}>{CHEF.name}</Text>
          <Text style={[styles.kitchen, { color: colors.primary }]}>{CHEF.kitchen}</Text>

          {/* Stats */}
          <View style={styles.statRow}>
            {[{ n: CHEF.orders.toString(), l: 'Orders' }, { n: CHEF.rating.toString(), l: 'Rating' }, { n: CHEF.followers.toString(), l: 'Followers' }].map((s) => (
              <View key={s.l} style={styles.stat}>
                <Text style={[styles.statN, { color: colors.primary }]}>{s.n}</Text>
                <Text style={[styles.statL, { color: colors.onSurfaceVariant }]}>{s.l}</Text>
              </View>
            ))}
          </View>

          {/* Follow button */}
          <TouchableOpacity onPress={() => setIsFollowing(!isFollowing)}
            style={[styles.followBtn, { backgroundColor: isFollowing ? colors.surfaceContainerLow : colors.primary, borderColor: isFollowing ? colors.outlineVariant : colors.primary }]}>
            <Ionicons name={isFollowing ? 'checkmark' : 'add'} size={18} color={isFollowing ? colors.onSurface : colors.onPrimary} />
            <Text style={{ color: isFollowing ? colors.onSurface : colors.onPrimary, fontWeight: '600', fontSize: 14 }}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.bio, { color: colors.onSurfaceVariant }]}>{CHEF.bio}</Text>

          {/* Specialties */}
          <View style={styles.tagsRow}>
            {CHEF.specialties.map((s) => (
              <View key={s} style={[styles.tag, { backgroundColor: colors.surfaceContainerLow }]}>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '500' }}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Archive */}
        <View style={{ padding: 24 }}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Menu Archive</Text>
          <View style={styles.grid}>
            {ARCHIVE.map((item) => (
              <TouchableOpacity key={item.id} style={[styles.gridCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}
                onPress={() => router.push(`/(customer)/offer/${item.id}`)}>
                <View style={[styles.gridImg, { backgroundColor: colors.surfaceContainerHigh }]}>
                  <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
                </View>
                <Text style={[styles.gridTitle, { color: colors.onSurface }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.gridPrice, { color: colors.primary }]}>{item.price} DA</Text>
                <Text style={[styles.gridDate, { color: colors.outline }]}>{item.date}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  cover: { height: 160 },
  backBtn: { position: 'absolute', top: 50, left: 20, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  profileCard: { marginTop: -40, marginHorizontal: 20, borderRadius: 20, padding: 24, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginTop: -60, marginBottom: 12 },
  name: { fontFamily: 'NotoSerif-Bold', fontSize: 24, fontWeight: '700', marginBottom: 2 },
  kitchen: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600', marginBottom: 16 },
  statRow: { flexDirection: 'row', gap: 32, marginBottom: 16 },
  stat: { alignItems: 'center' },
  statN: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, fontWeight: '700' },
  statL: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11, marginTop: 2 },
  followBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  bio: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  sectionTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 18, fontWeight: '600', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { width: '47%', borderRadius: 14, overflow: 'hidden' },
  gridImg: { height: 100, alignItems: 'center', justifyContent: 'center' },
  gridTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600', paddingHorizontal: 10, paddingTop: 8 },
  gridPrice: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, fontWeight: '700', paddingHorizontal: 10, marginTop: 2 },
  gridDate: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11, paddingHorizontal: 10, paddingBottom: 10, marginTop: 2 },
});
