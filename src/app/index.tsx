import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SpiritualCard } from '@/components/ui/SpiritualCard';
import { categories } from '@/lib/mockData';
import { quranService, Surah } from '@/services/quranService';
import { storageService } from '@/services/storageService';
import { AyahOfDayCard } from '@/features/ayahOfDay/AyahOfDayCard';
import { useAyahOfDay } from '@/features/ayahOfDay/useAyahOfDay';
import { useDailyGoal } from '@/features/dailyGoal/useDailyGoal';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MessageCircle, User, HeartPulse, HelpCircle, BookOpen, Clock, Target, Headphones, Share2, Sparkles, Smile, Frown } from 'lucide-react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { AIBottomSheet } from '@/components/ui/AIBottomSheet';
import { SalahBottomSheet } from '@/components/ui/SalahBottomSheet';
import { SalahFluidWidget } from '@/components/ui/SalahFluidWidget';
import { adhanNotificationService } from '@/services/adhanNotificationService';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ActivityIndicator, Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export default function HomeScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'Home' | 'Quiz' | 'AI'>('Home');

    const now = new Date();
    const hijriDate = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    }).format(now).toUpperCase();
    const englishDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(now);

    const bottomSheetRef = useRef<BottomSheet>(null);
    const salahSheetRef = useRef<BottomSheet>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [aiTopic, setAiTopic] = useState<string>('');
    const [aiPrompt, setAiPrompt] = useState<string>('');

    const openAiSheet = (topic: string, prompt: string) => {
        setAiTopic(topic);
        setAiPrompt(prompt);
        bottomSheetRef.current?.expand();
    };

    const [lastReadSurah, setLastReadSurah] = useState<number | null>(null);
    const [lastReadAyah, setLastReadAyah] = useState<number | null>(null);
    const [lastReadSurahName, setLastReadSurahName] = useState<string | null>(null);
    const [allSurahs, setAllSurahs] = useState<Surah[]>([]);

    useEffect(() => {
        const loadProgressData = async () => {
            try {
                const surahs = await quranService.getSurahs();
                setAllSurahs(surahs);
                const lastReadEntry = await storageService.getLastRead();
                if (lastReadEntry && surahs.length > 0) {
                    setLastReadSurah(lastReadEntry.surahNumber);
                    setLastReadAyah(lastReadEntry.ayahNumber);
                    setLastReadSurahName(lastReadEntry.surahName);
                }
            } catch (error) {}
        };
        loadProgressData();

        // Silently queue Adhan push notifications in the background for the next 7 days
        adhanNotificationService.queueWeeklyAdhans().catch(e => console.warn('[AdhanQueue] Error:', e));
    }, []);

    const { ayah: dailyAyah, reflection, isLoading: ayahLoading, isReflectionLoading } = useAyahOfDay();
    const dailyGoalState = useDailyGoal();

    const sessionIncremented = useRef(false);
    useEffect(() => {
        if (!sessionIncremented.current && dailyGoalState.goalType) {
            sessionIncremented.current = true;
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
            {/* Hero Section */}
            <View style={styles.heroSection}>
                <Image
                    source={require('../../assets/images/islamic-bg.png')}
                    style={styles.heroImage}
                    contentFit="cover"
                />
                {/* Dark gradient overlay for text readability */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.35)', 'rgba(255,255,255,0.7)', colors.sg.background]}
                    locations={[0, 0.4, 0.8, 1]}
                    style={styles.heroOverlay}
                />

                {/* Profile / Settings Button */}
                <TouchableOpacity 
                    style={styles.profileButton} 
                    onPress={() => router.push('/profile')}
                    activeOpacity={0.7}
                >
                    <User size={24} color="white" />
                </TouchableOpacity>

                {/* Hero Text */}
                <View style={styles.heroTextContainer}>
                    <Text style={styles.heroTitle}>Al-Noor</Text>
                    <View style={styles.dateCol}>
                        <Text style={styles.englishDate}>{englishDate}</Text>
                        <Text style={styles.hijriDate}>{hijriDate}</Text>
                    </View>
                    <Text style={styles.heroSubtitle}>Learn • Memorize • Reflect</Text>
                </View>
            </View>

            {/* Main Tabs */}
            <View style={styles.tabBar}>
                {['Home', 'Quiz', 'AI'].map(tab => (
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

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} bounces={false}>
                {activeTab === 'Home' && (
                    <View style={styles.tabContent}>
                        
                        {/* Ayah of the Day */}
                        {ayahLoading ? (
                            <SpiritualCard style={{ marginBottom: 48 }}>
                                <ActivityIndicator color={colors.sg.primary} />
                            </SpiritualCard>
                        ) : dailyAyah ? (
                            <View style={{ marginBottom: 48 }}>
                                <AyahOfDayCard
                                    ayah={dailyAyah}
                                    reflection={reflection}
                                    isReflectionLoading={isReflectionLoading}
                                    onAskNoor={handleAskNoorAboutAyah}
                                    onReadContext={handleReadContext}
                                />
                            </View>
                        ) : null}



                        {/* Continue Reading Card */}
                        <TouchableOpacity activeOpacity={0.9} style={{ marginBottom: 48 }} onPress={() => router.push('/quran-reciter')}>
                            <SpiritualCard>
                                <Text style={styles.progressSectionTitle}>Continue Reading</Text>
                            <Text style={styles.surahNameTitle}>{lastReadSurahName || 'Surah Al-Fatihah'}</Text>
                            <Text style={styles.ayahProgressText}>
                                Ayah {lastReadAyah || 0} of {allSurahs.length > 0 && lastReadSurah ? allSurahs[lastReadSurah - 1]?.numberOfAyahs : 7}
                            </Text>
                            <View style={styles.progressBarBg}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${lastReadAyah && allSurahs.length > 0 && lastReadSurah ? Math.min(100, (lastReadAyah / (allSurahs[lastReadSurah - 1]?.numberOfAyahs || 1)) * 100) : 0}%` }
                                    ]}
                                />
                            </View>
                            
                            <View style={styles.divider} />
                            
                            <Text style={styles.progressSectionTitle}>Before Reciting the Quran</Text>
                            <Text style={styles.arabicReflection}>اللهم افتح لي أبواب رحمتك</Text>
                            <Text style={styles.translationReflection}>O Allah, open for me the doors of Your mercy.</Text>
                            </SpiritualCard>
                        </TouchableOpacity>

                        {/* Daily Progress Grid */}
                        <Text style={[styles.sectionHeading, { marginBottom: 16, marginTop: 16 }]}>Daily Progress</Text>
                        <View style={styles.progressGrid}>
                            <TouchableOpacity style={styles.progressCard} onPress={() => router.push('/today-plan' as any)}>
                                <Target size={20} color={colors.sg.primary} />
                                <Text style={styles.progressCardTitle}>Daily Goal</Text>
                                <Text style={styles.progressCardValue}>{dailyGoalState.progress}/{dailyGoalState.goal}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.progressCard} onPress={() => salahSheetRef.current?.expand()}>
                                <HeartPulse size={20} color={colors.sg.primary} />
                                <Text style={styles.progressCardTitle}>Salah</Text>
                                <Text style={styles.progressCardValue}>Track</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.progressCard} onPress={() => router.push('/quran-reciter')}>
                                <BookOpen size={20} color={colors.sg.primary} />
                                <Text style={styles.progressCardTitle}>Reading</Text>
                                <Text style={styles.progressCardValue} numberOfLines={1}>{lastReadSurahName || 'Al-Fatihah'}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Salah Fluid Widget */}
                        <SalahFluidWidget onPress={() => salahSheetRef.current?.expand()} />

                        {/* Mindful Reflection */}
                        <Text style={[styles.sectionHeading, { marginBottom: 16, marginTop: 48 }]}>Mindful Moment</Text>
                        <TouchableOpacity onPress={() => router.push('/ask-my-day' as any)} activeOpacity={0.9}>
                            <SpiritualCard style={styles.reflectionCard}>
                                <HelpCircle size={32} color={colors.sg.primary} style={{ marginBottom: 16 }} />
                                <Text style={styles.reflectionTitle}>Ask About My Day</Text>
                                <Text style={styles.reflectionText}>Take a moment to reflect and receive Quranic guidance tailored to how you feel right now.</Text>
                            </SpiritualCard>
                        </TouchableOpacity>
                        
                    </View>
                )}

                {activeTab === 'Quiz' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionHeading}>Quiz Categories</Text>
                        <View style={styles.quizGrid}>
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
                )}

                {activeTab === 'AI' && (
                    <View style={styles.tabContent}>
                        {/* Noor AI Card */}
                        <View style={[styles.aiCard, styles.softLift, styles.goldAccentTop]}>
                            <View style={styles.aiCardHeader}>
                                <View>
                                    <Text style={styles.aiCardSubLabel}>PERSONAL COMPANION</Text>
                                    <Text style={styles.aiCardTitle}>Al-Noor</Text>
                                </View>
                                <Sparkles size={36} color={colors.sg.secondary} />
                            </View>
                            <Text style={styles.aiCardDesc}>
                                Ask about the Quran and Islam.
                            </Text>
                            <View style={styles.btnCol}>
                                <TouchableOpacity style={styles.fullBtn} onPress={() => openAiSheet('What does Quran say about patience?', 'Quranic Wisdom')}>
                                    <Text style={styles.fullBtnText}>What does Quran say about patience?</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.fullBtn} onPress={() => openAiSheet('Explain charity in Islam', 'Islamic Knowledge')}>
                                    <Text style={styles.fullBtnText}>Explain charity in Islam</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.fullBtn} onPress={() => openAiSheet('Tell me about Prophet Musa', 'Prophets')}>
                                    <Text style={styles.fullBtnText}>Tell me about Prophet Musa</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Ask About My Day Card */}
                        <View style={[styles.aiCard, styles.softLift, styles.goldAccentTop]}>
                            <View style={styles.aiCardHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <HelpCircle size={28} color={colors.sg.secondary} style={{ marginRight: 8 }} />
                                    <Text style={styles.aiCardTitle}>Ask About My Day</Text>
                                </View>
                            </View>
                            <Text style={styles.aiCardDesc}>
                                Reflection is the beginning of growth. Share your highlights and challenges.
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} style={{ marginHorizontal: -24, paddingHorizontal: 24 }}>
                                <TouchableOpacity style={styles.chip} onPress={() => openAiSheet('Grateful', '☀️ Grateful')}><Text style={styles.chipText}>☀️ Grateful</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.chip} onPress={() => openAiSheet('Restless', '🍃 Restless')}><Text style={styles.chipText}>🍃 Restless</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.chip} onPress={() => openAiSheet('Anxious', '🌧️ Anxious')}><Text style={styles.chipText}>🌧️ Anxious</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.chip} onPress={() => openAiSheet('Peaceful', '🕊️ Peaceful')}><Text style={styles.chipText}>🕊️ Peaceful</Text></TouchableOpacity>
                            </ScrollView>
                        </View>

                        {/* Heart & Habits Card */}
                        <TouchableOpacity style={[styles.aiCard, styles.softLift, styles.goldAccentTop]} onPress={() => router.push('/weekly-summary' as any)} activeOpacity={0.9}>
                            <View>
                                <Text style={styles.aiCardSubLabel}>INNER PEACE STATUS</Text>
                                <Text style={styles.aiCardTitle}>Heart & Habits</Text>
                            </View>
                            <Text style={[styles.aiCardDesc, { marginTop: 16 }]}>
                                Your spiritual baseline is currently stable. You have maintained 5 days of consistent prayer and reflection.
                            </Text>
                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statNum}>12</Text>
                                    <Text style={styles.statLabel}>DUAS READ</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statBox}>
                                    <Text style={styles.statNum}>05</Text>
                                    <Text style={styles.statLabel}>STREAK</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statBox}>
                                    <Text style={styles.statNum}>02h</Text>
                                    <Text style={styles.statLabel}>FOCUS</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
            <AIBottomSheet 
                bottomSheetRef={bottomSheetRef} 
                topic={aiTopic} 
                initialPrompt={aiPrompt} 
            />
            <SalahBottomSheet 
                bottomSheetRef={salahSheetRef}
                onProgressUpdate={() => setRefreshTrigger(prev => prev + 1)}
            />
        </ScreenContainer>
    );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    screen: {
        backgroundColor: colors.sg.background,
        flex: 1,
    },
    // Hero Section
    heroSection: {
        width: '100%',
        height: height * 0.35,
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
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 10,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    heroTextContainer: {
        alignItems: 'center',
    },
    heroTitle: {
        ...typography.sg.displayLg,
        color: '#ffffff',
        textShadowColor: 'rgba(0, 0, 0, 0.35)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
    heroSubtitle: {
        ...typography.sg.labelMd,
        color: '#e7e5e4',
        marginTop: 8,
        letterSpacing: 1.2,
        textShadowColor: 'rgba(0, 0, 0, 0.35)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: 24,
        backgroundColor: colors.sg.surfaceContainerHighest,
        borderRadius: 24,
        padding: 4,
        marginBottom: 32,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 20,
    },
    activeTabItem: {
        backgroundColor: colors.sg.primary,
    },
    tabText: {
        ...typography.sg.labelMd,
        color: colors.sg.onSurfaceVariant,
    },
    activeTabText: {
        color: colors.sg.onPrimary,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    tabContent: {
        flex: 1,
    },
    sectionHeading: {
        ...typography.sg.headlineLgMobile,
        color: colors.sg.onSurface,
        marginBottom: 24,
    },
    progressGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 48,
        gap: 8,
    },
    progressCard: {
        flex: 1,
        backgroundColor: colors.sg.surfaceContainerLowest,
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 1,
    },
    progressCardTitle: {
        ...typography.sg.labelMd,
        fontSize: 11,
        color: colors.sg.onSurfaceVariant,
        marginTop: 8,
        marginBottom: 2,
    },
    progressCardValue: {
        ...typography.sg.bodyMd,
        fontWeight: '700',
        color: colors.sg.onSurface,
        textAlign: 'center',
        fontSize: 13,
    },
    actionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        backgroundColor: colors.sg.surfaceContainerLowest,
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 15,
        elevation: 2,
    },
    actionCard: {
        alignItems: 'center',
        flex: 1,
    },
    actionText: {
        ...typography.sg.labelMd,
        fontSize: 12,
        color: colors.sg.primary,
        marginTop: 8,
    },
    progressSectionTitle: {
        ...typography.sg.labelMd,
        color: colors.sg.outline,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    surahNameTitle: {
        ...typography.sg.headlineLgMobile,
        color: colors.sg.onSurface,
        marginBottom: 4,
    },
    ayahProgressText: {
        ...typography.sg.bodyMd,
        color: colors.sg.onSurfaceVariant,
        marginBottom: 16,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: colors.sg.surfaceContainerHigh,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.sg.primary,
        borderRadius: 3,
    },
    arabicReflection: {
        fontFamily: 'KFGQPCHafs',
        fontSize: 24,
        color: colors.sg.primary, // deeper teal
        textAlign: 'right',
        marginBottom: 8,
        lineHeight: 38,
    },
    translationReflection: {
        ...typography.sg.spiritualText,
        fontSize: 15,
        color: colors.sg.onSurfaceVariant,
        fontStyle: 'italic',
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: colors.sg.surfaceContainerHigh,
        marginVertical: 16,
    },
    reflectionCard: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    reflectionTitle: {
        ...typography.sg.spiritualText,
        color: colors.sg.onSurface,
        marginBottom: 12,
    },
    reflectionText: {
        ...typography.sg.bodyMd,
        color: colors.sg.onSurfaceVariant,
        textAlign: 'center',
        paddingHorizontal: 16,
    },
    quizGrid: {
        marginTop: 8,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 16,
    },
    categoryCard: {
        flex: 1,
        backgroundColor: colors.sg.surfaceContainerLowest,
        borderRadius: 24,
        paddingVertical: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
        elevation: 2,
    },
    categoryIcon: {
        fontSize: 32,
        marginBottom: 12,
    },
    categoryTitle: {
        ...typography.sg.labelMd,
        color: colors.sg.onSurface,
        textAlign: 'center',
    },
    aiCard: {
        backgroundColor: colors.sg.surfaceContainerLowest,
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
    },
    softLift: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.04, 
        shadowRadius: 20, 
        elevation: 3 
    },
    goldAccentTop: { 
        borderTopWidth: 2, 
        borderTopColor: colors.sg.secondary 
    },
    dateCol: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        marginBottom: 8,
    },
    englishDate: {
        ...typography.sg.labelMd,
        color: 'rgba(255, 255, 255, 0.95)',
        fontWeight: '500',
        marginBottom: 2,
    },
    hijriDate: {
        ...typography.sg.labelMd,
        color: 'rgba(255, 255, 255, 0.85)',
        letterSpacing: 1.5,
    },
    aiCardHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: 16 
    },
    aiCardSubLabel: { 
        ...typography.sg.labelMd, 
        color: colors.sg.primary, 
        textTransform: 'uppercase', 
        letterSpacing: 1.5, 
        marginBottom: 4 
    },
    aiCardTitle: { 
        ...typography.sg.headlineLg, 
        color: colors.sg.primary, 
        fontSize: 28 
    },
    aiCardDesc: { 
        ...typography.sg.bodyLg, 
        color: colors.sg.onSurfaceVariant, 
        marginBottom: 24, 
        lineHeight: 28 
    },
    chipRow: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: 12 
    },
    chip: { 
        backgroundColor: 'rgba(208, 219, 237, 0.4)', 
        paddingHorizontal: 20, 
        paddingVertical: 10, 
        borderRadius: 24 
    },
    chipText: { 
        ...typography.sg.labelMd, 
        color: colors.sg.primary 
    },
    btnCol: { 
        flexDirection: 'column', 
        gap: 12 
    },
    fullBtn: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: 'rgba(208, 219, 237, 0.4)', 
        paddingHorizontal: 24, 
        paddingVertical: 16, 
        borderRadius: 16 
    },
    fullBtnText: { 
        ...typography.sg.labelMd, 
        color: colors.sg.primary, 
        fontSize: 16 
    },
    statsRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginTop: 16, 
        backgroundColor: 'rgba(208, 219, 237, 0.2)', 
        padding: 16, 
        borderRadius: 16 
    },
    statBox: { 
        flex: 1, 
        alignItems: 'center' 
    },
    statNum: { 
        ...typography.sg.headlineLg, 
        color: colors.sg.primary, 
        fontSize: 24, 
        fontWeight: 'bold' 
    },
    statLabel: { 
        ...typography.sg.labelMd, 
        color: colors.sg.onSurfaceVariant, 
        fontSize: 10, 
        textTransform: 'uppercase', 
        marginTop: 4 
    },
    statDivider: { 
        width: 1, 
        height: 32, 
        backgroundColor: colors.sg.outlineVariant 
    }
});
