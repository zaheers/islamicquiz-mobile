import { ensureAnonymousAuth } from '@/lib/auth';
import { initDatabase } from '@/services/database';
import { openUserDataDb } from '@/services/userDataDatabase';
import { notificationService } from '@/services/notificationService';
import { firebaseSyncService } from '@/services/firebaseSyncService';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { LogBox } from 'react-native';

// Ignore specific warnings that trigger unnecessary red boxes in Expo Go
LogBox.ignoreLogs([
    'expo-notifications: Android Push notifications',
    'Expo AV has been deprecated',
    'warnOfExpoGoPushUsage',
    'getExpoPushTokenAsync',
]);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded] = useFonts({
        'KFGQPCHafs':      require('../../assets/font/KFGQPC Uthmanic Script HAFS Regular.otf'),
        'RobotoSerif':     require('../../assets/font/RobotoSerif-Regular.ttf'),
        'RobotoSerifItalic': require('../../assets/font/RobotoSerif-Italic.ttf'),
        'NotoSans':        require('../../assets/font/NotoSans-Regular.ttf'),
        'NotoSansMedium':  require('../../assets/font/NotoSans-Medium.ttf'),
    });
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isDbReady, setIsDbReady] = useState(false);

    useEffect(() => {
        let syncCleanup: (() => void) | undefined;

        const initApp = async () => {
            try {
                // Initialize database first
                await initDatabase();
                await openUserDataDb();
                setIsDbReady(true);

                if (loaded) {
                    // Initialize notifications (non-blocking)
                    try {
                        await notificationService.initialize();
                    } catch (e) {
                        console.warn("[RootLayout] Notification init failed:", e);
                    }

                    // Fonts loaded, now ensure auth
                    await ensureAnonymousAuth();
                    setIsAuthReady(true);

                    // Start best-effort Firebase sync (outbox → Firestore)
                    syncCleanup = firebaseSyncService.startAutoSync();

                    // Add a small delay so the branding is visible
                    setTimeout(() => {
                        SplashScreen.hideAsync();
                    }, 1500);
                }
            } catch (error) {
                console.error("Initialization error:", error);
                // Even on error, we might want to let the app load or show an error screen
                setIsDbReady(true); 
            }
        };
        initApp();

        return () => {
            syncCleanup?.();
        };
    }, [loaded]);

    if (!loaded || !isAuthReady || !isDbReady) {
        // While waiting, show a minimal loading or stay on Splash.
        // Since we preventAutoHideAsync, we can just return null and it stays on native splash
        // until we call hideAsync.
        // MEANING: We don't strictly need a custom Loading UI if we keep Splash visible.
        // Let's rely on Native Splash for the cleanest transition.
        return null;
    }

    return (
        <>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#F3F4F6' },
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="quiz/[id]/index" />
                <Stack.Screen name="quiz/[id]/play" />
                <Stack.Screen name="quiz/[id]/result" options={{ gestureEnabled: false }} />
                <Stack.Screen name="weekly-summary" options={{ title: "This Week's Heart & Habits" }} />
                <Stack.Screen name="reflections-list" options={{ title: "My Reflections" }} />
                <Stack.Screen name="salah-tracker" />
                <Stack.Screen name="today-plan/index" />
                <Stack.Screen name="today-plan/summary" options={{ gestureEnabled: false }} />
                <Stack.Screen name="ask-my-day" />
            </Stack>
            <StatusBar style="dark" />
        </>
    );
}
