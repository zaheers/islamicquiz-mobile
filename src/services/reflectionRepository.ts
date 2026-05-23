import { openUserDataDb } from './userDataDatabase';
import { getLocalDayStr } from '../features/dailyGoal/streakService';

export interface Reflection {
  id?: number;
  created_at: string;
  local_day: string;
  topic: string;
  verses_json: string;
  note: string;
}

export const reflectionRepository = {
  async saveReflection(topic: string, verses: any[], note: string): Promise<void> {
    const db = await openUserDataDb();
    const now = new Date().toISOString();
    const localDay = getLocalDayStr();
    const versesJson = JSON.stringify(verses.map(v => ({ reference: v.reference || `${v.surah_name_en || v.surah_name || v.surah}:${v.ayah_number || v.ayah}` })));

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS reflections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        local_day TEXT NOT NULL,
        topic TEXT NOT NULL,
        verses_json TEXT NOT NULL,
        note TEXT NOT NULL
      );
    `);

    await db.runAsync(
      `INSERT INTO reflections (created_at, local_day, topic, verses_json, note)
       VALUES (?, ?, ?, ?, ?)`,
      [now, localDay, topic, versesJson, note]
    );
  },

  async getReflectionsForDays(days: string[]): Promise<Reflection[]> {
    if (days.length === 0) return [];
    
    const db = await openUserDataDb();
    const placeholders = days.map(() => '?').join(',');
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS reflections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        local_day TEXT NOT NULL,
        topic TEXT NOT NULL,
        verses_json TEXT NOT NULL,
        note TEXT NOT NULL
      );
    `);

    const rows = await db.getAllAsync<any>(
      `SELECT * FROM reflections WHERE local_day IN (${placeholders}) ORDER BY created_at DESC`,
      days
    );
    
    return rows.map(row => ({
      id: row.id,
      created_at: row.created_at,
      local_day: row.local_day,
      topic: row.topic,
      verses_json: row.verses_json,
      note: row.note
    }));
  }
};
