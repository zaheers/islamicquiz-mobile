import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system/legacy";
import { Asset } from "expo-asset";

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

export async function initDatabase(): Promise<void> {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      const dbName = "quran.db";
      const documentDir = FileSystem.documentDirectory;
      
      if (!documentDir) throw new Error("Unable to access document directory");

      const targetDir = `${documentDir}SQLite/`;
      const dbPath = `${targetDir}${dbName}`;

      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(targetDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
      }

      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      
      let needsUpdate = false;
      if (fileInfo.exists) {
          try {
              const checkDb = SQLite.openDatabaseSync(dbName);
              // Check for words_json column
              const tableInfo = checkDb.getAllSync<any>("PRAGMA table_info(ayahs)");
              const hasWordsJson = tableInfo.some((col: any) => col.name === 'words_json');
              
              // NEW: Check for Bismillah (Ayah 0) in Surah 2 to ensure data update
              const bismillahCheck = checkDb.getFirstSync<any>("SELECT 1 FROM ayahs WHERE surah_id = 2 AND ayah_number = 0");
              const hasBismillah = !!bismillahCheck;

              // NEW: Check for refined Arabic names (starting with سورة)
              const firstSurah = checkDb.getFirstSync<any>("SELECT name FROM surahs WHERE id = 1");
              const hasRefinedNames = firstSurah?.name?.startsWith("سورة");

              checkDb.closeSync();
              
              if (!hasWordsJson || !hasBismillah || !hasRefinedNames) {
                  if (__DEV__) console.log(`[Database] ${!hasWordsJson ? 'words_json missing' : (!hasBismillah ? 'Bismillah missing' : 'Names outdated')}, forcing update...`);
                  needsUpdate = true;
              }
          } catch (e) {
              console.warn("[Database] Update check failed, will verify file size:", e);
          }
      }

      const isSuspicious = fileInfo.exists && fileInfo.size < 10240;

      if (!fileInfo.exists || isSuspicious || needsUpdate) {
        if (__DEV__) console.log("[Database] Initializing/Updating database...");
        if (fileInfo.exists) await FileSystem.deleteAsync(dbPath, { idempotent: true });
        
        const asset = Asset.fromModule(require("../../assets/database/quran.db"));
        await asset.downloadAsync();

        if (!asset.localUri) throw new Error("Failed to download database asset");

        await FileSystem.copyAsync({ from: asset.localUri, to: dbPath });
        if (__DEV__) console.log("[Database] Copy successful.");
      } else {
        if (__DEV__) console.log("[Database] Database ready.");
      }

      // Initialize the global DB instance once
      db = SQLite.openDatabaseSync(dbName);
      // Ensure Noor AI history table exists (app-level table, not in quran.db asset)
      const { ensureNoorHistoryTable } = await import('./noorHistoryService');
      ensureNoorHistoryTable();
      if (__DEV__) console.log("[Database] Initialization complete.");
    } catch (error) {
      console.error("Error initializing database:", error);
      initPromise = null; // Allow retry
      throw error;
    }
  })();
  
  return initPromise;
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    // Fallback if not initialized (though it should be via RootLayout)
    db = SQLite.openDatabaseSync("quran.db");
  }
  return db;
}
