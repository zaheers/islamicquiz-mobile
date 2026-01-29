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

    // We compute styles dynamically for strict "Green/Red" highlighting
    const getOptionStyle = (option: string) => {
        if (!selectedOption) return {}; // Default state

        if (showResult) {
            // After Check:
            if (option === question.answer) {
                // Correct Answer -> Green highlight
                return {
                    borderColor: colors.success,
                    backgroundColor: colors.success + '20', // Subtle green tint
                    borderWidth: 2
                };
            }
            if (option === selectedOption && option !== question.answer) {
                // Selected Wrong -> Red highlight
                return {
                    borderColor: colors.error,
                    backgroundColor: colors.error + '20', // Subtle red tint
                    borderWidth: 2
                };
            }
            // Other options -> Disabled look
            return { opacity: 0.5 };
        }

        // Before Check: Selected gets border highlight
        if (selectedOption === option) {
            return {
                borderColor: colors.primary,
                backgroundColor: colors.primary + '10',
                borderWidth: 2
            };
        }

        return {};
    };

    // We can't easily change the 'variant' to mapped colors because Button uses fixed variants.
    // Instead we use 'outline' as base and override with 'style'.
    // BUT 'primary' variant in Button handles text color too.
    // Let's use 'outline' variant to keep text visible (primary/black), and override backgrounds/borders.

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
                        // Use outline to start, then override.
                        variant="outline"
                        onPress={() => !showResult && onSelectOption(option)}
                        disabled={showResult}
                        style={[
                            styles.optionButton,
                            getOptionStyle(option)
                        ]}
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
        justifyContent: 'center',
        borderWidth: 1, // Default thin border
    },
    explanationCard: {
        marginTop: spacing.m,
        backgroundColor: colors.primary + '10',
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
