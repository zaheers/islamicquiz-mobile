import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Header } from '@/components/ui/Header';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SpiritualCard } from '@/components/ui/SpiritualCard';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
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
                    <ActivityIndicator size="large" color={colors.sg.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {reflections.length === 0 ? (
                        <View style={styles.emptyState}>
                            <HeartPulse size={48} color={colors.sg.outlineVariant} style={{ marginBottom: 16 }} />
                            <Text style={styles.emptyTitle}>No reflections yet</Text>
                            <Text style={styles.emptySubtitle}>When you save a reflection from Ask About My Day, it will appear here.</Text>
                        </View>
                    ) : (
                        reflections.map((ref, index) => (
                            <SpiritualCard key={ref.id || index} style={{ marginBottom: 16 }}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.topicBadge}>{ref.topic}</Text>
                                    <Text style={styles.dateText}>{ref.local_day}</Text>
                                </View>
                                <Text style={styles.noteText}>"{ref.note}"</Text>
                                <View style={styles.divider} />
                                <Text style={styles.versesLabel}>Verses Referenced:</Text>
                                {JSON.parse(ref.verses_json).map((v: any, i: number) => (
                                    <Text key={i} style={styles.verseText}>• {v.reference}</Text>
                                ))}
                            </SpiritualCard>
                        ))
                    )}
                </ScrollView>
            )}
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.sg.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: spacing.l, paddingBottom: spacing.xxl * 2, gap: 16 },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, padding: 24 },
    emptyTitle: { ...typography.sg.headlineLgMobile, color: colors.sg.onSurfaceVariant, marginBottom: 8 },
    emptySubtitle: { ...typography.sg.bodyMd, color: colors.sg.outline, textAlign: 'center' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    topicBadge: { ...typography.sg.labelMd, fontSize: 13, color: colors.sg.secondary, backgroundColor: colors.sg.secondaryContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
    dateText: { ...typography.sg.labelMd, fontSize: 13, color: colors.sg.onSurfaceVariant },
    noteText: { ...typography.sg.spiritualText, color: colors.sg.primary, fontStyle: 'italic', marginBottom: 16 },
    divider: { height: 1, backgroundColor: colors.sg.surfaceContainerHigh, marginVertical: 16 },
    versesLabel: { ...typography.sg.labelMd, color: colors.sg.outline, marginBottom: 8 },
    verseText: { ...typography.sg.bodyMd, color: colors.sg.onSurfaceVariant, marginBottom: 4 }
});
