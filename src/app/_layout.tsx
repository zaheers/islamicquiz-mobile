import { ensureAnonymousAuth } from '@/lib/auth';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded] = useFonts({
        // Add custom fonts here if needed
    });
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const initApp = async () => {
            if (loaded) {
                // Fonts loaded, now ensure auth
                await ensureAnonymousAuth();
                setIsAuthReady(true);
                SplashScreen.hideAsync();
            }
        };
        initApp();
    }, [loaded]);

    if (!loaded || !isAuthReady) {
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
            </Stack>
            <StatusBar style="dark" />
        </>
    );
}
