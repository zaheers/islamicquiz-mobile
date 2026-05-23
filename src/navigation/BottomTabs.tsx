import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AskScreen } from '../screens/AskScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { MessageSquare, Clock, Settings } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

export const BottomTabs = () => {
  const insets = useSafeAreaInsets();
  // Give 12px breathing room above the OS nav bar
  const tabBarHeight = 56 + Math.max(insets.bottom, 12);

  return (
    <Tab.Navigator
      id="NoorBottomTabs"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="AskTab"
        component={AskScreen}
        options={{
          tabBarLabel: 'Ask',
          tabBarIcon: ({ color, size }) => (
            <MessageSquare size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => (
            <Clock size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ size }) => (
            <Settings size={size} color={colors.textSecondary} />
          ),
          tabBarItemStyle: { opacity: 0.4 },
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  );
};
