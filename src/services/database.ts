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
      const { ensureNoorHistoryTable } = require('./noorHistoryService');
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
