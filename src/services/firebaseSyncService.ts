import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { openUserDataDb } from './userDataDatabase';
import { db as firestore, auth } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

let isProcessing = false;

export const firebaseSyncService = {
  /**
   * Processes the sync_outbox and pushes changes to Firestore.
   * This is idempotent and can be safely called periodically.
   * Skips silently if Firebase is not configured, user is not authed,
   * or a previous processOutbox call is still in progress.
   */
  async processOutbox() {
    if (isProcessing) return;
    if (!firestore || !auth?.currentUser) return;

    isProcessing = true;
    try {
      const db = await openUserDataDb();

      // Fetch pending items (limit to 20 per pass to avoid long holds)
      const items = await db.getAllAsync<any>(
        `SELECT * FROM sync_outbox WHERE status = 'pending' ORDER BY created_at ASC LIMIT 20`
      );

      for (const item of items) {
        try {
          const payload = JSON.parse(item.payload_json);
          const docRef = doc(firestore, `${item.entity_type}s`, item.user_id);

          await setDoc(docRef, payload, { merge: true });

          // Mark as sent
          await db.runAsync(
            `UPDATE sync_outbox SET status = 'sent', last_attempt_at = ? WHERE id = ?`,
            [new Date().toISOString(), item.id]
          );
        } catch (error) {
          // Increment retry count, mark as error after 5 retries
          const newRetry = (item.retry_count || 0) + 1;
          const newStatus = newRetry >= 5 ? 'error' : 'pending';
          await db.runAsync(
            `UPDATE sync_outbox SET status = ?, retry_count = ?, last_attempt_at = ? WHERE id = ?`,
            [newStatus, newRetry, new Date().toISOString(), item.id]
          );
        }
      }
    } catch (e) {
      if (__DEV__) console.warn('[SyncService] processOutbox error:', e);
    } finally {
      isProcessing = false;
    }
  },

  /**
   * Starts background listeners that trigger sync on:
   * 1. App returning to foreground (AppState → 'active')
   * 2. Network becoming reachable (NetInfo)
   *
   * Call once during app initialization. Returns a cleanup function.
   */
  startAutoSync(): () => void {
    // 1. Sync on app foreground
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        this.processOutbox();
      }
    };
    const appStateSub = AppState.addEventListener('change', handleAppState);

    // 2. Sync on network reconnect
    const netInfoUnsub = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        this.processOutbox();
      }
    });

    // 3. Immediate first sync attempt
    this.processOutbox();

    // Return combined cleanup
    return () => {
      appStateSub.remove();
      netInfoUnsub();
    };
  },
};
