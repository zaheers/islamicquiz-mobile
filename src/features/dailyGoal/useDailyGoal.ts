import { useCallback, useEffect, useRef, useState } from 'react';
import { goalRepository, GoalType, UserGoalSettings, DailyProgress, UserStreak } from '../../services/goalRepository';
import { getLocalDayStr } from './streakService';
import { auth } from '../../lib/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DailyGoalState {
  progress: number;
  goal: number;
  goalType: GoalType;
  isComplete: boolean;
  current_streak: number;
  longest_streak: number;
  incrementProgress: (type: GoalType, amount: number) => Promise<void>;
  reload: () => Promise<void>;
}

// Helper to get anonymous user ID or a fallback
const getUserId = () => auth?.currentUser?.uid || 'anonymous_user';

const LAST_AYAH_KEY = 'daily_goal_last_ayah';

/**
 * Standalone function — importable from non-hook contexts (e.g. quran-reciter).
 * ayahKey: unique string like "2_5" (surahId_ayahNumber) used to prevent double-counting.
 */
export async function incrementDailyGoal(ayahKey: string, goalType: GoalType = 'ayahs', amount = 1): Promise<void> {
  try {
    const today = getLocalDayStr();
    
    if (goalType === 'ayahs') {
      // Dedup: skip if this ayah was already counted today
      const lastAyah = await AsyncStorage.getItem(LAST_AYAH_KEY);
      if (lastAyah === `${today}_${ayahKey}`) return;
      await AsyncStorage.setItem(LAST_AYAH_KEY, `${today}_${ayahKey}`);
    }

    const userId = getUserId();
    const settings = await goalRepository.getSettings(userId);
    
    await goalRepository.incrementProgress(userId, goalType, amount, settings.target_value);
  } catch (e) {
    console.warn('[DailyGoal] Increment error:', e);
  }
}

export function useDailyGoal(): DailyGoalState {
  const [progress, setProgress] = useState(0);
  const [goal, setGoal] = useState(10);
  const [goalType, setGoalType] = useState<GoalType>('ayahs');
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  
  // Poll storage so UI refreshes after quran-reciter increments it
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadGoalData = useCallback(async () => {
    try {
      const userId = getUserId();
      const today = getLocalDayStr();

      const [settings, todayProgress, streak] = await Promise.all([
        goalRepository.getSettings(userId),
        goalRepository.getTodayProgress(userId, today),
        goalRepository.getStreak(userId),
      ]);

      setGoal(settings.target_value);
      setGoalType(settings.goal_type);
      
      if (settings.goal_type === 'minutes') setProgress(todayProgress.minutes_count);
      else if (settings.goal_type === 'sessions') setProgress(todayProgress.sessions_count);
      else setProgress(todayProgress.ayahs_count);

      setCurrentStreak(streak.current_streak);
      setLongestStreak(streak.longest_streak);

    } catch (e) {
      console.warn('[DailyGoal] Load error:', e);
    }
  }, []);

  useEffect(() => {
    loadGoalData();
    // Refresh every 5 seconds to pick up increments from the reader
    intervalRef.current = setInterval(loadGoalData, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadGoalData]);

  const incrementProgress = useCallback(async (type: GoalType, amount: number) => {
    await incrementDailyGoal(`manual_${Date.now()}`, type, amount);
    await loadGoalData();
  }, [loadGoalData]);

  return { 
    progress, 
    goal, 
    goalType,
    isComplete: progress >= goal, 
    current_streak: currentStreak, 
    longest_streak: longestStreak, 
    incrementProgress,
    reload: loadGoalData
  };
}
