import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '@/components/ui/Header';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';
import { CheckCircle, Home, Flame } from 'lucide-react-native';
import { storageService } from '@/services/storageService';
import { goalRepository } from '@/services/goalRepository';
import { auth } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const getUserId = () => auth?.currentUser?.uid || 'anonymous_user';

export default function SessionSummaryScreen() {
    const { activeColors, colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    const router = useRouter();
    const params = useLocalSearchParams();
    const { surahNumber, surahName, lastReadAyah, ayahsReadCount, isReview } = params;
    
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        const processCompletion = async () => {
            try {
                // 1. Save new reading position
                if (surahNumber && lastReadAyah && surahName) {
                    await storageService.saveLastRead({
                        surahNumber: Number(surahNumber),
                        ayahNumber: Number(lastReadAyah),
                        surahName: String(surahName),
                        timestamp: Date.now()
                    });
                }

                // 2. Increment Daily Goal based on user's selected type
                const userId = getUserId();
                const settings = await goalRepository.getSettings(userId);
                
                let amount = 1;
                if (settings.goal_type === 'minutes') amount = 5; // Fixed 5 minutes for session
                else if (settings.goal_type === 'ayahs') amount = Number(ayahsReadCount) || 5;
                else if (settings.goal_type === 'sessions') amount = 1;

                await goalRepository.incrementProgress(userId, settings.goal_type, amount, settings.target_value);

                // 3. Handle Memorization Spaced Repetition Updates
                if (isReview === 'true') {
                    const memorizingList = await storageService.getMemorizing();
                    const now = Date.now();
                    const dueReviews = memorizingList.filter(m => m.nextReviewDate <= now);
                    
                    for (const review of dueReviews) {
                        await storageService.advanceMemorizationStage(review.surahNumber, review.ayahNumber);
                    }
                }

                // 4. Fetch the latest streak to display
                const streakData = await goalRepository.getStreak(userId);
                setStreak(streakData.current_streak);

            } catch (error) {
                console.error("Failed to process session completion:", error);
            }
        };

        processCompletion();
    }, [surahNumber, surahName, lastReadAyah, ayahsReadCount, isReview]);

    return (
        <ScreenContainer style={styles.container} safe={false}>
            <Header title="Session Summary" showBack={false} />
            
            <View style={styles.content}>
                
                <View style={styles.iconContainer}>
                    <CheckCircle size={80} color="#059669" strokeWidth={1.5} />
                </View>

                <Text style={styles.title}>Alhamdulillah!</Text>
                <Text style={styles.subtitle}>You have successfully completed your Today Plan guided session.</Text>

                <LinearGradient
                    colors={['#fdf4ff', '#f3e8ff']}
                    style={styles.statsCard}
                >
                    <View style={styles.statRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{ayahsReadCount || 5}</Text>
                            <Text style={styles.statLabel}>Ayahs Read</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>5</Text>
                            <Text style={styles.statLabel}>Mins Spent</Text>
                        </View>
                    </View>
                </LinearGradient>

                {streak > 0 && (
                    <View style={styles.streakBadge}>
                        <Flame color="#d97706" size={24} />
                        <Text style={styles.streakText}>{streak} Day Streak!</Text>
                    </View>
                )}

                <View style={styles.spacer} />

                <TouchableOpacity 
                    style={styles.homeBtn} 
                    onPress={() => router.replace('/')}
                    activeOpacity={0.8}
                >
                    <Home color="white" size={20} />
                    <Text style={styles.homeBtnText}>Return to Home</Text>
                </TouchableOpacity>

            </View>
        </ScreenContainer>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    content: {
        flex: 1,
        padding: spacing.xl,
        alignItems: 'center',
        paddingTop: 60,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#dcfce7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    statsCard: {
        width: '100%',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e9d5ff',
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 36,
        fontWeight: '800',
        color: '#9333ea',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#7e22ce',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statDivider: {
        width: 1,
        height: 50,
        backgroundColor: '#d8b4fe',
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef3c7',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 30,
        gap: 8,
    },
    streakText: {
        color: '#d97706',
        fontSize: 16,
        fontWeight: '700',
    },
    spacer: {
        flex: 1,
    },
    homeBtn: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
        gap: 12,
        width: '100%',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
        marginBottom: 20,
    },
    homeBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
});
