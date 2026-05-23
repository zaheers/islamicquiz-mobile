export type StreakState = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDay: string | null; // 'YYYY-MM-DD'
};

/**
 * Calculates the new streak state, assuming this is called exactly when
 * a daily goal transitions from incomplete to complete.
 */
export function calculateStreakOnGoalCompletion(
  streak: StreakState,
  todayLocal: string,
  yesterdayLocal: string
): StreakState {
  // If already marked complete today, no change.
  // The caller should ideally prevent this, but we handle it safely.
  const isToday = streak.lastCompletedDay === todayLocal;
  if (isToday) return streak;

  const wasYesterday = streak.lastCompletedDay === yesterdayLocal;
  
  const newCurrent = wasYesterday ? streak.currentStreak + 1 : 1;

  return {
    currentStreak: newCurrent,
    longestStreak: Math.max(streak.longestStreak, newCurrent),
    lastCompletedDay: todayLocal,
  };
}

/**
 * Helper to get a timezone-aware local day string (YYYY-MM-DD)
 */
export function getLocalDayStr(date: Date = new Date()): string {
  // Format as YYYY-MM-DD using the local timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper to get yesterday's local day string (YYYY-MM-DD)
 */
export function getYesterdayLocalDayStr(date: Date = new Date()): string {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDayStr(yesterday);
}
