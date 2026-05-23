import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const STORAGE_KEY = 'daily_quran_goal';

// Helper to get Notifications lazily to avoid Expo Go push warnings at module load
const getNotifications = () => {
    try {
        const originalConsoleError = console.error;
        console.error = (...args) => {
            if (typeof args[0] === 'string' && args[0].includes('expo-notifications: Android Push notifications')) {
                return;
            }
            originalConsoleError(...args);
        };

        const notifications = require('expo-notifications');

        console.error = originalConsoleError;
        return notifications;
    } catch (e) {
        return null;
    }
};

const isExpoGo = Constants.appOwnership === 'expo';

export const notificationService = {
  async requestPermissions() {
    // Allow permissions request in Expo Go for local notifications
    const Notifications = getNotifications();
    if (!Notifications) return false;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (e) {
      return false;
    }
  },

  async getPushTokenAsync(projectId?: string): Promise<string | null> {
    try {
      const Notifications = getNotifications();
      if (!Notifications) return null;

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('[NotificationService] Permission denied for remote push token.');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId || Constants.expoConfig?.extra?.eas?.projectId,
      });

      return tokenData.data;
    } catch (e) {
      console.warn('[NotificationService] Error getting push token:', e);
      return null;
    }
  },

  async scheduleDailyReminder(hour: number, minute: number, oldNotificationId?: string | null): Promise<string | null> {
    try {
      const Notifications = getNotifications();
      if (!Notifications) return null;

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('[NotificationService] Permission denied for scheduling reminder.');
        return null;
      }

      if (oldNotificationId) {
        await Notifications.cancelScheduledNotificationAsync(oldNotificationId);
      }

      const newId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📖 Time for your Daily Quran Goal',
          body: 'Continue your recitation and keep your streak alive!',
          data: { screen: 'Home' },
          sound: true,
          ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });

      return newId;
    } catch (e) {
      console.warn('[NotificationService] Error scheduling daily reminder:', e);
      return null;
    }
  },

  async cancelReminder(notificationId: string | null) {
    try {
      const Notifications = getNotifications();
      if (!Notifications || !notificationId) return;
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (e) {
      console.warn('[NotificationService] Error canceling reminder:', e);
    }
  },

  async initialize() {
    // Notifications should work in both Expo Go (local) and builds

    try {
      const Notifications = getNotifications();
      if (!Notifications) return;

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
      
      // Removed hardcoded scheduleDailyReminders()
      // We will schedule them from useDailyGoal or SettingsScreen
    } catch (error) {
      if (__DEV__) console.error('[NotificationService] Init error:', error);
    }
  },

  async sendTestNotification() {
    const Notifications = getNotifications();
    if (!Notifications) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Test Notification',
        body: 'If you see this, notifications are working correctly!',
        data: { test: true },
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
      },
      trigger: null, // Send immediately
    });
  }
};
