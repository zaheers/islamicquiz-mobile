import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { categories } from '@/lib/mockData';
import { quranService, Surah } from '@/services/quranService';
import { HistoryEntry, storageService } from '@/services/storageService';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

    const [lastRead, setLastRead] = useState<HistoryEntry | null>(null);
    const [allSurahs, setAllSurahs] = useState<Surah[]>([]);
    const [totalMemorized, setTotalMemorized] = useState(0);

    useEffect(() => {
        const loadProgressData = async () => {
            try {
                const surahs = await quranService.getSurahs();
                setAllSurahs(surahs);

                const history = await storageService.getHistory();
                const lastReadEntry = history.length > 0 ? history[0] : null;

                if (lastReadEntry && surahs.length > 0) {
                    setLastRead(lastReadEntry);

                    // Calculate macro progress by aggregating past surahs
                    let memorizedCount = 0;
                    for (let i = 0; i < lastReadEntry.surahNumber - 1; i++) {
                        memorizedCount += surahs[i].numberOfAyahs;
                    }
                    memorizedCount += lastReadEntry.ayahNumber;
                    setTotalMemorized(memorizedCount);
                }
            } catch (error) {
                console.error('Failed to load progress data:', error);
            }
        };

        loadProgressData();
    }, []);

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
                            {/* Noor Hifz Card */}
                            <TouchableOpacity
                                onPress={() => router.push('/quran-reciter')}
                                activeOpacity={0.9}
                                style={styles.cardContainer}
                            >
                                <LinearGradient
                                    colors={['#10b981', '#047857']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[styles.primaryCard, { borderRadius: RADII.card }]}
                                >
                                    <View style={styles.patternOverlay}>
                                        <Text style={styles.patternText}>۞</Text>
                                    </View>
                                    <Text style={styles.primaryCardTitle}>Noor Hifz</Text>
                                    <Text style={styles.primaryCardSubtitle}>Read and practice the Quran step by step.</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Dynamic Continue Reading Progress */}
                            <TouchableOpacity
                                style={styles.progressCard}
                                onPress={() => router.push('/quran-reciter')}
                                activeOpacity={0.9}
                            >
                                <Text style={styles.progressSectionTitle}>Continue Reading</Text>
                                <Text style={styles.surahNameTitle}>{lastRead?.surahName || 'Surah Al-Fatihah'}</Text>
                                <Text style={styles.ayahProgressText}>
                                    Ayah {lastRead?.ayahNumber || 0} of {allSurahs.length > 0 ? allSurahs[Math.max(0, (lastRead?.surahNumber || 1) - 1)]?.numberOfAyahs : 7}
                                </Text>
                                <View style={styles.progressBarBg}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            { width: `${lastRead && allSurahs.length > 0 ? Math.min(100, (lastRead.ayahNumber / (allSurahs[lastRead.surahNumber - 1]?.numberOfAyahs || 1)) * 100) : 0}%` }
                                        ]}
                                    />
                                </View>
                            </TouchableOpacity>

                            {/* Quran Progress Card */}
                            <View style={styles.progressCard}>
                                <Text style={styles.progressSectionTitle}>Quran Progress</Text>
                                <Text style={styles.ayahProgressTextMacro}>
                                    {totalMemorized} / 6236
                                </Text>
                                <View style={styles.progressBarBg}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            { width: `${Math.min(100, (totalMemorized / 6236) * 100)}%` }
                                        ]}
                                    />
                                </View>
                            </View>
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
                            <View style={styles.aiCard}>
                                <MessageCircle size={36} color="#0d9488" style={{ marginBottom: 16 }} />
                                <Text style={styles.aiTitle}>Noor AI</Text>
                                <Text style={styles.aiSubtitle}>Your Islamic AI guide</Text>

                                <View style={{ marginTop: 24, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#ccfbf1', borderRadius: 20 }}>
                                    <Text style={{ color: '#0f766e', fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Coming Soon</Text>
                                </View>
                            </View>
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab} activeOpacity={0.9}>
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
    progressCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f5f5f4',
    },
    progressSectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#a8a29e',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    surahNameTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#292524',
        marginBottom: 4,
    },
    ayahProgressText: {
        fontSize: 14,
        color: '#57534e',
        fontWeight: '500',
        marginBottom: 12,
    },
    ayahProgressTextMacro: {
        fontSize: 18,
        fontWeight: '800',
        color: '#292524',
        marginBottom: 12,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#e5e7eb',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#059669',
        borderRadius: 3,
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
