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

export interface MemorizationItem extends Bookmark {
    stage: number;
    nextReviewDate: number;
}

const BOOKMARKS_KEY = '@hafiz_bookmarks';
const MEMORIZING_KEY = '@hafiz_memorizing';
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

    async saveMemorizing(bookmark: Bookmark): Promise<void> {
        const list = await this.getMemorizing();
        const exists = list.find(b => b.surahNumber === bookmark.surahNumber && b.ayahNumber === bookmark.ayahNumber);
        if (!exists) {
            const newItem: MemorizationItem = {
                ...bookmark,
                stage: 0,
                nextReviewDate: Date.now()
            };
            list.unshift(newItem);
            await AsyncStorage.setItem(MEMORIZING_KEY, JSON.stringify(list));
        }
    },

    async removeMemorizing(surahNumber: number, ayahNumber: number): Promise<void> {
        const list = await this.getMemorizing();
        const filtered = list.filter(b => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber));
        await AsyncStorage.setItem(MEMORIZING_KEY, JSON.stringify(filtered));
    },

    async getMemorizing(): Promise<MemorizationItem[]> {
        try {
            const data = await AsyncStorage.getItem(MEMORIZING_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load memorizing', e);
            return [];
        }
    },

    async advanceMemorizationStage(surahNumber: number, ayahNumber: number): Promise<void> {
        const list = await this.getMemorizing();
        const index = list.findIndex(b => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber);
        
        if (index !== -1) {
            const item = list[index];
            if (item.stage === 0) {
                item.stage = 1;
                item.nextReviewDate = Date.now() + 24 * 60 * 60 * 1000; // 1 day
            } else if (item.stage === 1) {
                item.stage = 2;
                item.nextReviewDate = Date.now() + 3 * 24 * 60 * 60 * 1000; // 3 days
            } else if (item.stage === 2) {
                item.stage = 3;
                item.nextReviewDate = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
            } else if (item.stage >= 3) {
                // Completed 7 day review. Remove it as requested by user.
                list.splice(index, 1);
                await AsyncStorage.setItem(MEMORIZING_KEY, JSON.stringify(list));
                return;
            }
            list[index] = item;
            await AsyncStorage.setItem(MEMORIZING_KEY, JSON.stringify(list));
        }
    },

    async isMemorizing(surahNumber: number, ayahNumber: number): Promise<boolean> {
        const list = await this.getMemorizing();
        return list.some(b => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber);
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
