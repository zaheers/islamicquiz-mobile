import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Header } from '@/components/ui/Header';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { reflectionRepository, Reflection } from '@/services/reflectionRepository';
import { HeartPulse } from 'lucide-react-native';

export default function ReflectionsListScreen() {
    const [reflections, setReflections] = useState<Reflection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReflections();
    }, []);

    const loadReflections = async () => {
        try {
            const days = [];
            const now = new Date();
            for (let i = 0; i < 7; i++) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                days.push(`${yyyy}-${mm}-${dd}`);
            }

            const data = await reflectionRepository.getReflectionsForDays(days);
            setReflections(data);
        } catch (e) {
            console.error('Error loading reflections:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenContainer style={styles.container}>
            <Header title="My Reflections" showBack />
            
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {reflections.length === 0 ? (
                        <View style={styles.emptyState}>
                            <HeartPulse size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
                            <Text style={styles.emptyTitle}>No reflections yet</Text>
                            <Text style={styles.emptySubtitle}>When you save a reflection from Ask About My Day, it will appear here.</Text>
                        </View>
                    ) : (
                        reflections.map((ref, index) => (
                            <View key={ref.id || index} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.topicBadge}>{ref.topic}</Text>
                                    <Text style={styles.dateText}>{ref.local_day}</Text>
                                </View>
                                <Text style={styles.noteText}>{ref.note}</Text>
                                <View style={styles.divider} />
                                <Text style={styles.versesLabel}>Verses Referenced:</Text>
                                {JSON.parse(ref.verses_json).map((v: any, i: number) => (
                                    <Text key={i} style={styles.verseText}>• {v.reference}</Text>
                                ))}
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
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
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        padding: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    topicBadge: {
        fontSize: 13,
        fontWeight: '700',
        color: '#15803d',
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    dateText: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '500',
    },
    noteText: {
        fontSize: 16,
        color: '#1e293b',
        lineHeight: 24,
        fontStyle: 'italic',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 16,
    },
    versesLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
    },
    verseText: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 4,
    }
});
