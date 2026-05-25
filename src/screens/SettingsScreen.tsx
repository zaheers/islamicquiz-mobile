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
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { SpiritualCard } from '../components/ui/SpiritualCard';
import { Trash2, Info, Target, Bell } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { goalRepository, UserGoalSettings, GoalType } from '../services/goalRepository';
import { auth } from '../lib/firebase';
import { notificationService } from '../services/notificationService';
import { ScreenContainer } from '@/components/ui/ScreenContainer';

export const SettingsScreen = () => {
    const { activeColors, colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

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
    const userId = auth?.currentUser?.uid || 'anonymous_user';
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
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeading}>Daily Goal</Text>
        <SpiritualCard style={styles.section}>
          <View style={styles.settingsRow}>
            <View style={styles.settingsIcon}>
              <Target size={20} color={colors.sg.primary} />
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
        </SpiritualCard>

        <Text style={styles.sectionHeading}>Reminders</Text>
        <SpiritualCard style={styles.section}>
          <View style={styles.settingsRow}>
            <View style={styles.settingsIcon}>
              <Bell size={20} color={colors.sg.secondary} />
            </View>
            <View style={styles.settingsBodyRow}>
              <Text style={styles.settingsLabel}>Daily Reminder</Text>
              <Switch
                value={settings.reminder_enabled}
                onValueChange={(val) => handleSaveSettings({ reminder_enabled: val })}
                trackColor={{ false: colors.sg.surfaceContainerHigh, true: colors.sg.primaryFixed }}
                thumbColor={settings.reminder_enabled ? colors.sg.primary : colors.sg.surfaceContainerHighest}
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
                  <Text style={{ color: colors.sg.onSurface }}>:</Text>
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
        </SpiritualCard>

        <Text style={styles.sectionHeading}>Data</Text>
        <SpiritualCard style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={handleClearHistory}>
            <View style={[styles.iconContainer, { backgroundColor: colors.sg.errorContainer }]}>
              <Trash2 size={20} color={colors.sg.error} />
            </View>
            <Text style={[styles.rowText, { color: colors.sg.error }]}>Clear History</Text>
          </TouchableOpacity>
        </SpiritualCard>

        <SpiritualCard style={styles.section}>
          <TouchableOpacity style={styles.row}>
            <View style={[styles.iconContainer, { backgroundColor: colors.sg.surfaceContainerHighest }]}>
              <Info size={20} color={colors.sg.primary} />
            </View>
            <Text style={styles.rowText}>About Noor AI</Text>
          </TouchableOpacity>
        </SpiritualCard>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sg.background,
  },
  header: {
    padding: spacing.l,
    backgroundColor: colors.sg.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.sg.surfaceContainerHigh,
  },
  headerTitle: {
    ...typography.sg.headlineLgMobile,
    fontSize: 28,
    color: colors.sg.primary,
  },
  content: {
    padding: spacing.m,
  },
  sectionHeading: {
    ...typography.sg.labelMd,
    color: colors.sg.outline,
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
    borderBottomColor: colors.sg.surfaceContainerHigh,
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
    ...typography.sg.bodyLg,
    fontWeight: '600',
    color: colors.sg.onSurface,
    marginBottom: 8,
  },
  textInput: {
    ...typography.sg.bodyMd,
    borderWidth: 1,
    borderColor: colors.sg.outlineVariant,
    borderRadius: 8,
    padding: 10,
    backgroundColor: colors.sg.surface,
    color: colors.sg.onSurface,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.sg.surfaceContainer,
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
    backgroundColor: colors.sg.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    ...typography.sg.labelMd,
    color: colors.sg.onSurfaceVariant,
  },
  segmentTextActive: {
    color: colors.sg.primary,
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
    ...typography.sg.bodyLg,
    fontWeight: '600',
    color: colors.sg.onSurface,
  },
  versionContainer: {
    marginTop: spacing.xl,
    marginBottom: 40,
    alignItems: 'center',
  },
  versionText: {
    ...typography.sg.labelMd,
    color: colors.sg.outline,
  },
});
