import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
} from 'react-native';
import { Header } from '@/components/ui/Header';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Check, X, Minus, Flame, Trophy, Star, ChevronDown, ChevronUp } from 'lucide-react-native';
import { auth } from '@/lib/firebase';
import {
  salahRepository,
  PrayerName,
  PrayerStatus,
  PRAYER_NAMES,
  PRAYER_DISPLAY,
  SalahDayEntry,
  SalahStreak,
} from '@/services/salahRepository';
import { getLocalDayStr } from '@/features/dailyGoal/streakService';

const { width } = Dimensions.get('window');

const getUserId = () => auth?.currentUser?.uid || 'anonymous_user';

const formatToday = (): string => {
  const d = new Date();
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

const formatDateShort = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

// Colors per prayer for visual variety
const PRAYER_COLORS: Record<PrayerName, { bg: string; accent: string; light: string }> = {
  fajr:    { bg: '#FDF4FF', accent: '#A855F7', light: '#F3E8FF' },
  dhuhr:   { bg: '#FFFBEB', accent: '#D97706', light: '#FEF3C7' },
  asr:     { bg: '#F0FDF4', accent: '#059669', light: '#D1FAE5' },
  maghrib: { bg: '#FFF1F2', accent: '#E11D48', light: '#FFE4E6' },
  isha:    { bg: '#EFF6FF', accent: '#2563EB', light: '#DBEAFE' },
};

export default function SalahTrackerScreen() {
  const [entries, setEntries] = useState<SalahDayEntry[]>([]);
  const [streaks, setStreaks] = useState<SalahStreak[]>([]);
  const [history, setHistory] = useState<Record<string, SalahDayEntry[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [expandedPrayer, setExpandedPrayer] = useState<PrayerName | null>(null);

  const loadData = useCallback(async () => {
    try {
      const userId = getUserId();
      const today = getLocalDayStr();
      const [dayLog, streakData, historyData] = await Promise.all([
        salahRepository.getDayLog(userId, today),
        salahRepository.getStreaks(userId),
        salahRepository.getLast7DaysLog(userId),
      ]);
      setEntries(dayLog);
      setStreaks(streakData);
      setHistory(historyData);
    } catch (e) {
      console.warn('[SalahTracker] Load error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = async (prayerName: PrayerName) => {
    try {
      const userId = getUserId();
      const newStatus = await salahRepository.togglePrayer(userId, prayerName);

      // Optimistic update
      setEntries((prev) =>
        prev.map((e) =>
          e.prayer_name === prayerName
            ? { ...e, status: newStatus, marked_at: new Date().toISOString() }
            : e
        )
      );

      if (newStatus === 'prayed') {
        setExpandedPrayer(prayerName);
      } else if (expandedPrayer === prayerName) {
        setExpandedPrayer(null);
      }

      // Reload streaks and history in background
      Promise.all([
        salahRepository.getStreaks(userId),
        salahRepository.getLast7DaysLog(userId),
      ]).then(([freshStreaks, freshHistory]) => {
        setStreaks(freshStreaks);
        setHistory(freshHistory);
      });
    } catch (e) {
      console.warn('[SalahTracker] Toggle error:', e);
    }
  };

  const handleUpdateKhushuReflection = async (prayerName: PrayerName, khushu: number | null, reflection: string | null) => {
    try {
      const userId = getUserId();
      await salahRepository.updateKhushuAndReflection(userId, prayerName, khushu, reflection);
      setEntries((prev) =>
        prev.map((e) =>
          e.prayer_name === prayerName
            ? { ...e, khushu, reflection }
            : e
        )
      );
    } catch (e) {
      console.warn('[SalahTracker] Update Khushu error:', e);
    }
  };

  const prayedCount = entries.filter((e) => e.status === 'prayed').length;
  const totalPrayers = PRAYER_NAMES.length;
  const completionPct = Math.round((prayedCount / totalPrayers) * 100);

  const getStreakForPrayer = (name: PrayerName): SalahStreak =>
    streaks.find((s) => s.prayer_name === name) || {
      prayer_name: name,
      current_streak: 0,
      longest_streak: 0,
      last_completed_day: null,
    };

  const getStatusIcon = (status: PrayerStatus, size = 20) => {
    switch (status) {
      case 'prayed':
        return <Check size={size} color="#ffffff" strokeWidth={3} />;
      case 'missed':
        return <X size={size} color="#ffffff" strokeWidth={3} />;
      default:
        return <Minus size={size - 2} color="#9CA3AF" strokeWidth={2.5} />;
    }
  };

  const getStatusColor = (status: PrayerStatus, accent: string) => {
    switch (status) {
      case 'prayed':
        return accent;
      case 'missed':
        return '#EF4444';
      default:
        return '#E5E7EB';
    }
  };

  if (isLoading) return null;

  const historyDates = Object.keys(history).sort((a, b) => b.localeCompare(a)).filter(d => d !== getLocalDayStr());

  return (
    <ScreenContainer safe={false} style={styles.container}>
      <Header title="Salah Tracker" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Date header */}
        <Text style={styles.dateText}>{formatToday()}</Text>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryFraction}>
              {prayedCount}
              <Text style={styles.summaryDenom}> / {totalPrayers}</Text>
            </Text>
            <Text style={styles.summaryLabel}>Prayers completed</Text>
          </View>

          {/* Circular progress ring */}
          <View style={styles.ringContainer}>
            <View style={styles.ringOuter}>
              <View
                style={[
                  styles.ringFill,
                  {
                    borderColor:
                      prayedCount === totalPrayers
                        ? '#059669'
                        : prayedCount > 0
                        ? '#D97706'
                        : '#E5E7EB',
                  },
                ]}
              />
              <Text style={styles.ringText}>{completionPct}%</Text>
            </View>
          </View>
        </View>

        {/* Prayer Cards */}
        {PRAYER_NAMES.map((name) => {
          const entry = entries.find((e) => e.prayer_name === name) || {
            prayer_name: name,
            status: 'pending' as PrayerStatus,
            khushu: null,
            reflection: null,
            marked_at: null,
          };
          const display = PRAYER_DISPLAY[name];
          const prayerColor = PRAYER_COLORS[name];
          const streak = getStreakForPrayer(name);
          const isExpanded = expandedPrayer === name && entry.status === 'prayed';

          return (
            <View key={name} style={[styles.prayerCardContainer, { borderColor: entry.status === 'prayed' ? prayerColor.accent + '30' : '#f5f5f4' }]}>
              <TouchableOpacity
                style={[
                  styles.prayerCard,
                  {
                    backgroundColor: entry.status === 'prayed' ? prayerColor.light : '#ffffff',
                    borderBottomWidth: isExpanded ? 1 : 0,
                    borderColor: prayerColor.accent + '30',
                  },
                ]}
                onPress={() => handleToggle(name)}
                activeOpacity={0.7}
              >
                <View style={styles.prayerCardLeft}>
                  {/* Status circle */}
                  <View
                    style={[
                      styles.statusCircle,
                      {
                        backgroundColor: getStatusColor(entry.status, prayerColor.accent),
                        borderColor:
                          entry.status === 'pending'
                            ? '#D1D5DB'
                            : getStatusColor(entry.status, prayerColor.accent),
                      },
                    ]}
                  >
                    {getStatusIcon(entry.status)}
                  </View>

                  {/* Prayer info */}
                  <View style={styles.prayerInfo}>
                    <View style={styles.prayerNameRow}>
                      <Text style={styles.prayerEmoji}>{display.emoji}</Text>
                      <Text
                        style={[
                          styles.prayerName,
                          entry.status === 'prayed' && { color: prayerColor.accent },
                        ]}
                      >
                        {display.label}
                      </Text>
                    </View>
                    <Text style={styles.prayerTime}>{display.time}</Text>
                  </View>
                </View>

                {/* Streak badge */}
                <View style={styles.prayerCardRight}>
                  {streak.current_streak > 0 && (
                    <View style={[styles.streakBadge, { backgroundColor: prayerColor.bg }]}>
                      <Flame size={12} color={prayerColor.accent} />
                      <Text style={[styles.streakBadgeText, { color: prayerColor.accent }]}>
                        {streak.current_streak}
                      </Text>
                    </View>
                  )}
                  {streak.longest_streak > 0 && (
                    <View style={styles.bestBadge}>
                      <Trophy size={10} color="#9CA3AF" />
                      <Text style={styles.bestBadgeText}>{streak.longest_streak}</Text>
                    </View>
                  )}
                </View>

                {/* Expansion indicator */}
                {entry.status === 'prayed' && (
                  <TouchableOpacity 
                    style={styles.expandButton}
                    onPress={() => setExpandedPrayer(isExpanded ? null : name)}
                  >
                    {isExpanded ? <ChevronUp size={20} color={prayerColor.accent} /> : <ChevronDown size={20} color={prayerColor.accent} />}
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              
              {/* Expanded Reflection Area */}
              {isExpanded && (
                <View style={[styles.expandedArea, { backgroundColor: prayerColor.light }]}>
                  <Text style={[styles.khushuLabel, { color: prayerColor.accent }]}>Khushu (Focus) Level</Text>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => handleUpdateKhushuReflection(name, star, entry.reflection)}
                      >
                        <Star
                          size={28}
                          color={entry.khushu && entry.khushu >= star ? '#F59E0B' : '#D1D5DB'}
                          fill={entry.khushu && entry.khushu >= star ? '#F59E0B' : 'transparent'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <TextInput
                    style={styles.reflectionInput}
                    placeholder="Short reflection (optional)..."
                    placeholderTextColor="#9CA3AF"
                    value={entry.reflection || ''}
                    onChangeText={(text) => handleUpdateKhushuReflection(name, entry.khushu, text)}
                    multiline
                  />
                </View>
              )}
            </View>
          );
        })}

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Tap to cycle status</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E5E7EB' }]} />
              <Text style={styles.legendText}>Pending</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#059669' }]} />
              <Text style={styles.legendText}>Prayed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Missed</Text>
            </View>
          </View>
        </View>

        {/* 7-Day History */}
        {historyDates.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Past 6 Days History</Text>
            {historyDates.map(date => {
              const dayEntries = history[date];
              const dayPrayed = dayEntries.filter(e => e.status === 'prayed').length;
              return (
                <View key={date} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{formatDateShort(date)}</Text>
                  <View style={styles.historyDots}>
                    {PRAYER_NAMES.map(name => {
                      const e = dayEntries.find(p => p.prayer_name === name) || { status: 'pending' as PrayerStatus };
                      return (
                        <View
                          key={name}
                          style={[
                            styles.historyDot,
                            { backgroundColor: getStatusColor(e.status, PRAYER_COLORS[name].accent) }
                          ]}
                        />
                      );
                    })}
                  </View>
                  <Text style={styles.historyCount}>{dayPrayed}/5</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: spacing.m,
    paddingTop: spacing.s,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.m,
    textAlign: 'center',
  },

  // Summary card
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f5f5f4',
  },
  summaryLeft: {},
  summaryFraction: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1F2937',
  },
  summaryDenom: {
    fontSize: 20,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },

  // Ring
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 5,
  },
  ringText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#374151',
  },

  // Prayer cards
  prayerCardContainer: {
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    overflow: 'hidden',
  },
  prayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  prayerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginRight: 14,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prayerEmoji: {
    fontSize: 18,
  },
  prayerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#292524',
  },
  prayerTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 2,
    marginLeft: 26,
  },

  // Expanded area
  expandedArea: {
    padding: 16,
    paddingTop: 8,
  },
  khushuLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  reflectionInput: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  expandButton: {
    marginLeft: 8,
    padding: 4,
  },

  // Streak badges
  prayerCardRight: {
    alignItems: 'flex-end',
    gap: 4,
    marginRight: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  streakBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  bestBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
  },

  // Legend
  legend: {
    marginTop: 16,
    alignItems: 'center',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },

  // History section
  historySection: {
    marginTop: 32,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f5f5f4',
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 16,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyDate: {
    fontSize: 13,
    color: '#6B7280',
    width: 80,
  },
  historyDots: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  historyCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    width: 30,
    textAlign: 'right',
  },
});
