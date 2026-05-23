import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function openUserDataDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync('user_data.db');

    await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS user_goal_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      goal_type TEXT NOT NULL,                -- 'minutes' | 'ayahs' | 'sessions'
      target_value INTEGER NOT NULL,
      reminder_enabled INTEGER NOT NULL DEFAULT 0,  -- 0/1
      reminder_hour INTEGER,                  -- 0-23
      reminder_minute INTEGER,                -- 0-59
      timezone TEXT NOT NULL,
      notification_id TEXT,                   -- expo scheduled notification id
      remote_push_enabled INTEGER NOT NULL DEFAULT 0, -- 0/1
      push_token TEXT,                        -- FCM/Expo push token
      updated_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_goal_settings_user
      ON user_goal_settings(user_id);

    CREATE TABLE IF NOT EXISTS daily_recitation_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      local_day TEXT NOT NULL,                -- 'YYYY-MM-DD'
      minutes_count INTEGER NOT NULL DEFAULT 0,
      ayahs_count INTEGER NOT NULL DEFAULT 0,
      sessions_count INTEGER NOT NULL DEFAULT 0,
      goal_completed INTEGER NOT NULL DEFAULT 0, -- 0/1
      goal_completed_at TEXT,                 -- ISO string when threshold crossed
      updated_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_progress_user_day
      ON daily_recitation_progress(user_id, local_day);

    CREATE TABLE IF NOT EXISTS user_streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      last_completed_day TEXT,                -- 'YYYY-MM-DD'
      updated_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_streaks_user
      ON user_streaks(user_id);

    CREATE TABLE IF NOT EXISTS sync_outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,              -- 'goal_settings' | 'streak' | 'salah_log' etc.
      action TEXT NOT NULL,                   -- 'upsert'
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'sent' | 'error'
      created_at TEXT NOT NULL,
      last_attempt_at TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS salah_daily_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      local_day TEXT NOT NULL,                -- 'YYYY-MM-DD'
      prayer_name TEXT NOT NULL,              -- 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
      status TEXT NOT NULL DEFAULT 'pending', -- 'prayed' | 'missed' | 'pending'
      khushu INTEGER,                         -- 1 to 5
      reflection TEXT,                        -- Optional reflection text
      marked_at TEXT,                         -- ISO string when user toggled
      updated_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_salah_log_user_day_prayer
      ON salah_daily_log(user_id, local_day, prayer_name);

    CREATE TABLE IF NOT EXISTS salah_streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      prayer_name TEXT NOT NULL,              -- 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      last_completed_day TEXT,                -- 'YYYY-MM-DD'
      updated_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_salah_streaks_user_prayer
      ON salah_streaks(user_id, prayer_name);

    CREATE TABLE IF NOT EXISTS reflections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,               -- ISO string
      local_day TEXT NOT NULL,                -- 'YYYY-MM-DD'
      topic TEXT NOT NULL,                    -- Selected topic string
      verses_json TEXT NOT NULL,              -- JSON string of verse references
      note TEXT NOT NULL                      -- User's reflection text
    );
    `);

    dbInstance = db;
    
    // Migration for ALN-004 (adding khushu and reflection columns to existing db)
    try {
      await db.execAsync(`
        ALTER TABLE salah_daily_log ADD COLUMN khushu INTEGER;
      `);
    } catch(e) { /* Ignore if exists */ }
    try {
      await db.execAsync(`
        ALTER TABLE salah_daily_log ADD COLUMN reflection TEXT;
      `);
    } catch(e) { /* Ignore if exists */ }

    // Migration for ALN-010 (Remote Push Notifications)
    try {
      await db.execAsync(`
        ALTER TABLE user_goal_settings ADD COLUMN remote_push_enabled INTEGER NOT NULL DEFAULT 0;
      `);
    } catch(e) { /* Ignore if exists */ }
    try {
      await db.execAsync(`
        ALTER TABLE user_goal_settings ADD COLUMN push_token TEXT;
      `);
    } catch(e) { /* Ignore if exists */ }

    return db;
  })();

  return initPromise;
}
