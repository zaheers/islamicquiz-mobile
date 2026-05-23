import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { categories } from '@/lib/mockData';
import { quranService, Surah } from '@/services/quranService';
import { storageService } from '@/services/storageService';
import { AyahOfDayCard } from '@/features/ayahOfDay/AyahOfDayCard';
import { useAyahOfDay } from '@/features/ayahOfDay/useAyahOfDay';
import { DailyQuranGoalCard } from '@/features/dailyGoal/DailyQuranGoalCard';
import { useDailyGoal } from '@/features/dailyGoal/useDailyGoal';
import { ContinueReadingCard } from '@/features/quran/components/ContinueReadingCard';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MessageCircle, User, HeartPulse, HelpCircle } from 'lucide-react-native';
import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

// Global styling constants
const SPACING = {
    outer: 16,
    card: 12,
};
const RADII = {
    card: 18,
};

export default function HomeScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'Hifz' | 'Quiz' | 'AI'>('Hifz');

    const [lastReadSurah, setLastReadSurah] = useState<number | null>(null);
    const [lastReadAyah, setLastReadAyah] = useState<number | null>(null);
    const [lastReadSurahName, setLastReadSurahName] = useState<string | null>(null);

    const [allSurahs, setAllSurahs] = useState<Surah[]>([]);

    useEffect(() => {
        const loadProgressData = async () => {
            try {
                const surahs = await quranService.getSurahs();
                setAllSurahs(surahs);

                // Derive the Resume Reading metric exclusively from the single dedicated state payload, apart from History array 
                const lastReadEntry = await storageService.getLastRead();

                if (lastReadEntry && surahs.length > 0) {
                    setLastReadSurah(lastReadEntry.surahNumber);
                    setLastReadAyah(lastReadEntry.ayahNumber);
                    setLastReadSurahName(lastReadEntry.surahName);
                }
            } catch (error) {
                console.error('Failed to load progress data:', error);
            }
        };

        loadProgressData();
    }, []);

    const { ayah: dailyAyah, reflection, isLoading: ayahLoading, isReflectionLoading } = useAyahOfDay();
    const dailyGoalState = useDailyGoal();

    // Increment session only once per app load
    const sessionIncremented = useRef(false);
    useEffect(() => {
        if (!sessionIncremented.current && dailyGoalState.goalType) {
            sessionIncremented.current = true;
            // Attempt to increment session. If goalType isn't session, incrementProgress handles the logic based on the passed type
            // Actually, we pass 'sessions' as the type, so it will only increment the sessions_count.
            dailyGoalState.incrementProgress('sessions', 1);
        }
    }, [dailyGoalState.goalType, dailyGoalState.incrementProgress]);

    const handleAskNoorAboutAyah = (a: typeof dailyAyah) => {
        if (!a) return;
        router.push('/noor-ai');
    };

    const handleReadContext = (_a: typeof dailyAyah) => {
        router.push('/quran-reciter');
    };

    const renderCategory = ({ item }: { item: typeof categories[0] }) => (
        <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => router.push(`/quiz/${item.slug}`)}
            activeOpacity={0.8}
        >
            <Text style={styles.categoryIcon}>{item.icon}</Text>
            <Text style={styles.categoryTitle}>{item.title}</Text>
        </TouchableOpacity>
    );

    return (
        <ScreenContainer style={styles.screen} safe={false}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} bounces={false}>

                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Image
                        source={require('../../assets/images/islamic-bg.png')}
                        style={styles.heroImage}
                        contentFit="cover"
                    />

                    {/* Profile / Settings Button */}
                    <TouchableOpacity 
                        style={styles.profileButton} 
                        onPress={() => router.push('/profile')}
                        activeOpacity={0.7}
                    >
                        <User size={24} color="white" />
                    </TouchableOpacity>

                    {/* Dark gradient overlay for text readability */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.35)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,1)']}
                        locations={[0, 0.4, 0.8, 1]}
                        style={styles.heroOverlay}
                    />

                    {/* Hero Text */}
                    <View style={styles.heroTextContainer}>
                        <Text style={styles.heroTitle}>Al-Noor</Text>
                        <Text style={styles.heroSubtitle}>Learn • Memorize • Reflect</Text>
                    </View>
                </View>

                {/* Main Content Area */}
                <View style={styles.mainContent}>

                    {/* Tabs */}
                    <View style={styles.tabBar}>
                        {['Hifz', 'Quiz', 'AI'].map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
                                onPress={() => setActiveTab(tab as any)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Tab Content */}
                    {activeTab === 'Hifz' && (
                        <View style={styles.tabContent}>
                            {/* Today Plan Guided Session Card */}
                            <TouchableOpacity
                                onPress={() => router.push('/today-plan' as any)}
                                activeOpacity={0.9}
                                style={styles.cardContainer}
                            >
                                <LinearGradient
                                    colors={['#0ea5e9', '#0284c7']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[styles.primaryCard, { borderRadius: RADII.card }]}
                                >
                                    <View style={styles.patternOverlay}>
                                        <Text style={styles.patternText}>۞</Text>
                                    </View>
                                    <Text style={[styles.primaryCardTitle, { fontSize: 30 }]}>Start Today Plan</Text>
                                    <Text style={styles.primaryCardSubtitle}>2-5 min guided session & reflection.</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Ayah of the Day */}
                            {ayahLoading ? (
                                <View style={{ padding: 16, backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f5f5f4' }}>
                                    <ActivityIndicator color="#059669" style={{ marginVertical: 8 }} />
                                </View>
                            ) : dailyAyah ? (
                                <AyahOfDayCard
                                    ayah={dailyAyah}
                                    reflection={reflection}
                                    isReflectionLoading={isReflectionLoading}
                                    onAskNoor={handleAskNoorAboutAyah}
                                    onReadContext={handleReadContext}
                                />
                            ) : null}

                            {/* Dynamic Continue Reading Progress */}
                            <ContinueReadingCard
                                surahName={lastReadSurahName || 'Surah Al-Fatihah'}
                                currentAyah={lastReadAyah || 0}
                                totalAyahs={allSurahs.length > 0 && lastReadSurah ? allSurahs[lastReadSurah - 1]?.numberOfAyahs : 7}
                                dailyProgress={dailyGoalState.progress}
                                dailyGoal={dailyGoalState.goal}
                                onPress={() => router.push('/quran-reciter')}
                            />

                            {/* Daily Quran Goal */}
                            <DailyQuranGoalCard state={dailyGoalState} />

                            {/* Salah Tracker Entry */}
                            <TouchableOpacity
                                onPress={() => router.push('/salah-tracker' as any)}
                                activeOpacity={0.9}
                                style={styles.cardContainer}
                            >
                                <LinearGradient
                                    colors={['#6366F1', '#4338CA']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[styles.primaryCard, { borderRadius: RADII.card, paddingVertical: 24 }]}
                                >
                                    <View style={styles.patternOverlay}>
                                        <Text style={[styles.patternText, { color: 'rgba(255,255,255,0.06)' }]}>🕌</Text>
                                    </View>
                                    <Text style={[styles.primaryCardTitle, { fontSize: 24 }]}>Salah Tracker</Text>
                                    <Text style={styles.primaryCardSubtitle}>Track your 5 daily prayers and build streaks</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}

                    {activeTab === 'Quiz' && (
                        <View style={styles.tabContent}>
                            <View style={styles.categorySection}>
                                <Text style={styles.sectionTitle}>Quiz Categories</Text>
                                <View style={styles.gridContainer}>
                                    <FlatList
                                        data={categories}
                                        renderItem={renderCategory}
                                        keyExtractor={(item) => item.id.toString()}
                                        numColumns={2}
                                        scrollEnabled={false}
                                        columnWrapperStyle={styles.columnWrapper}
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {activeTab === 'AI' && (
                        <View style={styles.tabContent}>
                            <TouchableOpacity 
                                style={styles.aiCard}
                                onPress={() => router.push('/noor-ai')}
                                activeOpacity={0.8}
                            >
                                <MessageCircle size={36} color="#0d9488" style={{ marginBottom: 16 }} />
                                <Text style={styles.aiTitle}>Noor AI</Text>
                                <Text style={styles.aiSubtitle}>Your Islamic AI guide</Text>

                                <View style={{ marginTop: 24, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#0d9488', borderRadius: 20 }}>
                                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Explore Now</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.aiCard, { marginTop: 16 }]}
                                onPress={() => router.push('/ask-my-day' as any)}
                                activeOpacity={0.8}
                            >
                                <HelpCircle size={36} color="#16a34a" style={{ marginBottom: 16 }} />
                                <Text style={styles.aiTitle}>Ask About My Day</Text>
                                <Text style={styles.aiSubtitle}>Get Quranic guidance for how you feel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.aiCard, { marginTop: 16 }]}
                                onPress={() => router.push('/weekly-summary' as any)}
                                activeOpacity={0.8}
                            >
                                <HeartPulse size={36} color="#0284c7" style={{ marginBottom: 16 }} />
                                <Text style={styles.aiTitle}>This Week's Heart & Habits</Text>
                                <Text style={styles.aiSubtitle}>See your Quran, Salah, and heart trends</Text>
                            </TouchableOpacity>


                        </View>
                    )}

                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity 
                style={styles.fab} 
                activeOpacity={0.9}
                onPress={() => router.push('/noor-ai')}
            >
                <View style={styles.fabIconContainer}>
                    <MessageCircle size={24} color="white" />
                </View>
                <Text style={styles.fabText}>Ask Noor AI</Text>
            </TouchableOpacity>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    screen: {
        backgroundColor: '#ffffff',
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120, // Enough space for FAB
    },

    // Hero Section
    heroSection: {
        width: '100%',
        height: height * 0.35, // 35% of screen height
        position: 'relative',
        justifyContent: 'center',
    },
    heroImage: {
        ...StyleSheet.absoluteFillObject,
    },
    profileButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 10,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
    },

    // Hero Text
    heroTextContainer: {
        alignItems: 'center',
        zIndex: 5,
    },
    heroTitle: {
        fontSize: 48,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.35)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
    heroSubtitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#e7e5e4',
        marginTop: 8,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        textShadowColor: 'rgba(0, 0, 0, 0.35)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },

    // Main Content
    mainContent: {
        paddingHorizontal: SPACING.outer,
        marginTop: -30, // overlaps the hero section slightly
        zIndex: 10,
    },

    // Tab Bar
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f4', // soft background
        borderRadius: 24, // pill shape
        padding: 4,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 20,
    },
    activeTabItem: {
        backgroundColor: '#059669', // green
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#78716c',
    },
    activeTabText: {
        color: '#ffffff',
    },
    tabContent: {
        flex: 1,
    },

    // Noor Hifz Card
    cardContainer: {
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 6,
        marginBottom: SPACING.outer,
    },
    primaryCard: {
        paddingVertical: 32,
        paddingHorizontal: 24,
        overflow: 'hidden', // Keeps the pattern text inside the border radius
    },
    patternOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    patternText: {
        position: 'absolute',
        top: -60, right: -40,
        fontSize: 180,
        color: 'rgba(255,255,255,0.06)',
        fontWeight: '100',
    },
    primaryCardTitle: {
        fontSize: 36,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 8,
    },
    primaryCardSubtitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#ffffff',
        opacity: 0.9,
    },

    // Hifz Progress Indicator
    // Hifz Progress Indicator Cards
    divider: {
        height: 1,
        backgroundColor: '#EAEAEA',
        marginHorizontal: 16,
        marginBottom: 16,
    },

    // Quiz Category Section
    categorySection: {
        paddingTop: 4,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#292524',
        marginBottom: 16,
    },
    gridContainer: {},
    columnWrapper: {
        justifyContent: 'space-between',
        gap: SPACING.card,
        marginBottom: SPACING.card,
    },
    categoryCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: RADII.card,
        paddingVertical: 18,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f5f5f4',
    },
    categoryIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    categoryTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#292524',
        flex: 1,
    },

    // AI Tab
    aiCard: {
        backgroundColor: '#e6fffa', // light teal
        borderRadius: RADII.card,
        padding: 32,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ccfbf1',
    },
    aiTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f766e',
        marginBottom: 4,
    },
    aiSubtitle: {
        fontSize: 15,
        color: '#0f766e',
        fontWeight: '500',
        opacity: 0.8,
    },
    aiPromptsContainer: {
        gap: 12,
    },
    aiPromptCard: {
        backgroundColor: '#ffffff',
        borderRadius: RADII.card,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f5f5f4',
    },
    aiPromptText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#44403c',
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        alignItems: 'center',
        zIndex: 50,
    },
    fabIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#0d9488', // teal
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0d9488',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: 6,
    },
    fabText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0d9488',
    },
});
