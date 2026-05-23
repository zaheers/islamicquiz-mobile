import { getDatabase } from './database';

export interface NoorHistoryItem {
  id: number;
  question: string;
  answer: string;
  created_at: string;
}

/**
 * Create the noor_ai_history table if it doesn't exist.
 * Called once during app initialisation.
 */
export function ensureNoorHistoryTable(): void {
  const db = getDatabase();
  db.execSync(`
    CREATE TABLE IF NOT EXISTS noor_ai_history (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      question   TEXT    NOT NULL,
      answer     TEXT    NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Save a Noor AI question + answer to SQLite history.
 */
export async function saveNoorHistory(question: string, answer: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'INSERT INTO noor_ai_history (question, answer) VALUES (?, ?)',
    [question, answer]
  );
}

/**
 * Load all Noor AI history items, newest first.
 */
export async function loadNoorHistory(): Promise<NoorHistoryItem[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<NoorHistoryItem>(
    'SELECT id, question, answer, created_at FROM noor_ai_history ORDER BY created_at DESC'
  );
  return rows || [];
}

/**
 * Delete a single history item by id.
 */
export async function deleteNoorHistoryItem(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM noor_ai_history WHERE id = ?', [id]);
}
