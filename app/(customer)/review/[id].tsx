import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Button, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const [overall, setOverall] = useState(0);
  const [taste, setTaste] = useState(0);
  const [packaging, setPackaging] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const StarRow = ({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) => (
    <View style={styles.starSection}>
      <Text style={[styles.starLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => onChange(n)}>
            <Ionicons name={n <= value ? 'star' : 'star-outline'} size={32} color={n <= value ? '#F59E0B' : colors.outlineVariant} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleSubmit = () => {
    if (overall === 0) { Alert.alert('Rating Required', 'Please give an overall rating.'); return; }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Thank You! 🎉', 'Your review has been submitted.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    }, 1500);
  };

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.onBackground }]}>Leave a Review</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.dishInfo}>
        <Text style={{ fontSize: 44 }}>🍲</Text>
        <Text style={[styles.dishName, { color: colors.onSurface }]}>Couscous Royal</Text>
        <Text style={[styles.chefName, { color: colors.onSurfaceVariant }]}>by Sarah K.</Text>
      </View>

      <StarRow label="Overall Rating *" value={overall} onChange={setOverall} />
      <StarRow label="Taste" value={taste} onChange={setTaste} />
      <StarRow label="Packaging" value={packaging} onChange={setPackaging} />
      <StarRow label="Accuracy" value={accuracy} onChange={setAccuracy} />

      <View style={{ flex: 1 }} />
      <Button title="Submit Review" onPress={handleSubmit} loading={isLoading} size="lg" disabled={overall === 0} />
      <View style={{ height: 16 }} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  dishInfo: { alignItems: 'center', marginBottom: 32 },
  dishName: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 20, fontWeight: '600', marginTop: 12 },
  chefName: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, marginTop: 4 },
  starSection: { marginBottom: 20 },
  starLabel: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  stars: { flexDirection: 'row', gap: 8 },
});
