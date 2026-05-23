import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Header } from '@/components/ui/Header';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { weeklySummaryService, WeeklySummary } from '@/services/weeklySummaryService';
import { BookOpen, HeartPulse, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function WeeklySummaryScreen() {
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
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : summary ? (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* Quran Habits Card */}
                    <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: '#e0f2fe' }]}>
                                <BookOpen size={24} color="#0284c7" />
                            </View>
                            <Text style={styles.cardTitle}>Qur'an Habits</Text>
                        </View>
                        <Text style={styles.statText}>
                            You reached your Quran goal <Text style={styles.highlight}>{summary.quranGoalDays}</Text> days this week.
                        </Text>
                        <Text style={styles.statText}>
                            Current streak: <Text style={styles.highlight}>{summary.currentQuranStreak}</Text> days.
                        </Text>
                    </LinearGradient>

                    {/* Salah Habits Card */}
                    <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: '#e0e7ff' }]}>
                                <Activity size={24} color="#4338ca" />
                            </View>
                            <Text style={styles.cardTitle}>Salah Habits</Text>
                        </View>
                        <Text style={styles.statText}>
                            You logged <Text style={styles.highlight}>{summary.salahCount}</Text> prayers in the last 7 days.
                        </Text>
                    </LinearGradient>

                    {/* Heart & Reflections Card */}
                    <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => router.push('/reflections-list' as any)}
                    >
                        <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
                                    <HeartPulse size={24} color="#15803d" />
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
                            <Text style={{ marginTop: 16, fontSize: 13, color: '#15803d', fontWeight: '600', textAlign: 'center' }}>
                                Tap to view all reflections
                            </Text>
                        </LinearGradient>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        padding: spacing.l,
        paddingBottom: spacing.xxl * 2,
        gap: 16,
    },
    card: {
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    iconContainer: {
        padding: 10,
        borderRadius: 12,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
    },
    statText: {
        fontSize: 16,
        color: '#475569',
        lineHeight: 24,
        marginBottom: 8,
    },
    highlight: {
        fontWeight: '800',
        color: '#0f172a',
    },
    topicsList: {
        marginTop: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    topicsListTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 8,
    },
    topicItem: {
        fontSize: 15,
        color: '#475569',
        marginBottom: 4,
        paddingLeft: 4,
    }
});
