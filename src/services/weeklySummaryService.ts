import { openUserDataDb } from './userDataDatabase';
import { getLocalDayStr } from '../features/dailyGoal/streakService';
import { auth } from '../lib/firebase';
import { journalService } from './journalService';

export interface WeeklySummary {
  quranGoalDays: number;
  currentQuranStreak: number;
  salahCount: number;
  reflectionCount: number;
  topTopics: { topic: string; count: number }[];
}

export const weeklySummaryService = {
  async getWeeklySummary(): Promise<WeeklySummary> {
    const userId = auth?.currentUser?.uid || 'anonymous_user';
    const db = await openUserDataDb();

    // Get last 7 days
    const days = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      days.push(`${yyyy}-${mm}-${dd}`);
    }

    const placeholders = days.map(() => '?').join(',');

    // 1. Quran Habits
    const quranRows = await db.getAllAsync<any>(
      `SELECT * FROM daily_recitation_progress WHERE user_id = ? AND local_day IN (${placeholders}) AND goal_completed = 1`,
      [userId, ...days]
    );
    const quranGoalDays = quranRows.length;

    const streakRow = await db.getFirstAsync<any>(
      `SELECT current_streak FROM user_streaks WHERE user_id = ?`,
      [userId]
    );
    const currentQuranStreak = streakRow?.current_streak || 0;

    // 2. Salah Habits
    const salahRows = await db.getAllAsync<any>(
      `SELECT * FROM salah_daily_log WHERE user_id = ? AND local_day IN (${placeholders}) AND status = 'prayed'`,
      [userId, ...days]
    );
    const salahCount = salahRows.length;

    // 3. Heart & Reflections
    const allJournalEntries = await journalService.getEntries();
    
    // Filter to last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentReflections = allJournalEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= weekAgo;
    });

    const reflectionCount = recentReflections.length;

    const topicCounts: Record<string, number> = {};
    for (const ref of recentReflections) {
      // Use the title as the 'topic' for the summary
      const topic = ref.title || 'Reflection';
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    }

    const topTopics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 2);

    return {
      quranGoalDays,
      currentQuranStreak,
      salahCount,
      reflectionCount,
      topTopics
    };
  }
};
