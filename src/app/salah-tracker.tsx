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
import { SpiritualCard } from '@/components/ui/SpiritualCard';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { Check, X, Minus, Star, ChevronDown, ChevronUp, Lock, Sun, Moon, Sparkles, Clock, CheckCircle2 } from 'lucide-react-native';
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

  const handleUpdateSunnahUnits = async (prayerName: PrayerName, currentUnits: number) => {
    try {
      // Toggle logic for simple demo (0 -> 2 -> 0)
      const maxUnits = prayerName === 'dhuhr' ? 6 : 2;
      const newUnits = currentUnits >= maxUnits ? 0 : currentUnits + 2;
      
      const userId = getUserId();
      await salahRepository.updateSunnahRawatibUnits(userId, prayerName, newUnits);
      
      setEntries((prev) =>
        prev.map((e) =>
          e.prayer_name === prayerName
            ? { ...e, sunnah_rawatib_units: newUnits }
            : e
        )
      );
    } catch (e) {
      console.warn('[SalahTracker] Update Sunnah error:', e);
    }
  };

  if (isLoading) return null;

  // 7 days history including today for the "Your Journey" calendar view
  const daysOfHistory = Object.keys(history).sort((a, b) => a.localeCompare(b)); // oldest first
  const todayEntry = entries.filter(e => e.prayer_name !== 'duha' && e.prayer_name !== 'tahajjud');
  const maxStreak = streaks.reduce((max, s) => Math.max(max, s.current_streak), 0);

  const getDayInitial = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'narrow' });
  };

  const getFardEntries = () => entries.filter(e => e.prayer_name !== 'duha' && e.prayer_name !== 'tahajjud');

  const renderHistoryCircle = (dateStr: string, isToday: boolean) => {
    const dayLog = isToday ? entries : history[dateStr] || [];
    const fardLog = dayLog.filter(e => e.prayer_name !== 'duha' && e.prayer_name !== 'tahajjud');
    const totalFard = 5;
    const prayedFard = fardLog.filter(e => e.status === 'prayed').length;
    
    let circleStyle: any[] = [styles.dayCircle, styles.dayCircleEmpty];
    let icon = null;

    if (prayedFard === totalFard) {
      circleStyle = [styles.dayCircle, styles.dayCirclePerfect];
      icon = <CheckCircle2 size={16} color={colors.sg.onPrimary} />;
    } else if (prayedFard > 0) {
      circleStyle = [styles.dayCircle, styles.dayCirclePartial];
      icon = <CheckCircle2 size={16} color={colors.sg.primary} />;
    } else if (isToday) {
      circleStyle = [styles.dayCircle, styles.dayCircleToday];
      icon = <Clock size={16} color={colors.sg.primary} />;
    }

    return (
      <View key={dateStr} style={styles.dayCol}>
        <Text style={styles.dayLabel}>{getDayInitial(dateStr)}</Text>
        <View style={circleStyle}>{icon}</View>
      </View>
    );
  };

  // Sunnah Rawatib logic
  const sunnahUnits = {
    fajr: entries.find(e => e.prayer_name === 'fajr')?.sunnah_rawatib_units || 0,
    dhuhr: entries.find(e => e.prayer_name === 'dhuhr')?.sunnah_rawatib_units || 0,
    maghrib: entries.find(e => e.prayer_name === 'maghrib')?.sunnah_rawatib_units || 0,
    isha: entries.find(e => e.prayer_name === 'isha')?.sunnah_rawatib_units || 0,
  };
  const totalSunnahUnits = sunnahUnits.fajr + sunnahUnits.dhuhr + sunnahUnits.maghrib + sunnahUnits.isha;

  return (
    <ScreenContainer safe={false} style={styles.container}>
      <Header title="Salah Tracker" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Your Journey (7-Day Streak View) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Your Journey</Text>
          <Text style={styles.streakText}>{maxStreak} Day Streak</Text>
        </View>

        <View style={styles.streakCard}>
          <View style={styles.daysRow}>
            {daysOfHistory.map(date => renderHistoryCircle(date, date === getLocalDayStr()))}
          </View>
          <Text style={styles.quoteText}>"Indeed, prayer prohibits immorality and wrongdoing."</Text>
        </View>

        {/* Fard Salah */}
        <View style={styles.sectionHeaderRowWithLine}>
          <View style={styles.verticalLinePrimary} />
          <Text style={styles.sectionHeading}>Fard Salah</Text>
        </View>

        <View style={styles.prayersList}>
          {getFardEntries().map(entry => {
            const isExpanded = expandedPrayer === entry.prayer_name;
            const display = PRAYER_DISPLAY[entry.prayer_name];
            const isPrayed = entry.status === 'prayed';
            const isMissed = entry.status === 'missed';

            return (
              <View key={entry.prayer_name} style={styles.prayerCardWrapper}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.fardCard,
                    isPrayed && styles.fardCardPrayed,
                    isMissed && styles.fardCardMissed
                  ]}
                  onPress={() => handleToggle(entry.prayer_name)}
                >
                  <View style={styles.fardLeft}>
                    <View style={styles.iconCircle}>
                      <Text style={{fontSize: 24}}>{display.emoji}</Text>
                    </View>
                    <View>
                      <Text style={[styles.fardName, isPrayed && {color: colors.sg.onPrimaryContainer}]}>{display.label}</Text>
                      <Text style={[styles.fardTime, isPrayed && {color: colors.sg.onPrimaryContainer}]}>{display.time}</Text>
                    </View>
                  </View>

                  <View style={[styles.checkbox, isPrayed && styles.checkboxChecked, isMissed && styles.checkboxMissed]}>
                    {isPrayed && <Check size={20} color={colors.sg.onPrimaryContainer} strokeWidth={3} />}
                    {isMissed && <X size={20} color={colors.sg.onErrorContainer} strokeWidth={3} />}
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedArea}>
                    <Text style={styles.khushuLabel}>Khushu (Focus) Level</Text>
                    <View style={styles.starsContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          onPress={() => handleUpdateKhushuReflection(entry.prayer_name, star, entry.reflection)}
                        >
                          <Star
                            size={28}
                            color={entry.khushu && entry.khushu >= star ? colors.sg.secondary : '#D1D5DB'}
                            fill={entry.khushu && entry.khushu >= star ? colors.sg.secondary : 'transparent'}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                    
                    <TextInput
                      style={styles.reflectionInput}
                      placeholder="Short reflection (optional)..."
                      placeholderTextColor={colors.sg.onSurfaceVariant}
                      value={entry.reflection || ''}
                      onChangeText={(text) => handleUpdateKhushuReflection(entry.prayer_name, entry.khushu, text)}
                      multiline
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Voluntary & Sunnah Section */}
        <View style={styles.sectionHeaderRowWithLine}>
          <View style={styles.verticalLineSecondary} />
          <Text style={styles.sectionHeading}>Voluntary & Sunnah</Text>
        </View>

        <View style={styles.voluntaryGrid}>
          {['duha', 'tahajjud'].map(pName => {
            const name = pName as PrayerName;
            const entry = entries.find(e => e.prayer_name === name) || { status: 'pending', prayer_name: name };
            const isPrayed = entry.status === 'prayed';
            const display = PRAYER_DISPLAY[name];

            return (
              <SpiritualCard key={name} style={styles.volCard} featured>
                <View style={styles.volCardHeader}>
                  <Text style={{fontSize: 20}}>{display.emoji}</Text>
                  <View style={styles.volBadge}>
                    <Text style={styles.volBadgeText}>{display.time}</Text>
                  </View>
                </View>
                <View style={styles.volInfo}>
                  <Text style={styles.volName}>{display.label}</Text>
                  <Text style={styles.volDesc}>{name === 'duha' ? "Morning gratitude." : "Deep night connection."}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.volBtn, isPrayed && styles.volBtnActive]}
                  onPress={() => handleToggle(name)}
                >
                  <Text style={[styles.volBtnText, isPrayed && styles.volBtnTextActive]}>
                    {isPrayed ? 'Logged' : 'Log Prayer'}
                  </Text>
                </TouchableOpacity>
              </SpiritualCard>
            );
          })}
        </View>

        {/* Sunnah Rawatib Tracker */}
        <SpiritualCard style={styles.rawatibCard}>
          <View style={styles.rawatibHeader}>
            <Text style={styles.rawatibTitle}>Sunnah Rawatib</Text>
            <Text style={styles.rawatibCount}>{totalSunnahUnits} / 12 units</Text>
          </View>
          
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min((totalSunnahUnits / 12) * 100, 100)}%` }]} />
          </View>

          <View style={styles.rawatibGrid}>
            <TouchableOpacity onPress={() => handleUpdateSunnahUnits('fajr', sunnahUnits.fajr)} style={styles.rawatibCol}>
              <Text style={styles.rawatibLabel}>Pre-Fajr</Text>
              <View style={[styles.rawatibBox, sunnahUnits.fajr > 0 && styles.rawatibBoxActive]}>
                <Text style={[styles.rawatibBoxText, sunnahUnits.fajr > 0 && styles.rawatibBoxTextActive]}>{sunnahUnits.fajr}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleUpdateSunnahUnits('dhuhr', sunnahUnits.dhuhr)} style={styles.rawatibCol}>
              <Text style={styles.rawatibLabel}>Dhuhr</Text>
              <View style={[styles.rawatibBox, sunnahUnits.dhuhr > 0 && styles.rawatibBoxActive]}>
                <Text style={[styles.rawatibBoxText, sunnahUnits.dhuhr > 0 && styles.rawatibBoxTextActive]}>{sunnahUnits.dhuhr}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleUpdateSunnahUnits('maghrib', sunnahUnits.maghrib)} style={styles.rawatibCol}>
              <Text style={styles.rawatibLabel}>Maghrib</Text>
              <View style={[styles.rawatibBox, sunnahUnits.maghrib > 0 && styles.rawatibBoxActive]}>
                <Text style={[styles.rawatibBoxText, sunnahUnits.maghrib > 0 && styles.rawatibBoxTextActive]}>{sunnahUnits.maghrib}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleUpdateSunnahUnits('isha', sunnahUnits.isha)} style={styles.rawatibCol}>
              <Text style={styles.rawatibLabel}>Isha</Text>
              <View style={[styles.rawatibBox, sunnahUnits.isha > 0 && styles.rawatibBoxActive]}>
                <Text style={[styles.rawatibBoxText, sunnahUnits.isha > 0 && styles.rawatibBoxTextActive]}>{sunnahUnits.isha}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </SpiritualCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sg.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionHeaderRowWithLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 40,
  },
  verticalLinePrimary: {
    width: 4,
    height: 32,
    backgroundColor: colors.sg.secondary,
    borderRadius: 2,
    marginRight: 12,
  },
  verticalLineSecondary: {
    width: 4,
    height: 32,
    backgroundColor: colors.sg.secondaryContainer,
    borderRadius: 2,
    marginRight: 12,
  },
  sectionHeading: {
    ...typography.sg.headlineLgMobile,
    color: colors.sg.primary,
  },
  streakText: {
    ...typography.sg.labelMd,
    color: colors.sg.secondary,
  },
  
  // Streak Card
  streakCard: {
    backgroundColor: colors.sg.surfaceContainerHighest,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.sg.outlineVariant,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dayCol: {
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    ...typography.sg.labelMd,
    color: colors.sg.onSurfaceVariant,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCirclePerfect: {
    backgroundColor: colors.sg.primary,
  },
  dayCirclePartial: {
    backgroundColor: colors.sg.primaryFixedDim,
    borderWidth: 2,
    borderColor: colors.sg.primary,
  },
  dayCircleToday: {
    backgroundColor: colors.sg.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: colors.sg.primary,
  },
  dayCircleEmpty: {
    backgroundColor: colors.sg.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.sg.outlineVariant,
    opacity: 0.6,
  },
  quoteText: {
    ...typography.sg.spiritualText,
    color: colors.sg.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Fard Cards
  prayersList: {
    gap: 12,
  },
  prayerCardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  fardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: colors.sg.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.sg.outlineVariant,
  },
  fardCardPrayed: {
    backgroundColor: colors.sg.primaryContainer,
    borderColor: colors.sg.primaryContainer,
  },
  fardCardMissed: {
    backgroundColor: colors.sg.errorContainer,
    borderColor: colors.sg.error,
  },
  fardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.sg.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fardName: {
    ...typography.sg.bodyLg,
    fontWeight: '700',
    color: colors.sg.onSurface,
  },
  fardTime: {
    ...typography.sg.labelMd,
    color: colors.sg.onSurfaceVariant,
    marginTop: 2,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.sg.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.sg.primaryContainer,
    borderWidth: 0,
  },
  checkboxMissed: {
    borderColor: colors.sg.error,
    borderWidth: 2,
  },

  // Expansion
  expandedArea: {
    backgroundColor: colors.sg.surfaceContainer,
    padding: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  khushuLabel: {
    ...typography.sg.labelMd,
    color: colors.sg.primaryContainer,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  reflectionInput: {
    backgroundColor: colors.sg.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    ...typography.sg.bodyMd,
    color: colors.sg.onSurface,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Voluntary
  voluntaryGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  volCard: {
    flex: 1,
    padding: 16,
  },
  volCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  volBadge: {
    backgroundColor: colors.sg.secondaryContainer + '30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  volBadgeText: {
    ...typography.sg.labelMd,
    fontSize: 10,
    color: colors.sg.onSecondaryContainer,
  },
  volInfo: {
    flex: 1,
    marginBottom: 16,
  },
  volName: {
    ...typography.sg.bodyMd,
    fontWeight: '700',
    color: colors.sg.onSurface,
  },
  volDesc: {
    ...typography.sg.labelMd,
    fontSize: 11,
    color: colors.sg.onSurfaceVariant,
    marginTop: 4,
  },
  volBtn: {
    backgroundColor: colors.sg.secondary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  volBtnActive: {
    backgroundColor: colors.sg.surfaceContainerHigh,
  },
  volBtnText: {
    ...typography.sg.labelMd,
    color: colors.sg.onSecondary,
  },
  volBtnTextActive: {
    color: colors.sg.onSurfaceVariant,
  },

  // Sunnah Rawatib
  rawatibCard: {
    padding: 24,
  },
  rawatibHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rawatibTitle: {
    ...typography.sg.bodyLg,
    fontWeight: '700',
    color: colors.sg.primary,
  },
  rawatibCount: {
    ...typography.sg.labelMd,
    color: colors.sg.secondary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.sg.surfaceContainerHigh,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.sg.secondary,
    borderRadius: 4,
  },
  rawatibGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rawatibCol: {
    alignItems: 'center',
  },
  rawatibLabel: {
    ...typography.sg.labelMd,
    fontSize: 11,
    color: colors.sg.onSurfaceVariant,
    marginBottom: 8,
  },
  rawatibBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.sg.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rawatibBoxActive: {
    backgroundColor: colors.sg.primaryContainer,
  },
  rawatibBoxText: {
    ...typography.sg.bodyLg,
    fontWeight: '700',
    color: colors.sg.onSurfaceVariant,
  },
  rawatibBoxTextActive: {
    color: colors.sg.onPrimaryContainer,
  },
});
