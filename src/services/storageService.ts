import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Bookmark {
    surahNumber: number;
    ayahNumber: number;
    surahName: string;
    previewText: string;
    timestamp: number;
}

export interface HistoryEntry {
    surahNumber: number;
    ayahNumber: number;
    surahName: string;
    timestamp: number;
}

const BOOKMARKS_KEY = '@hafiz_bookmarks';
const HISTORY_KEY = '@hafiz_history';
const LAST_READ_KEY = '@hafiz_last_read';

export const storageService = {
    async saveBookmark(bookmark: Bookmark): Promise<void> {
        const bookmarks = await this.getBookmarks();
        const exists = bookmarks.find(b => b.surahNumber === bookmark.surahNumber && b.ayahNumber === bookmark.ayahNumber);
        if (!exists) {
            bookmarks.unshift(bookmark);
            await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
        }
    },

    async removeBookmark(surahNumber: number, ayahNumber: number): Promise<void> {
        const bookmarks = await this.getBookmarks();
        const filtered = bookmarks.filter(b => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber));
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
    },

    async getBookmarks(): Promise<Bookmark[]> {
        try {
            const data = await AsyncStorage.getItem(BOOKMARKS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load bookmarks', e);
            return [];
        }
    },

    async isBookmarked(surahNumber: number, ayahNumber: number): Promise<boolean> {
        const bookmarks = await this.getBookmarks();
        return bookmarks.some(b => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber);
    },

    async saveLastRead(entry: HistoryEntry): Promise<void> {
        await AsyncStorage.setItem(LAST_READ_KEY, JSON.stringify(entry));
        await this.addToHistory(entry);
    },

    async getLastRead(): Promise<HistoryEntry | null> {
        try {
            const data = await AsyncStorage.getItem(LAST_READ_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to load last read', e);
            return null;
        }
    },

    async addToHistory(entry: HistoryEntry): Promise<void> {
        const history = await this.getHistory();

        // Remove existing entry for same surah/ayah to move it to the top
        const filteredHistory = history.filter(
            h => !(h.surahNumber === entry.surahNumber && h.ayahNumber === entry.ayahNumber)
        );

        filteredHistory.unshift(entry);

        // Keep only last 50 entries
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory.slice(0, 50)));
    },

    async getHistory(): Promise<HistoryEntry[]> {
        try {
            const data = await AsyncStorage.getItem(HISTORY_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load history', e);
            return [];
        }
    },

    async clearHistory(): Promise<void> {
        await AsyncStorage.removeItem(HISTORY_KEY);
    }
};
