import { openUserDataDb } from './userDataDatabase';
import { getLocalDayStr, getYesterdayLocalDayStr } from '../features/dailyGoal/streakService';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'duha' | 'tahajjud';
export type PrayerStatus = 'prayed' | 'missed' | 'pending';

export const PRAYER_NAMES: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'duha', 'tahajjud'];

export const PRAYER_DISPLAY: Record<PrayerName, { label: string; emoji: string; time: string }> = {
  fajr:    { label: 'Fajr',    emoji: '🌅', time: 'Dawn' },
  dhuhr:   { label: 'Dhuhr',   emoji: '☀️', time: 'Midday' },
  asr:     { label: 'Asr',     emoji: '🌤️', time: 'Afternoon' },
  maghrib: { label: 'Maghrib', emoji: '🌇', time: 'Sunset' },
  isha:    { label: 'Isha',    emoji: '🌙', time: 'Night' },
  duha:    { label: 'Duha',    emoji: '✨', time: 'Morning' },
  tahajjud:{ label: 'Tahajjud',emoji: '🌌', time: 'Late Night' },
};

export interface SalahDayEntry {
  prayer_name: PrayerName;
  status: PrayerStatus;
  khushu: number | null;
  reflection: string | null;
  sunnah_rawatib_units: number;
  marked_at: string | null;
}

export interface SalahStreak {
  prayer_name: PrayerName;
  current_streak: number;
  longest_streak: number;
  last_completed_day: string | null;
}

