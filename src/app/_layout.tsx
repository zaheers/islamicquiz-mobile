import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded] = useFonts({
        // Add custom fonts here if needed, e.g. SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
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
