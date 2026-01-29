import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Question } from '@/lib/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface QuestionCardProps {
    question: Question;
    selectedOption: string | null;
    onSelectOption: (option: string) => void;
    showResult?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
    question,
    selectedOption,
    onSelectOption,
    showResult = false
}) => {
    const getVariant = (option: string) => {
        if (!selectedOption) return 'outline';

        if (showResult) {
            if (option === question.answer) return 'primary'; // Correct
            if (option === selectedOption && option !== question.answer) return 'secondary'; // Wrong selection
            return 'outline';
        }

        return selectedOption === option ? 'primary' : 'outline';
    };

    return (
        <View style={styles.container}>
            <Card style={styles.questionContainer}>
                <Text style={styles.questionText}>{question.question}</Text>
            </Card>

            <View style={styles.optionsContainer}>
                {question.options.map((option, index) => (
                    <Button
                        key={index}
                        title={option}
                        variant={getVariant(option)}
                        onPress={() => !showResult && onSelectOption(option)}
                        disabled={showResult}
                        style={styles.optionButton}
                    />
                ))}
            </View>

            {showResult && (
                <Card style={styles.explanationCard} variant="flat">
                    <Text style={styles.explanationTitle}>Explanation</Text>
                    <Text style={styles.explanationText}>{question.explanation}</Text>
                </Card>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: spacing.l,
    },
    questionContainer: {
        minHeight: 120,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.l,
    },
    questionText: {
        ...typography.h3,
        textAlign: 'center',
        color: colors.text,
    },
    optionsContainer: {
        gap: spacing.m,
    },
    optionButton: {
        justifyContent: 'center', // override row for center text
        borderWidth: 2,
    },
    explanationCard: {
        marginTop: spacing.m,
        backgroundColor: colors.primary + '10', // 10% opacity hex if simple append, else use rgba
        borderColor: colors.primary,
        borderWidth: 1,
    },
    explanationTitle: {
        ...typography.h3,
        color: colors.primaryDark,
        marginBottom: spacing.s,
    },
    explanationText: {
        ...typography.body,
        color: colors.text,
    },
});
