import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Header } from '@/components/ui/Header';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SpiritualCard } from '@/components/ui/SpiritualCard';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { weeklySummaryService, WeeklySummary } from '@/services/weeklySummaryService';
import { BookOpen, HeartPulse, Activity } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function WeeklySummaryScreen() {
    const { activeColors, colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    const router = useRouter();
    const [summary, setSummary] = useState<WeeklySummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        try {
            const data = await weeklySummaryService.getWeeklySummary();
            setSummary(data);
        } catch (e) {
            console.error('Error loading weekly summary:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenContainer style={styles.container}>
            <Header title="This Week's Heart & Habits" showBack />
            
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.sg.primary} />
                </View>
            ) : summary ? (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* Quran Habits Card */}
                    <SpiritualCard featured>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.sg.surfaceContainerHighest }]}>
                                <BookOpen size={24} color={colors.sg.primary} />
                            </View>
                            <Text style={styles.cardTitle}>Qur'an Habits</Text>
                        </View>
                        <Text style={styles.statText}>
                            You reached your Quran goal <Text style={styles.highlight}>{summary.quranGoalDays}</Text> days this week.
                        </Text>
                        <Text style={styles.statText}>
                            Current streak: <Text style={styles.highlight}>{summary.currentQuranStreak}</Text> days.
                        </Text>
                    </SpiritualCard>

                    {/* Salah Habits Card */}
                    <SpiritualCard>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.sg.surfaceContainerHighest }]}>
                                <Activity size={24} color={colors.sg.primary} />
                            </View>
                            <Text style={styles.cardTitle}>Salah Habits</Text>
                        </View>
                        <Text style={styles.statText}>
                            You logged <Text style={styles.highlight}>{summary.salahCount}</Text> prayers in the last 7 days.
                        </Text>
                    </SpiritualCard>

                    {/* Heart & Reflections Card */}
                    <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => router.push('/journal' as any)}
                    >
                        <SpiritualCard>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconContainer, { backgroundColor: colors.sg.surfaceContainerHighest }]}>
                                    <HeartPulse size={24} color={colors.sg.primary} />
                                </View>
                                <Text style={styles.cardTitle}>Heart & Reflections</Text>
                            </View>
                            <Text style={styles.statText}>
                                You saved <Text style={styles.highlight}>{summary.reflectionCount}</Text> reflections this week.
                            </Text>
                            {summary.topTopics.length > 0 && (
                                <View style={styles.topicsList}>
                                    <Text style={styles.topicsListTitle}>Most common topics:</Text>
                                    {summary.topTopics.map((item, index) => (
                                        <Text key={index} style={styles.topicItem}>
                                            • {item.topic} ({item.count})
                                        </Text>
                                    ))}
                                </View>
                            )}
                            <Text style={{ marginTop: 16, ...typography.sg.labelMd, color: colors.sg.secondary, textAlign: 'center' }}>
                                Tap to view all reflections
                            </Text>
                        </SpiritualCard>
                    </TouchableOpacity>

                </ScrollView>
            ) : (
                <View style={styles.center}>
                    <Text style={styles.statText}>Could not load your summary data.</Text>
                </View>
            )}
        </ScreenContainer>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.sg.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: spacing.l, paddingBottom: spacing.xxl * 2, gap: 16 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    iconContainer: { padding: 10, borderRadius: 12 },
    cardTitle: { ...typography.sg.headlineLgMobile, color: colors.sg.primary, fontSize: 22 },
    statText: { ...typography.sg.bodyMd, color: colors.sg.onSurfaceVariant, marginBottom: 8 },
    highlight: { ...typography.sg.bodyLg, fontWeight: '700', color: colors.sg.onSurface },
    topicsList: { marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.sg.surfaceContainerHigh },
    topicsListTitle: { ...typography.sg.labelMd, color: colors.sg.outline, marginBottom: 8 },
    topicItem: { ...typography.sg.bodyMd, color: colors.sg.onSurfaceVariant, marginBottom: 4, paddingLeft: 4 }
});
