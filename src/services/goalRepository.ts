import { openUserDataDb } from './userDataDatabase';
import { calculateStreakOnGoalCompletion, StreakState, getLocalDayStr, getYesterdayLocalDayStr } from '../features/dailyGoal/streakService';

export type GoalType = 'minutes' | 'ayahs' | 'sessions';

export interface UserGoalSettings {
  user_id: string;
  goal_type: GoalType;
  target_value: number;
  reminder_enabled: boolean;
  reminder_hour: number | null;
  reminder_minute: number | null;
  timezone: string;
  notification_id: string | null;
  remote_push_enabled: boolean;
  push_token: string | null;
}

export interface DailyProgress {
  user_id: string;
  local_day: string;
  minutes_count: number;
  ayahs_count: number;
  sessions_count: number;
  goal_completed: boolean;
  goal_completed_at: string | null;
}

export interface UserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_day: string | null;
}

const DEFAULT_GOAL_TYPE = 'ayahs';
const DEFAULT_TARGET = 10;

export const goalRepository = {
  async getSettings(userId: string): Promise<UserGoalSettings> {
    const db = await openUserDataDb();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM user_goal_settings WHERE user_id = ?`,
      [userId]
    );

    if (row) {
      return {
        user_id: row.user_id,
        goal_type: row.goal_type as GoalType,
        target_value: row.target_value,
        reminder_enabled: Boolean(row.reminder_enabled),
        reminder_hour: row.reminder_hour,
        reminder_minute: row.reminder_minute,
        timezone: row.timezone,
        notification_id: row.notification_id,
        remote_push_enabled: Boolean(row.remote_push_enabled),
        push_token: row.push_token,
      };
    }

    // Default
    return {
      user_id: userId,
      goal_type: DEFAULT_GOAL_TYPE,
      target_value: DEFAULT_TARGET,
      reminder_enabled: false,
      reminder_hour: null,
      reminder_minute: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notification_id: null,
      remote_push_enabled: false,
      push_token: null,
    };
  },

  async upsertSettings(settings: UserGoalSettings): Promise<void> {
    const db = await openUserDataDb();
    const now = new Date().toISOString();
    
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO user_goal_settings 
         (user_id, goal_type, target_value, reminder_enabled, reminder_hour, reminder_minute, timezone, notification_id, remote_push_enabled, push_token, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET 
           goal_type = excluded.goal_type,
           target_value = excluded.target_value,
           reminder_enabled = excluded.reminder_enabled,
           reminder_hour = excluded.reminder_hour,
           reminder_minute = excluded.reminder_minute,
           timezone = excluded.timezone,
           notification_id = excluded.notification_id,
           remote_push_enabled = excluded.remote_push_enabled,
           push_token = excluded.push_token,
           updated_at = excluded.updated_at`,
        [
          settings.user_id,
          settings.goal_type,
          settings.target_value,
          settings.reminder_enabled ? 1 : 0,
          settings.reminder_hour,
          settings.reminder_minute,
          settings.timezone,
          settings.notification_id,
          settings.remote_push_enabled ? 1 : 0,
          settings.push_token,
          now
        ]
      );

      // Enqueue sync outbox
      await this.enqueueSync(db, settings.user_id, 'goal_settings', settings);
    });
  },

  async getTodayProgress(userId: string, todayLocal: string): Promise<DailyProgress> {
    const db = await openUserDataDb();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM daily_recitation_progress WHERE user_id = ? AND local_day = ?`,
      [userId, todayLocal]
    );

    if (row) {
      return {
        user_id: row.user_id,
        local_day: row.local_day,
        minutes_count: row.minutes_count,
        ayahs_count: row.ayahs_count,
        sessions_count: row.sessions_count,
        goal_completed: Boolean(row.goal_completed),
        goal_completed_at: row.goal_completed_at,
      };
    }

    return {
      user_id: userId,
      local_day: todayLocal,
      minutes_count: 0,
      ayahs_count: 0,
      sessions_count: 0,
      goal_completed: false,
      goal_completed_at: null,
    };
  },

  async getStreak(userId: string): Promise<UserStreak> {
    const db = await openUserDataDb();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM user_streaks WHERE user_id = ?`,
      [userId]
    );

    if (row) {
      return {
        user_id: row.user_id,
        current_streak: row.current_streak,
        longest_streak: row.longest_streak,
        last_completed_day: row.last_completed_day,
      };
    }

    return {
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      last_completed_day: null,
    };
  },

  /**
   * Increments progress. If threshold is crossed, computes new streak within transaction.
   */
  async incrementProgress(
    userId: string,
    goalType: GoalType,
    incrementAmount: number,
    targetValue: number
  ): Promise<void> {
    const db = await openUserDataDb();
    const todayLocal = getLocalDayStr();
    const yesterdayLocal = getYesterdayLocalDayStr();
    const now = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      // 1. Upsert daily progress
      // We read first to know what the values are before we update them.
      const currentProgressRow = await db.getFirstAsync<any>(
        `SELECT * FROM daily_recitation_progress WHERE user_id = ? AND local_day = ?`,
        [userId, todayLocal]
      );

      let newMinutes = currentProgressRow?.minutes_count || 0;
      let newAyahs = currentProgressRow?.ayahs_count || 0;
      let newSessions = currentProgressRow?.sessions_count || 0;
      let wasCompleted = Boolean(currentProgressRow?.goal_completed);
      let newCompletedAt = currentProgressRow?.goal_completed_at || null;

      if (goalType === 'minutes') newMinutes += incrementAmount;
      if (goalType === 'ayahs') newAyahs += incrementAmount;
      if (goalType === 'sessions') newSessions += incrementAmount;

      const currentAmount = goalType === 'minutes' ? newMinutes : goalType === 'ayahs' ? newAyahs : newSessions;
      const isNowCompleted = currentAmount >= targetValue;
      const justCompleted = isNowCompleted && !wasCompleted;

      if (justCompleted) {
        newCompletedAt = now;
      }

      await db.runAsync(
        `INSERT INTO daily_recitation_progress 
         (user_id, local_day, minutes_count, ayahs_count, sessions_count, goal_completed, goal_completed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, local_day) DO UPDATE SET 
           minutes_count = excluded.minutes_count,
           ayahs_count = excluded.ayahs_count,
           sessions_count = excluded.sessions_count,
           goal_completed = excluded.goal_completed,
           goal_completed_at = excluded.goal_completed_at,
           updated_at = excluded.updated_at`,
        [userId, todayLocal, newMinutes, newAyahs, newSessions, isNowCompleted ? 1 : 0, newCompletedAt, now]
      );

      // 2. Compute and save streak if just completed
      if (justCompleted) {
        const streakRow = await db.getFirstAsync<any>(
          `SELECT * FROM user_streaks WHERE user_id = ?`,
          [userId]
        );

        const currentStreakState: StreakState = {
          currentStreak: streakRow?.current_streak || 0,
          longestStreak: streakRow?.longest_streak || 0,
          lastCompletedDay: streakRow?.last_completed_day || null,
        };

        const newStreakState = calculateStreakOnGoalCompletion(currentStreakState, todayLocal, yesterdayLocal);

        await db.runAsync(
          `INSERT INTO user_streaks 
           (user_id, current_streak, longest_streak, last_completed_day, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET 
             current_streak = excluded.current_streak,
             longest_streak = excluded.longest_streak,
             last_completed_day = excluded.last_completed_day,
             updated_at = excluded.updated_at`,
          [
            userId,
            newStreakState.currentStreak,
            newStreakState.longestStreak,
            newStreakState.lastCompletedDay,
            now
          ]
        );

        // Enqueue sync for streak
        await this.enqueueSync(db, userId, 'streak', newStreakState);
      }
    });
  },

  async enqueueSync(db: any, userId: string, entityType: string, payload: any) {
    await db.runAsync(
      `INSERT INTO sync_outbox (user_id, entity_type, action, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, entityType, 'upsert', JSON.stringify(payload), new Date().toISOString()]
    );
  }
};
