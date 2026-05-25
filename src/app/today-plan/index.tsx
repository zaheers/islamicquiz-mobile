import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/ui/Header';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';
import { quranService, Ayah, Surah } from '@/services/quranService';
import { storageService } from '@/services/storageService';
import { CheckCircle } from 'lucide-react-native';
import RenderHTML from 'react-native-render-html';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const tajweedClassesStyles = {
    'tj-ham_wasl': { color: '#AAAAAA' },
    'tj-ghunnah': { color: '#FF7E00' },
    'tj-idgham_ghunnah': { color: '#169777' },
    'tj-ikhfa': { color: '#9400A1' },
    'tj-qalaqah': { color: '#DD0000' },
    'tj-madd_2': { color: '#537FFF' },
    'tj-madd_246': { color: '#2144C1' },
    'tj-madd_45': { color: '#4050FF' },
    'tj-madd_6': { color: '#000EBC' },
};

const tajweedTagsStyles = {
    span: { 
        fontSize: 28, 
        lineHeight: 60, 
        textAlign: 'center', 
        fontFamily: 'KFGQPCHafs',
        color: '#1c1917'
    }
};

export default function GuidedSessionScreen() {
    const { activeColors, colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [surah, setSurah] = useState<Surah | null>(null);
    const [sessionAyahs, setSessionAyahs] = useState<Ayah[]>([]);
    
    useEffect(() => {
        const loadSession = async () => {
            try {
                // 1. Get memorizing list
                const memorizingList = await storageService.getMemorizing();
                const allSurahs = await quranService.getSurahs();

                const now = Date.now();
                const dueReviews = memorizingList.filter(m => m.nextReviewDate <= now);

                if (dueReviews.length > 0) {
                    // Pull all memorizing ayahs for review
                    const targetAyahs = dueReviews.map(m => ({ surahNumber: m.surahNumber, ayahNumber: m.ayahNumber }));
                    const currentSurah = allSurahs.find(s => s.number === targetAyahs[0].surahNumber) || allSurahs[0];
                    setSurah(currentSurah);

                    const fetchedAyahs = await Promise.all(
                        targetAyahs.map(ta => quranService.getAyahWithTranslationAndAudio(ta.surahNumber, ta.ayahNumber))
                    );
                    setSessionAyahs(fetchedAyahs);
                } else {
                    // Fallback to last read position
                    const lastRead = await storageService.getLastRead();
                    let targetSurahNum = lastRead ? lastRead.surahNumber : 1;
                    let targetAyahNum = lastRead ? lastRead.ayahNumber : 1;

                    const currentSurah = allSurahs.find(s => s.number === targetSurahNum) || allSurahs[0];
                    setSurah(currentSurah);

                    const allAyahs = await quranService.getSurahAyahs(targetSurahNum);
                    
                    const startIndex = allAyahs.findIndex(a => a.number === targetAyahNum);
                    const safeStartIndex = startIndex >= 0 ? startIndex : 0;
                    
                    const chunk = allAyahs.slice(safeStartIndex, safeStartIndex + 5);
                    setSessionAyahs(chunk);
                }

            } catch (error) {
                console.error("Failed to load guided session:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSession();
    }, []);

    const handleComplete = () => {
        // Navigate to summary screen. The summary screen will handle the progress increment.
        if (surah && sessionAyahs.length > 0) {
            const lastAyah = sessionAyahs[sessionAyahs.length - 1];
            router.push({
                pathname: '/today-plan/summary' as any,
                params: {
                    surahNumber: surah.number,
                    surahName: surah.englishName,
                    lastReadAyah: lastAyah.number,
                    ayahsReadCount: sessionAyahs.length,
                    isReview: 'true' // Flag so summary knows to advance stages
                }
            });
        }
    };

    if (isLoading) {
        return (
            <ScreenContainer style={styles.container}>
                <Header title="Today Plan" showBack />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Preparing your session...</Text>
                </View>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer style={styles.container}>
            <Header title="Guided Session" showBack />
            
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <View style={styles.sessionIntro}>
                    <Text style={styles.introTitle}>Bismillah</Text>
                    <Text style={styles.introSubtitle}>Take 2-5 minutes to read and reflect.</Text>
                    <View style={styles.surahBadge}>
                        <Text style={styles.surahBadgeText}>{surah?.englishName}</Text>
                    </View>
                </View>

                {sessionAyahs.map((ayah, index) => (
                    <View key={ayah.number} style={styles.ayahContainer}>
                        <View style={styles.ayahHeader}>
                            <View style={styles.ayahBadge}>
                                <Text style={styles.ayahBadgeText}>{ayah.number === 0 ? 'Start' : ayah.number}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.arabicBox}>
                            <RenderHTML 
                                contentWidth={width - 64} 
                                source={{ html: `<span class="tj">${ayah.tajweedText || ayah.text}</span>` }} 
                                tagsStyles={tajweedTagsStyles as any} 
                                classesStyles={tajweedClassesStyles as any} 
                            />
                        </View>
                        
                        <Text style={styles.translationText}>{ayah.translation}</Text>
                    </View>
                ))}

                <LinearGradient
                    colors={['#f0fdf4', '#dcfce7']}
                    style={styles.reflectionCard}
                >
                    <Text style={styles.reflectionTitle}>Daily Insight</Text>
                    <Text style={styles.reflectionText}>
                        "Take a moment to reflect on these verses. How can you apply this guidance in your daily interactions today? Remember that consistency in small deeds is highly beloved to Allah."
                    </Text>
                </LinearGradient>

                <TouchableOpacity 
                    style={styles.completeBtn} 
                    onPress={handleComplete}
                    activeOpacity={0.8}
                >
                    <CheckCircle color="white" size={20} />
                    <Text style={styles.completeBtnText}>Complete Session</Text>
                </TouchableOpacity>
                
            </ScrollView>
        </ScreenContainer>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: colors.textSecondary,
        fontSize: 16,
        fontWeight: '500',
    },
    scrollContent: {
        padding: spacing.l,
        paddingBottom: spacing.xxl * 2,
    },
    sessionIntro: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    introTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.primary,
        marginBottom: 8,
    },
    introSubtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        marginBottom: 16,
    },
    surahBadge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    surahBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
    },
    ayahContainer: {
        marginBottom: spacing.xl,
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    ayahHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 16,
    },
    ayahBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ayahBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },
    arabicBox: {
        alignItems: 'center',
        marginBottom: 16,
    },
    translationText: {
        fontSize: 16,
        lineHeight: 26,
        color: '#475569',
        textAlign: 'center',
    },
    reflectionCard: {
        padding: 24,
        borderRadius: 20,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    reflectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#166534',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    reflectionText: {
        fontSize: 15,
        lineHeight: 24,
        color: '#15803d',
        fontStyle: 'italic',
    },
    completeBtn: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
        gap: 12,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    completeBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
});