export const salahRepository = {
  /**
   * Get all 5 prayer statuses for a given local day.
   * Returns entries for all prayers, defaulting to 'pending'.
   */
  async getDayLog(userId: string, localDay: string): Promise<SalahDayEntry[]> {
    const db = await openUserDataDb();

    const rows = await db.getAllAsync<any>(
      `SELECT prayer_name, status, khushu, reflection, sunnah_rawatib_units, marked_at FROM salah_daily_log
       WHERE user_id = ? AND local_day = ?`,
      [userId, localDay]
    );

    const map = new Map<string, SalahDayEntry>();
    for (const row of rows) {
      map.set(row.prayer_name, {
        prayer_name: row.prayer_name,
        status: row.status,
        khushu: row.khushu,
        reflection: row.reflection,
        sunnah_rawatib_units: row.sunnah_rawatib_units || 0,
        marked_at: row.marked_at,
      });
    }

    // Return all 7, filling defaults
    return PRAYER_NAMES.map((name) => map.get(name) || {
      prayer_name: name,
      status: 'pending' as PrayerStatus,
      khushu: null,
      reflection: null,
      sunnah_rawatib_units: 0,
      marked_at: null,
    });
  },

  /**
   * Get all prayer streaks for a user.
   */
  async getStreaks(userId: string): Promise<SalahStreak[]> {
    const db = await openUserDataDb();

    const rows = await db.getAllAsync<any>(
      `SELECT prayer_name, current_streak, longest_streak, last_completed_day
       FROM salah_streaks WHERE user_id = ?`,
      [userId]
    );

    const map = new Map<string, SalahStreak>();
    for (const row of rows) {
      map.set(row.prayer_name, {
        prayer_name: row.prayer_name,
        current_streak: row.current_streak,
        longest_streak: row.longest_streak,
        last_completed_day: row.last_completed_day,
      });
    }

    return PRAYER_NAMES.map((name) => map.get(name) || {
      prayer_name: name,
      current_streak: 0,
      longest_streak: 0,
      last_completed_day: null,
    });
  },

  /**
   * Toggle a prayer's status. Cycles: pending → prayed → missed → pending
   * Streak is updated transactionally when the status changes to/from 'prayed'.
   */
  async togglePrayer(userId: string, prayerName: PrayerName): Promise<PrayerStatus> {
    const db = await openUserDataDb();
    const todayLocal = getLocalDayStr();
    const yesterdayLocal = getYesterdayLocalDayStr();
    const now = new Date().toISOString();

    let newStatus: PrayerStatus = 'pending';

    await db.withTransactionAsync(async () => {
      // 1. Get current status
      const current = await db.getFirstAsync<any>(
        `SELECT status FROM salah_daily_log
         WHERE user_id = ? AND local_day = ? AND prayer_name = ?`,
        [userId, todayLocal, prayerName]
      );

      const oldStatus: PrayerStatus = current?.status || 'pending';

      // Cycle: pending → prayed → missed → pending
      if (oldStatus === 'pending') newStatus = 'prayed';
      else if (oldStatus === 'prayed') newStatus = 'missed';
      else newStatus = 'pending';

      // 2. Upsert daily log
      await db.runAsync(
        `INSERT INTO salah_daily_log (user_id, local_day, prayer_name, status, marked_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, local_day, prayer_name) DO UPDATE SET
           status = excluded.status,
           marked_at = excluded.marked_at,
           updated_at = excluded.updated_at`,
        [userId, todayLocal, prayerName, newStatus, now, now]
      );

      // 3. Update streak
      const streakRow = await db.getFirstAsync<any>(
        `SELECT * FROM salah_streaks WHERE user_id = ? AND prayer_name = ?`,
        [userId, prayerName]
      );

      let currentStreak = streakRow?.current_streak || 0;
      let longestStreak = streakRow?.longest_streak || 0;
      let lastCompletedDay: string | null = streakRow?.last_completed_day || null;

      if (newStatus === 'prayed' && oldStatus !== 'prayed') {
        // Transitioning TO prayed — calculate new streak
        if (lastCompletedDay === todayLocal) {
          // Already counted today (shouldn't happen, but safe)
        } else if (lastCompletedDay === yesterdayLocal) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
        longestStreak = Math.max(longestStreak, currentStreak);
        lastCompletedDay = todayLocal;
      } else if (oldStatus === 'prayed' && newStatus !== 'prayed') {
        // Transitioning FROM prayed — undo today's streak increment
        if (lastCompletedDay === todayLocal) {
          // Check if yesterday was completed to decide if we restore or reset
          const yesterdayRow = await db.getFirstAsync<any>(
            `SELECT status FROM salah_daily_log
             WHERE user_id = ? AND local_day = ? AND prayer_name = ?`,
            [userId, yesterdayLocal, prayerName]
          );
          if (yesterdayRow?.status === 'prayed') {
            // We were continuing a streak — decrement back
            currentStreak = Math.max(currentStreak - 1, 0);
            lastCompletedDay = yesterdayLocal;
          } else {
            // We started a fresh streak today — remove it
            currentStreak = 0;
            lastCompletedDay = null;
          }
        }
      }

      // 4. Upsert streak
      await db.runAsync(
        `INSERT INTO salah_streaks (user_id, prayer_name, current_streak, longest_streak, last_completed_day, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, prayer_name) DO UPDATE SET
           current_streak = excluded.current_streak,
           longest_streak = excluded.longest_streak,
           last_completed_day = excluded.last_completed_day,
           updated_at = excluded.updated_at`,
        [userId, prayerName, currentStreak, longestStreak, lastCompletedDay, now]
      );

      // 5. Enqueue sync
      await db.runAsync(
        `INSERT INTO sync_outbox (user_id, entity_type, action, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          'salah_log',
          'upsert',
          JSON.stringify({ prayer_name: prayerName, status: newStatus, local_day: todayLocal }),
          now,
        ]
      );
    });

    return newStatus;
  },

  /**
   * Save khushu rating and optional reflection for a specific prayer today.
   */
  async updateKhushuAndReflection(userId: string, prayerName: PrayerName, khushu: number | null, reflection: string | null): Promise<void> {
    const db = await openUserDataDb();
    const todayLocal = getLocalDayStr();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE salah_daily_log SET khushu = ?, reflection = ?, updated_at = ?
       WHERE user_id = ? AND local_day = ? AND prayer_name = ?`,
      [khushu, reflection, now, userId, todayLocal, prayerName]
    );

    // Enqueue sync for this update
    // We fetch the current status to send a full payload
    const row = await db.getFirstAsync<any>(
      `SELECT status FROM salah_daily_log WHERE user_id = ? AND local_day = ? AND prayer_name = ?`,
      [userId, todayLocal, prayerName]
    );
    
    if (row) {
      await db.runAsync(
        `INSERT INTO sync_outbox (user_id, entity_type, action, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          'salah_log',
          'upsert',
          JSON.stringify({ prayer_name: prayerName, status: row.status, khushu, reflection, local_day: todayLocal }),
          now,
        ]
      );
    }
  },

  /**
   * Save Sunnah Rawatib units for a specific Fard prayer today.
   */
  async updateSunnahRawatibUnits(userId: string, prayerName: PrayerName, units: number): Promise<void> {
    const db = await openUserDataDb();
    const todayLocal = getLocalDayStr();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO salah_daily_log (user_id, local_day, prayer_name, sunnah_rawatib_units, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, local_day, prayer_name) DO UPDATE SET
         sunnah_rawatib_units = excluded.sunnah_rawatib_units,
         updated_at = excluded.updated_at`,
      [userId, todayLocal, prayerName, units, now]
    );
  },

  /**
   * Get logs for the last 7 days for history view.
   */
  async getLast7DaysLog(userId: string): Promise<Record<string, SalahDayEntry[]>> {
    const db = await openUserDataDb();
    const today = new Date();
    const days: string[] = [];
    
    // Last 7 days, including today
    for(let i=0; i<7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(getLocalDayStr(d));
    }
    const placeholders = days.map(() => '?').join(',');
    
    const rows = await db.getAllAsync<any>(
      `SELECT local_day, prayer_name, status, khushu, reflection, sunnah_rawatib_units, marked_at FROM salah_daily_log
       WHERE user_id = ? AND local_day IN (${placeholders}) ORDER BY local_day DESC`,
      [userId, ...days]
    );

    const history: Record<string, SalahDayEntry[]> = {};
    for (const d of days) {
      history[d] = PRAYER_NAMES.map(name => ({
        prayer_name: name,
        status: 'pending',
        khushu: null,
        reflection: null,
        sunnah_rawatib_units: 0,
        marked_at: null,
      }));
    }

    for (const row of rows) {
      const dayArr = history[row.local_day];
      if (dayArr) {
        const idx = dayArr.findIndex(p => p.prayer_name === row.prayer_name);
        if (idx !== -1) {
          dayArr[idx] = {
            prayer_name: row.prayer_name,
            status: row.status,
            khushu: row.khushu,
            reflection: row.reflection,
            sunnah_rawatib_units: row.sunnah_rawatib_units || 0,
            marked_at: row.marked_at,
          };
        }
      }
    }
    return history;
  },
};
