import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { QUIZ_CONFIG } from '@/lib/config';
import { categories } from '@/lib/mockData';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function QuizStartScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const selectedCategory = categories.find(c => c.slug === id);
    const questionCount = QUIZ_CONFIG.DEFAULT_QUESTION_COUNT;
    const timePerQuestion = QUIZ_CONFIG.DEFAULT_TIME_PER_QUESTION / 60; // Minutes for display (approx)

    if (!selectedCategory) {
        return (
            <ScreenContainer>
                <Header title="Error" showBack />
                <View style={styles.center}>
                    <Text>Category not found</Text>
                </View>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer>
            <Header title={selectedCategory.title} showBack />

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{selectedCategory.icon}</Text>
                </View>

                <Text style={styles.title}>{selectedCategory.title}</Text>
                <Text style={styles.description}>{selectedCategory.description}</Text>

                <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Questions</Text>
                        <Text style={styles.infoValue}>{questionCount}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Time</Text>
                        <Text style={styles.infoValue}>~ {Math.ceil(questionCount * timePerQuestion)} min</Text>
                    </View>
                </Card>

                <View style={styles.spacer} />

                <Button
                    title="Start Quiz"
                    onPress={() => router.push(`/quiz/${id}/play`)}
                />
            </View>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: spacing.l,
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.l,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    icon: {
        fontSize: 48,
    },
    title: {
        ...typography.h1,
        color: colors.text,
        marginBottom: spacing.s,
    },
    description: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    infoCard: {
        width: '100%',
        padding: spacing.l,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLabel: {
        ...typography.body,
        color: colors.textSecondary,
    },
    infoValue: {
        ...typography.h3,
        color: colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.m,
    },
    spacer: {
        flex: 1,
    },
});
