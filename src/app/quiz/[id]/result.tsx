import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function QuizResultScreen() {
    const { id, score, total } = useLocalSearchParams();
    const router = useRouter();

    const scoreNum = Number(score);
    const totalNum = Number(total);
    const percentage = Math.round((scoreNum / totalNum) * 100);

    let feedback = "Good Effort!";
    if (percentage >= 90) feedback = "Excellent!";
    else if (percentage >= 70) feedback = "Great Job!";
    else if (percentage < 50) feedback = "Keep Learning!";

    return (
        <ScreenContainer>
            <View style={styles.content}>
                <Text style={styles.headerTitle}>Quiz Complete</Text>

                <Card style={styles.scoreCard}>
                    <Text style={styles.scoreLabel}>Your Score</Text>
                    <Text style={styles.scoreValue}>{percentage}%</Text>
                    <Text style={styles.scoreDetail}>{score} / {total} Correct</Text>
                </Card>

                <Text style={styles.feedback}>{feedback}</Text>

                <View style={styles.spacer} />

                <View style={styles.actions}>
                    <Button
                        title="Play Again"
                        onPress={() => router.replace(`/quiz/${id}/play`)}
                        style={styles.button}
                    />
                    <Button
                        title="Home"
                        variant="outline"
                        onPress={() => router.dismissAll()}
                        style={styles.button}
                    />
                </View>
            </View>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        padding: spacing.l,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...typography.h2,
        marginBottom: spacing.xl,
        color: colors.text,
    },
    scoreCard: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: spacing.xl,
        marginBottom: spacing.xl,
    },
    scoreLabel: {
        ...typography.h3,
        color: colors.textSecondary,
        marginBottom: spacing.s,
    },
    scoreValue: {
        fontSize: 64,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: spacing.s,
    },
    scoreDetail: {
        ...typography.body,
        color: colors.text,
    },
    feedback: {
        ...typography.h1,
        color: colors.secondary,
        marginBottom: spacing.l,
    },
    spacer: {
        flex: 1,
    },
    actions: {
        width: '100%',
        gap: spacing.m,
    },
    button: {
        width: '100%',
    },
});
