import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

interface DateTimePickerProps {
  /** Selected date in YYYY-MM-DD format */
  date: string;
  /** Selected time in HH:MM format (optional) */
  time?: string;
  /** Called when date changes */
  onDateChange: (date: string) => void;
  /** Called when time changes */
  onTimeChange?: (time: string) => void;
  /** Show time picker alongside date */
  showTime?: boolean;
  /** Minimum selectable date (default: today) */
  minDate?: Date;
  /** Maximum selectable date (default: +6 months) */
  maxDate?: Date;
  /** Label */
  label?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

export function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  showTime = false,
  minDate,
  maxDate,
  label,
}: DateTimePickerProps) {
  const { colors, shadows } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [inputText, setInputText] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const min = minDate || today;
  const max = maxDate || new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000);

  const [viewMonth, setViewMonth] = useState(() => {
    if (date) {
      const d = new Date(date);
      return { year: d.getFullYear(), month: d.getMonth() };
    }
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  const formatDateDisplay = (d: string) => {
    if (!d) return 'Select date';
    const dt = new Date(d);
    const dayName = DAYS[dt.getUTCDay()];
    const monthName = MONTHS[dt.getUTCMonth()].slice(0, 3);
    return `${dayName}, ${dt.getUTCDate()} ${monthName} ${dt.getUTCFullYear()}`;
  };

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = viewMonth.year;
    const month = viewMonth.month;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    return grid;
  }, [viewMonth]);

  const isDateDisabled = (day: number) => {
    const d = new Date(viewMonth.year, viewMonth.month, day);
    return d < min || d > max;
  };

  const isSelected = (day: number) => {
    if (!date) return false;
    const sel = new Date(date);
    return sel.getUTCFullYear() === viewMonth.year && sel.getUTCMonth() === viewMonth.month && sel.getUTCDate() === day;
  };

  const isToday = (day: number) => {
    return today.getFullYear() === viewMonth.year && today.getMonth() === viewMonth.month && today.getDate() === day;
  };

  const selectDay = (day: number) => {
    const m = String(viewMonth.month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onDateChange(`${viewMonth.year}-${m}-${d}`);
    setShowModal(false);
  };

  const prevMonth = () => {
    setViewMonth(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  };
  const nextMonth = () => {
    setViewMonth(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });
  };

  const handleTextInput = (text: string) => {
    const digits = text.replace(/\D/g, '');
    let formatted = '';
    if (digits.length >= 1) formatted = digits.slice(0, 2);
    if (digits.length >= 3) formatted += '/' + digits.slice(2, 4);
    if (digits.length >= 5) formatted += '/' + digits.slice(4, 8);
    setInputText(formatted);
    if (digits.length === 8) {
      const day = parseInt(digits.slice(0, 2));
      const month = parseInt(digits.slice(2, 4));
      const year = parseInt(digits.slice(4, 8));
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2024) {
        const m = String(month).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const dateStr = `${year}-${m}-${d}`;
        const parsed = new Date(dateStr);
        if (parsed >= min && parsed <= max) {
          onDateChange(dateStr);
          setViewMonth({ year, month: month - 1 });
          setShowModal(false);
        }
      }
    }
  };

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Label */}
      {label && <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{label}</Text>}

      {/* Date button — opens calendar modal */}
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={[styles.displayBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        <Text style={[styles.displayText, { color: date ? colors.onSurface : colors.outline }]}>
          {formatDateDisplay(date)}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.outline} />
      </TouchableOpacity>

      {/* Time picker — always visible below date when showTime=true */}
      {showTime && onTimeChange && (
        <View>
          <Text style={[styles.timeTitle, { color: colors.onSurfaceVariant }]}>🕐 Select time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TIME_SLOTS.map(t => (
              <TouchableOpacity key={t} onPress={() => onTimeChange(t)}
                style={[styles.timeChip, {
                  backgroundColor: time === t ? colors.primary : colors.surfaceContainerLow,
                  borderWidth: time === t ? 0 : 1,
                  borderColor: colors.outlineVariant,
                }]}>
                <Ionicons name="time-outline" size={13} color={time === t ? '#fff' : colors.onSurface} />
                <Text style={{ color: time === t ? '#fff' : colors.onSurface, fontWeight: '600', fontSize: 13, marginLeft: 4 }}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Calendar Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceContainerLowest, ...shadows.lg }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Manual input */}
            <View style={[styles.inputRow, { backgroundColor: colors.surfaceContainerLow }]}>
              <Ionicons name="create-outline" size={16} color={colors.outline} />
              <TextInput
                style={[styles.textInput, { color: colors.onSurface }]}
                placeholder="Or type: DD/MM/YYYY"
                placeholderTextColor={colors.outline}
                value={inputText}
                onChangeText={handleTextInput}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            {/* Month navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={prevMonth} style={styles.navArrow}>
                <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
              </TouchableOpacity>
              <Text style={[styles.monthLabel, { color: colors.onSurface }]}>
                {MONTHS[viewMonth.month]} {viewMonth.year}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navArrow}>
                <Ionicons name="chevron-forward" size={22} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={styles.dayHeaders}>
              {DAYS.map(d => (
                <Text key={d} style={[styles.dayHeader, { color: colors.outline }]}>{d}</Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, i) => {
                if (day === null) return <View key={`empty-${i}`} style={styles.dayCell} />;
                const disabled = isDateDisabled(day);
                const selected = isSelected(day);
                const todayMark = isToday(day);
                return (
                  <TouchableOpacity
                    key={day}
                    disabled={disabled}
                    onPress={() => selectDay(day)}
                    style={[
                      styles.dayCell,
                      selected && { backgroundColor: colors.primary, borderRadius: 20 },
                      todayMark && !selected && { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 20 },
                    ]}
                  >
                    <Text style={[
                      styles.dayText,
                      { color: disabled ? colors.outline : selected ? '#fff' : colors.onSurface },
                      selected && { fontWeight: '800' },
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  displayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12, borderWidth: 1, marginBottom: 10,
  },
  displayText: { flex: 1, fontSize: 14, fontWeight: '500' },
  timeTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  timeChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, marginRight: 8,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginBottom: 16,
  },
  textInput: { flex: 1, fontSize: 15, fontWeight: '500', padding: 0 },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  navArrow: { padding: 4 },
  monthLabel: { fontSize: 16, fontWeight: '700' },
  dayHeaders: { flexDirection: 'row', marginBottom: 4 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  dayCell: {
    width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
  },
  dayText: { fontSize: 14 },
});
