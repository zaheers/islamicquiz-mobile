import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../../services/database';

const TOTAL_AYAHS = 6236;
const CACHE_KEY = 'ayah_of_day_cache';

export interface DailyAyah {
  surah_id: number;
  ayah_number: number;
  arabic_text: string;
  translation_text: string;
  transliteration_text: string;
  audio_url: string;
  surah_name: string;
  // date this was fetched so we can expire it
  date: string;
}

/** Returns today's date string in YYYY-MM-DD format (local time). */
export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Calculates day-of-year (1-based). */
function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

/** Maps today to a stable offset into the ayah table (0-based). */
export function getAyahIndexForToday(): number {
  return dayOfYear(new Date()) % TOTAL_AYAHS;
}

/** Fetch today's ayah from SQLite, returning full row. */
export async function fetchDailyAyah(): Promise<DailyAyah> {
  // Try cache first
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: DailyAyah = JSON.parse(cached);
      if (parsed.date === todayString()) return parsed;
    }
  } catch { /* ignore */ }

  const db = getDatabase();
  const offset = getAyahIndexForToday();

  const row = await db.getFirstAsync<{
    surah_id: number;
    ayah_number: number;
    arabic_text: string;
    translation_text: string;
    transliteration_text: string;
  }>(
    'SELECT surah_id, ayah_number, arabic_text, translation_text, transliteration_text FROM ayahs LIMIT 1 OFFSET ?',
    [offset]
  );

  if (!row) throw new Error('Ayah of the Day: no row found at offset ' + offset);

  // Get surah name
  const surahRow = await db.getFirstAsync<{ english_name: string }>(
    'SELECT english_name FROM surahs WHERE id = ?',
    [row.surah_id]
  );

  const pad = (n: number) => n.toString().padStart(3, '0');
  const ayah: DailyAyah = {
    ...row,
    surah_name: surahRow?.english_name || `Surah ${row.surah_id}`,
    audio_url: `https://everyayah.com/data/Alafasy_128kbps/${pad(row.surah_id)}${pad(row.ayah_number)}.mp3`,
    date: todayString(),
  };

  // Persist cache
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(ayah));
  } catch { /* ignore */ }

  return ayah;
}

/** Cache reflection text keyed by surah:ayah */
export async function getCachedReflection(surahId: number, ayahNumber: number): Promise<string | null> {
  try {
    const key = `ayah_reflection_${surahId}_${ayahNumber}`;
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function cacheReflection(surahId: number, ayahNumber: number, text: string): Promise<void> {
  try {
    const key = `ayah_reflection_${surahId}_${ayahNumber}`;
    await AsyncStorage.setItem(key, text);
  } catch { /* ignore */ }
}
