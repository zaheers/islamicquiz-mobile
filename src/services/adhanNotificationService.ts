import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { Coordinates, PrayerTimes } from 'adhan';
import { Platform } from 'react-native';
import { salahSettingsService } from '@/services/salahSettingsService';

const NOTIFICATION_IDENTIFIER_PREFIX = 'adhan_';

// Premium Mindfulness Micro-Copy for each prayer
const ADHAN_MESSAGES = {
  fajr: {
    title: '🌅 Time for Fajr',
    body: 'Awaken your soul and find peace before the world stirs.',
  },
  dhuhr: {
    title: '☀️ Time for Dhuhr',
    body: 'Pause your day. Reconnect and center yourself in His presence.',
  },
  asr: {
    title: '🌤️ Time for Asr',
    body: 'Clear your mind, step into presence, and reflect on the afternoon.',
  },
  maghrib: {
    title: '🌇 Time for Maghrib',
    body: 'As the day closes, find deep gratitude and unwind in prayer.',
  },
  isha: {
    title: '🌙 Time for Isha',
    body: 'End your day with divine connection. Surrender your worries to Him.',
  },
};

export const adhanNotificationService = {
  /**
   * Request Location Permissions
   */
  async requestLocationPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Clears all currently scheduled Adhan notifications
   */
  async clearAllScheduledAdhans() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.identifier.startsWith(NOTIFICATION_IDENTIFIER_PREFIX)) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  },

  /**
   * Main function to queue 7 days of Adhan notifications.
   * Call this silently when the app boots up or location changes.
   */
  async queueWeeklyAdhans(daysToSchedule = 7) {
    try {
      const settings = await salahSettingsService.getSettings();
      let coordinates: Coordinates | null = null;

      if (settings.locationType === 'manual' && settings.latitude && settings.longitude) {
        coordinates = new Coordinates(settings.latitude, settings.longitude);
      } else {
        const hasLocPermission = await this.requestLocationPermission();
        if (!hasLocPermission) {
          if (settings.latitude && settings.longitude) {
             coordinates = new Coordinates(settings.latitude, settings.longitude);
          } else {
             console.warn('[AdhanNotifications] Location permission denied. Cannot calculate times.');
             return;
          }
        } else {
          let location = await Location.getLastKnownPositionAsync();
          if (!location) {
            location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          }
          if (location) {
            coordinates = new Coordinates(location.coords.latitude, location.coords.longitude);
          } else if (settings.latitude && settings.longitude) {
            coordinates = new Coordinates(settings.latitude, settings.longitude);
          }
        }
      }

      if (!coordinates) return;

      const { status: notifStatus } = await Notifications.getPermissionsAsync();
      if (notifStatus !== 'granted') {
        console.warn('[AdhanNotifications] Notification permission denied.');
        return;
      }

      const params = salahSettingsService.getAdhanCalculationMethod(settings.calculationMethod);

      // Clear the old queue first to avoid duplicates
      await this.clearAllScheduledAdhans();

      const now = new Date();
      let scheduledCount = 0;

      for (let i = 0; i < daysToSchedule; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);

        const prayerTimes = new PrayerTimes(coordinates, date, params);

        const prayers = [
          { key: 'fajr', time: prayerTimes.fajr },
          { key: 'dhuhr', time: prayerTimes.dhuhr },
          { key: 'asr', time: prayerTimes.asr },
          { key: 'maghrib', time: prayerTimes.maghrib },
          { key: 'isha', time: prayerTimes.isha },
        ];

        for (const prayer of prayers) {
          // Only schedule if the time is in the future
          if (prayer.time > new Date()) {
            const message = ADHAN_MESSAGES[prayer.key as keyof typeof ADHAN_MESSAGES];
            
            await Notifications.scheduleNotificationAsync({
              identifier: `${NOTIFICATION_IDENTIFIER_PREFIX}${prayer.key}_${date.getTime()}`,
              content: {
                title: message.title,
                body: message.body,
                sound: true,
                data: { screen: 'salah-tracker' },
                ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
              },
              trigger: { date: prayer.time } as any,
            });
            scheduledCount++;
          }
        }
      }

      console.log(`[AdhanNotifications] Successfully queued ${scheduledCount} offline Adhan reminders for the next ${daysToSchedule} days.`);
    } catch (e) {
      console.warn('[AdhanNotifications] Error queuing weekly Adhans:', e);
    }
  }
};
