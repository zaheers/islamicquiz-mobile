import { Target } from 'lucide-react-native';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DailyGoalState } from './useDailyGoal';

interface Props {
  state: DailyGoalState;
}

export const DailyQuranGoalCard = memo(({ state }: Props) => {
  const { progress, goal, goalType, isComplete } = state;
  const pct = Math.min((progress / goal) * 100, 100);

  const getGoalTypeText = () => {
    switch (goalType) {
      case 'minutes': return 'Minutes';
      case 'sessions': return 'Sessions';
      case 'ayahs':
      default: return 'Ayahs';
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Target size={12} color="#059669" />
          <Text style={styles.badgeText}>Today&apos;s Goal</Text>
        </View>
        {isComplete && <Text style={styles.completeEmoji}>🎉</Text>}
      </View>

      {/* Goal label */}
      <Text style={styles.goalTitle}>
        {isComplete ? 'Goal Completed 🎉' : `Read ${goal} ${getGoalTypeText()}`}
      </Text>

      {/* Progress bar */}
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>

      {/* Progress text */}
      <View style={styles.footerRow}>
        <Text style={styles.progressText}>{progress} / {goal} completed</Text>
        <Text style={styles.progressPct}>{Math.round(pct)}%</Text>
      </View>

      {/* Streak display */}
      {(state.current_streak > 0 || state.longest_streak > 0) && (
        <View style={styles.streakRow}>
          {state.current_streak > 0 && (
            <View style={styles.streakContainer}>
              <Text style={styles.streakText}>🔥 {state.current_streak} Day Streak</Text>
            </View>
          )}
          {state.longest_streak > 0 && (
            <View style={styles.longestStreakBadge}>
              <Text style={styles.longestStreakText}>Best: {state.longest_streak}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

DailyQuranGoalCard.displayName = 'DailyQuranGoalCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f5f5f4',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completeEmoji: {
    fontSize: 18,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#292524',
    marginBottom: 14,
  },
  barBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 13,
    color: '#57534e',
    fontWeight: '500',
  },
  progressPct: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  streakContainer: {
    backgroundColor: '#FFFBEB',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  longestStreakBadge: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  longestStreakText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
});
