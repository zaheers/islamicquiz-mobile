import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/theme/colors';

type ThemeType = 'light' | 'dark' | 'midnight';

interface ThemeContextType {
    theme: ThemeType;
    themeMode: ThemeType;
    setThemeMode: (mode: ThemeType) => void;
    activeColors: typeof colors.sg.light; 
    legacyColors: any;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@alnoor_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeMode, setThemeModeState] = useState<ThemeType>('light');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Load saved theme preference
        const loadTheme = async () => {
            try {
                const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY) as ThemeType;
                if (saved === 'light' || saved === 'dark' || saved === 'midnight') {
                    setThemeModeState(saved);
                }
            } catch (e) {
                console.error('Failed to load theme preference', e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadTheme();
    }, []);

    const setThemeMode = async (mode: ThemeType) => {
        setThemeModeState(mode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch (e) {
            console.error('Failed to save theme preference', e);
        }
    };

    const activeTheme = themeMode;
    const activeColors = activeTheme === 'midnight' ? (colors.sg as any).midnight : activeTheme === 'dark' ? colors.sg.dark : colors.sg.light;

    if (!isLoaded) return null; // Or a splash screen

    const legacyColors = {
        ...activeColors,
        sg: activeColors,
        text: activeColors.onSurface,
        textSecondary: activeColors.onSurfaceVariant,
        textLight: activeColors.inverseOnSurface,
        textBody: activeColors.onSurface,
        border: activeColors.outlineVariant,
        success: '#10B981', // fallback since no success in sg
        error: activeColors.error,
    };

    return (
        <ThemeContext.Provider value={{ theme: activeTheme, themeMode, setThemeMode, activeColors, legacyColors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return {
        ...context,
        colors: context.legacyColors,
    };
}
