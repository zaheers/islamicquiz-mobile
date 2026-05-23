import { getDatabase } from "./database";

export interface Surah {
  id: number;
  number: number; // Used by QuranReciter navigation
  name: string;
  englishName: string; // Used by QuranReciter and storage service
  ayah_count: number;
  numberOfAyahs: number; // Used by HomeScreen and QuranReciter
  revelationType: string; // Used by Surah list
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  translation: string;
  transliteration: string;
  tajweedText?: string;
  audio: string;
  segments?: any[];
  words?: any[];
}

export const quranService = {
  /**
   * Get all surahs with fields mapped for UI compatibility.
   */
  async getSurahs(): Promise<Surah[]> {
    try {
      const db = getDatabase();
      const results = await db.getAllAsync<any>("SELECT * FROM surahs ORDER BY id");
      return (results || []).map(row => ({
        ...row,
        number: row.id,
        numberOfAyahs: row.ayah_count,
        englishName: row.english_name || `Surah ${row.id}`, 
        revelationType: row.revelation_type || "Meccan",
      }));
    } catch (error) {
      console.error("Error fetching surahs from SQLite:", error);
      return [];
    }
  },

  /**
   * Get a single ayah with a robust structure to prevent UI crashes.
   */
  async getAyah(surah: number, ayah: number): Promise<Ayah> {
    try {
      const db = getDatabase();
      const row = await db.getFirstAsync<{
        id: number;
        surah_id: number;
        ayah_number: number;
        arabic_text: string;
        translation_text: string;
        transliteration_text: string;
        tajweed_text: string;
        words_json: string;
      }>(
        "SELECT * FROM ayahs WHERE surah_id = ? AND ayah_number = ?",
        [surah, ayah]
      );

      if (!row) {
        throw new Error(`Ayah ${surah}:${ayah} not found`);
      }

      let words = [];
      try {
        words = JSON.parse(row.words_json || "[]").map((w: any, i: number, arr: any[]) => ({
           ...w,
           start: i / arr.length,
           end: (i + 1) / arr.length
        }));
      } catch (e) {
        console.error("Error parsing words_json:", e);
      }

      const pad = (num: number) => num.toString().padStart(3, '0');
      // For Ayah 0 (Bismillah), use the universal Bismillah audio from Al-Fatihah
      const audioAyah = ayah === 0 ? 1 : ayah;
      const audioSurah = ayah === 0 ? 1 : surah;
      const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${pad(audioSurah)}${pad(audioAyah)}.mp3`;

      return {
        number: row.ayah_number,
        text: row.arabic_text,
        numberInSurah: row.ayah_number,
        translation: row.translation_text,
        transliteration: row.transliteration_text,
        tajweedText: row.tajweed_text,
        words,
        audio: audioUrl,
      };
    } catch (error) {
      console.error(`Error fetching ayah ${surah}:${ayah} from SQLite:`, error);
      return {
        number: ayah,
        text: "Ayah not found",
        numberInSurah: ayah,
        translation: "",
        transliteration: "",
        audio: "",
      };
    }
  },

  /**
   * Alias for getAyah to maintain compatibility with SurahDetailScreen and QuranReciter.
   */
  async getAyahWithTranslationAndAudio(surah: number, ayah: number): Promise<Ayah> {
    return this.getAyah(surah, ayah);
  },

  /**
   * Get all ayahs of a surah.
   */
  async getSurahAyahs(surah: number): Promise<Ayah[]> {
    try {
      const db = getDatabase();
      const results = await db.getAllAsync<{
        id: number;
        surah_id: number;
        ayah_number: number;
        arabic_text: string;
        translation_text: string;
        transliteration_text: string;
        tajweed_text: string;
        words_json: string;
      }>(
        "SELECT id, surah_id, ayah_number, arabic_text, translation_text, transliteration_text, tajweed_text, words_json FROM ayahs WHERE surah_id = ? ORDER BY ayah_number ASC",
        [surah]
      );

      return (results || []).map((row) => {
        let words = [];
        try {
          words = JSON.parse(row.words_json || "[]").map((w: any, i: number, arr: any[]) => ({
            ...w,
            start: i / arr.length,
            end: (i + 1) / arr.length
          }));
        } catch (e) {
          console.error("Error parsing words_json in list:", e);
        }
        
        const pad = (n: number) => n.toString().padStart(3, "0");
        const audioAyah = row.ayah_number === 0 ? 1 : row.ayah_number;
        const audioSurah = row.ayah_number === 0 ? 1 : row.surah_id;
        
        return {
          number: row.ayah_number,
          text: row.arabic_text,
          numberInSurah: row.ayah_number,
          translation: row.translation_text,
          transliteration: row.transliteration_text,
          tajweedText: row.tajweed_text,
          words,
          audio: `https://everyayah.com/data/Alafasy_128kbps/${pad(audioSurah)}${pad(audioAyah)}.mp3`,
        };
      });
    } catch (error) {
      console.error(`Error fetching ayahs for surah ${surah} from SQLite:`, error);
      return [];
    }
  },
};
