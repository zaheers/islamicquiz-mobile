import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  ScrollView,
} from 'react-native';
import { Header } from '@/components/ui/Header';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Card } from '@/components/ui/Card';
import { Trash2, Info, Target, Bell } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { goalRepository, UserGoalSettings, GoalType } from '@/services/goalRepository';
import { auth } from '@/lib/firebase';
import { notificationService } from '@/services/notificationService';

export default function ProfileScreen() {
  const [settings, setSettings] = useState<UserGoalSettings | null>(null);
  const [targetValueStr, setTargetValueStr] = useState('10');
  const [hourStr, setHourStr] = useState('08');
  const [minuteStr, setMinuteStr] = useState('00');

  useEffect(() => {
    const loadSettings = async () => {
      const userId = auth?.currentUser?.uid || 'anonymous_user';
      const s = await goalRepository.getSettings(userId);
      setSettings(s);
      setTargetValueStr(s.target_value.toString());
      if (s.reminder_hour !== null) setHourStr(s.reminder_hour.toString().padStart(2, '0'));
      if (s.reminder_minute !== null) setMinuteStr(s.reminder_minute.toString().padStart(2, '0'));
    };
    loadSettings();
  }, []);

  const handleSaveSettings = async (updates: Partial<UserGoalSettings>) => {
    if (!settings) return;
    const newSettings = { ...settings, ...updates };
    
    // Handle reminders
    if (newSettings.reminder_enabled && newSettings.reminder_hour !== null && newSettings.reminder_minute !== null) {
      const newId = await notificationService.scheduleDailyReminder(
        newSettings.reminder_hour,
        newSettings.reminder_minute,
        settings.notification_id
      );
      newSettings.notification_id = newId;
    } else if (!newSettings.reminder_enabled && settings.notification_id) {
      await notificationService.cancelReminder(settings.notification_id);
      newSettings.notification_id = null;
    }

    await goalRepository.upsertSettings(newSettings);
    setSettings(newSettings);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all your question history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('noor_history');
            Alert.alert('Success', 'History has been cleared.');
          },
        },
      ]
    );
  };

  if (!settings) return null;

  return (
    <ScreenContainer safe={false} style={styles.container}>
      <Header title="Profile & Settings" showBack />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionHeading}>Daily Goal</Text>
        <Card style={styles.section}>
          <View style={styles.settingsRow}>
            <View style={styles.settingsIcon}>
              <Target size={20} color={colors.primary} />
            </View>
            <View style={styles.settingsBody}>
              <Text style={styles.settingsLabel}>Goal Type</Text>
              <View style={styles.segmentedControl}>
                {(['ayahs', 'minutes', 'sessions'] as GoalType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.segment, settings.goal_type === type && styles.segmentActive]}
                    onPress={() => handleSaveSettings({ goal_type: type })}
                  >
                    <Text style={[styles.segmentText, settings.goal_type === type && styles.segmentTextActive]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.settingsRow}>
            <View style={styles.settingsIcon} />
            <View style={styles.settingsBody}>
              <Text style={styles.settingsLabel}>Target Value</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="number-pad"
                value={targetValueStr}
                onChangeText={setTargetValueStr}
                onBlur={() => {
                  const val = parseInt(targetValueStr) || 10;
                  setTargetValueStr(val.toString());
                  handleSaveSettings({ target_value: val });
                }}
              />
            </View>
          </View>
        </Card>

        <Text style={styles.sectionHeading}>Reminders</Text>
        <Card style={styles.section}>
          <View style={styles.settingsRow}>
            <View style={styles.settingsIcon}>
              <Bell size={20} color={colors.primary} />
            </View>
            <View style={styles.settingsBodyRow}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={styles.settingsLabel}>Remote Streak Warnings</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Get notified if you're about to lose your streak</Text>
              </View>
              <Switch
                value={settings.remote_push_enabled}
                onValueChange={async (val) => {
                  let token = settings.push_token;
                  if (val && !token) {
                    token = await notificationService.getPushTokenAsync();
                  }
                  handleSaveSettings({ 
                    remote_push_enabled: val,
                    push_token: val ? token : settings.push_token 
                  });
                }}
              />
            </View>
          </View>

          <View style={styles.settingsRow}>
            <View style={styles.settingsIcon}>
              <Bell size={20} color="#F59E0B" />
            </View>
            <View style={styles.settingsBodyRow}>
              <Text style={styles.settingsLabel}>Daily Local Reminder</Text>
              <Switch
                value={settings.reminder_enabled}
                onValueChange={(val) => handleSaveSettings({ reminder_enabled: val })}
              />
            </View>
          </View>

          {settings.reminder_enabled && (
            <View style={styles.settingsRow}>
              <View style={styles.settingsIcon} />
              <View style={styles.settingsBody}>
                <Text style={styles.settingsLabel}>Time (HH:MM 24h)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput
                    style={[styles.textInput, { width: 60 }]}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={hourStr}
                    onChangeText={setHourStr}
                    onBlur={() => {
                      let h = parseInt(hourStr) || 8;
                      if (h > 23) h = 23;
                      if (h < 0) h = 0;
                      setHourStr(h.toString().padStart(2, '0'));
                      handleSaveSettings({ reminder_hour: h });
                    }}
                  />
                  <Text>:</Text>
                  <TextInput
                    style={[styles.textInput, { width: 60 }]}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={minuteStr}
                    onChangeText={setMinuteStr}
                    onBlur={() => {
                      let m = parseInt(minuteStr) || 0;
                      if (m > 59) m = 59;
                      if (m < 0) m = 0;
                      setMinuteStr(m.toString().padStart(2, '0'));
                      handleSaveSettings({ reminder_minute: m });
                    }}
                  />
                </View>
              </View>
            </View>
          )}
        </Card>

        <Text style={styles.sectionHeading}>Data</Text>
        <Card style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={handleClearHistory}>
            <View style={[styles.iconContainer, { backgroundColor: colors.error + '10' }]}>
              <Trash2 size={20} color={colors.error} />
            </View>
            <Text style={[styles.rowText, { color: colors.error }]}>Clear History</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.section}>
          <TouchableOpacity style={styles.row}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '10' }]}>
              <Info size={20} color={colors.primary} />
            </View>
            <Text style={styles.rowText}>About Noor AI</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: spacing.m,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    marginBottom: spacing.m,
    padding: 0,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    padding: spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsBodyRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsIcon: {
    width: 36,
    alignItems: 'center',
    marginRight: 12,
  },
  settingsBody: {
    flex: 1,
  },
  settingsLabel: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.l,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  rowText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  versionContainer: {
    marginTop: spacing.xl,
    marginBottom: 40,
    alignItems: 'center',
  },
  versionText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
