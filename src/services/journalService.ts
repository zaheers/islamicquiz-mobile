import AsyncStorage from '@react-native-async-storage/async-storage';

export interface JournalEntry {
  id: string;
  date: string;       // ISO date string
  title: string;
  content: string;
  moodIcon: string;
}

const STORAGE_KEY = '@alnoor_journal_entries';

export const journalService = {
  async getEntries(): Promise<JournalEntry[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const entries: JournalEntry[] = JSON.parse(data);
      // Sort newest first
      return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
      console.error('[JournalService] Error reading entries:', e);
      return [];
    }
  },

  async saveEntry(title: string, content: string, moodIcon: string = 'wb_sunny'): Promise<JournalEntry> {
    try {
      const entries = await this.getEntries();
      const newEntry: JournalEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        title,
        content,
        moodIcon,
      };
      
      entries.push(newEntry);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      return newEntry;
    } catch (e) {
      console.error('[JournalService] Error saving entry:', e);
      throw e;
    }
  },

  async deleteEntry(id: string): Promise<void> {
    try {
      const entries = await this.getEntries();
      const updated = entries.filter(e => e.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('[JournalService] Error deleting entry:', e);
    }
  },

  async getStats(): Promise<{ total: number; streak: number }> {
    const entries = await this.getEntries();
    if (entries.length === 0) {
      return { total: 0, streak: 0 };
    }

    // Sort by date descending
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 1;
    let currentDate = new Date(entries[0].date);
    currentDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If latest entry is older than yesterday, streak is 0
    const diffTime = Math.abs(today.getTime() - currentDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays > 1) {
      return { total: entries.length, streak: 0 };
    }

    // Calculate streak
    for (let i = 1; i < entries.length; i++) {
      const prevDate = new Date(entries[i].date);
      prevDate.setHours(0, 0, 0, 0);
      
      const diff = Math.ceil(Math.abs(currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === 1) {
        streak++;
        currentDate = prevDate;
      } else if (diff === 0) {
        // Same day, continue
      } else {
        break; // Streak broken
      }
    }

    return {
      total: entries.length,
      streak,
    };
  }
};
