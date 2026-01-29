import { ProgressBar } from '@/components/quiz/ProgressBar';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useQuizStore } from '@/state/quizStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QuizPlayScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    // Layout and Safe Area State
    const insets = useSafeAreaInsets();
    const [footerHeight, setFooterHeight] = useState(0);

    const {
        questions,
        currentQuestionIndex,
        status,
        timer,
        selectedOption,
        selectOption,
        submitAnswer,
        nextQuestion,
        startQuiz,
        tickTimer,
        answers
    } = useQuizStore();

    // Start Quiz on mount
    useEffect(() => {
        if (id) {
            startQuiz(id as string);
        }
    }, [id]);

    // Tick Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'active') {
            interval = setInterval(() => {
                tickTimer();
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status]);

    // Handle Completion
    useEffect(() => {
        if (status === 'completed') {
            const state = useQuizStore.getState();
            router.replace({
                pathname: `/quiz/${id}/result`,
                params: {
                    score: state.score,
                    total: state.questions.length
                }
            });
        }
    }, [status, id, router]);

    const currentQuestion = questions[currentQuestionIndex];
    const progress = (currentQuestionIndex + 1) / (questions.length || 1);
    const isQuestionDone = answers.some(a => a.question === currentQuestion?.question);

    if (status === 'loading' || status === 'idle') {
        return (
            <ScreenContainer>
                <Header title="Loading..." showBack />
                <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            </ScreenContainer>
        );
    }

    if (status === 'error' || !currentQuestion) {
        return (
            <ScreenContainer>
                <Header title="Error" showBack />
                <View style={styles.center}><Text>Failed to load quiz. Please try again.</Text></View>
            </ScreenContainer>
        );
    }

    const handleAction = () => {
        if (isQuestionDone) {
            nextQuestion();
        } else {
            submitAnswer();
        }
    };

    return (
        // Disable safe bottom here since we manual handle it in footer
        <ScreenContainer safe={true}>
            {/* Note: ScreenContainer safe=true acts on top/left/right by default based on its impl */}
            <Header
                title={`Question ${currentQuestionIndex + 1}/${questions.length}`}
                showBack
            />

            <View style={styles.progressContainer}>
                <ProgressBar progress={progress} />
            </View>

            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: footerHeight + spacing.l } // Add extra padding so content clears footer
                ]}
            >
                <QuestionCard
                    question={currentQuestion}
                    selectedOption={selectedOption}
                    onSelectOption={selectOption}
                    showResult={isQuestionDone}
                />
            </ScrollView>

            <View
                style={[
                    styles.footer,
                    { paddingBottom: Math.max(insets.bottom, spacing.l) } // Respect safe area
                ]}
                onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
            >
                <Text style={styles.timer}>Time: {timer}s</Text>

                <Button
                    title={isQuestionDone ? "Next Question" : "Confirm Answer"}
                    onPress={handleAction}
                    disabled={!selectedOption && !isQuestionDone}
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
    progressContainer: {
        paddingHorizontal: spacing.l,
        paddingVertical: spacing.m,
    },
    content: {
        padding: spacing.l,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.l,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: spacing.m,
    },
    timer: {
        textAlign: 'center',
        ...typography.h3,
        color: colors.textSecondary,
        marginBottom: spacing.s,
    }
});
