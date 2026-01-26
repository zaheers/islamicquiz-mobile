import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, BackHandler } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { dataSource } from '../services/dataSource';
import { Question, RootStackParamList, QuizResult } from '../types';

type QuizScreenRouteProp = RouteProp<RootStackParamList, 'Quiz'>;
type QuizScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Quiz'>;

const QUESTION_TIME_SECONDS = 20;

export const QuizScreen = () => {
    const navigation = useNavigation<QuizScreenNavigationProp>();
    const route = useRoute<QuizScreenRouteProp>();
    const { categoryId, categoryTitle } = route.params;

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    // State for logic
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);

    // History tracking for back navigation
    // Map of questionIndex -> { selectedOptionIndex, timeLeft } (implied logic, simplify to just selection)
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Load Questions
    useEffect(() => {
        const loadQuestions = async () => {
            try {
                const data = await dataSource.getQuestionsByCategory(categoryId);
                setQuestions(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadQuestions();
    }, [categoryId]);

    const clearTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const startTimer = useCallback(() => {
        clearTimer();
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearTimer();
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [currentIndex, isLocked]); // Dependencies for callback identity

    // Timer Effect
    useEffect(() => {
        if (!loading && questions.length > 0 && !isLocked) {
            startTimer();
        }
        return () => clearTimer();
    }, [currentIndex, loading, questions.length, isLocked, startTimer]);


    const handleTimeout = () => {
        // Mark as incorrect (null selection effectively) or separate state?
        // User says: "Mark unanswered as incorrect" -> We just treat it as locked with no selection or a special state.
        // "Auto-advance to next question after 500ms"
        setIsLocked(true);
        setTimeout(() => {
            goNext();
        }, 500);
    };

    const handleSelectOption = (index: number) => {
        if (isLocked) return;

        setSelectedOptionIndex(index);
        setIsLocked(true);
        clearTimer();

        // Save answer
        setAnswers(prev => ({
            ...prev,
            [currentIndex]: index
        }));
    };

    const goNext = () => {
        if (currentIndex < questions.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            resetQuestionState(nextIndex);
        } else {
            finishQuiz();
        }
    };

    const goBack = () => {
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            // Restore state
            const prevAnswer = answers[newIndex];
            if (prevAnswer !== undefined) {
                setSelectedOptionIndex(prevAnswer);
                setIsLocked(true); // Locked because it was answered
                // User requirement: "sets timer back to 20s (simple)"
                setTimeLeft(QUESTION_TIME_SECONDS);
                // If it's locked, timer shouldn't run.
            } else {
                resetQuestionState(newIndex);
            }
        } else {
            navigation.goBack();
        }
    };

    const resetQuestionState = (index: number) => {
        // Check if we already visited and answered this question (forward navigation after back)
        // Implicitly, if we go forward again, should we retain the answer? 
        // User didn't specify "Next" behavior on re-visit, but standard quiz behavior often keeps it or clear it.
        // "Next button advances... resets timer to 20s" implies fresh start if we treat linear flow.
        // But typically "Back" then "Next" means we are Reviewing or correcting.
        // Let's assume linear progression for simplicity unless "Back" was pressed.

        // Actually, if I go back and change answer, then go Next...
        // User requirement: "Back button moves to previous question, restores ... selected answer"

        // Let's check `answers` for the new index.
        const existingAnswer = answers[index];

        if (existingAnswer !== undefined) {
            setSelectedOptionIndex(existingAnswer);
            setIsLocked(true);
            setTimeLeft(QUESTION_TIME_SECONDS);
        } else {
            setSelectedOptionIndex(null);
            setIsLocked(false);
            setTimeLeft(QUESTION_TIME_SECONDS);
        }
    };

    const finishQuiz = () => {
        let score = 0;
        let correctAnswers = 0;
        let incorrectAnswers = 0; // count answered but wrong
        let missingAnswers = 0; // count timed out

        questions.forEach((q, idx) => {
            const ans = answers[idx];
            if (ans !== undefined) {
                if (ans === q.correctAnswerIndex) {
                    score++;
                    correctAnswers++;
                } else {
                    incorrectAnswers++;
                }
            } else {
                missingAnswers++;
            }
        });

        const result: QuizResult = {
            score,
            totalQuestions: questions.length,
            correctAnswers,
            missingAnswers: questions.length - correctAnswers // Simplified logic
        };

        navigation.replace('Result', { result, categoryId });
    };

    if (loading || questions.length === 0) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={theme.typography.body}>Loading QuestionBank...</Text>
            </View>
        );
    }

    const currentQuestion = questions[currentIndex];
    // Progress is 1-based index / total
    const progressPercent = ((currentIndex + 1) / questions.length) * 100;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <View style={styles.timerContainer}>
                    <Text style={styles.timerText}>{timeLeft}s</Text>
                </View>
                <View style={styles.difficultyContainer}>
                    <Text style={styles.difficultyText}>Medium</Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>

            <Text style={styles.progressText}>Question {currentIndex + 1} / {questions.length}</Text>

            {/* Question Card */}
            <View style={styles.questionCard}>
                <Text style={styles.questionText}>{currentQuestion.question}</Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedOptionIndex === index;
                    // If locked, show correct/incorrect state if we want "Immediate feedback"
                    // User said: "Immediate visual feedback on selection"
                    // Let's calculate local status
                    let optionStyle = styles.optionCard;
                    if (isLocked) {
                        if (isSelected) {
                            // Highlighting logic
                            const isCorrect = index === currentQuestion.correctAnswerIndex;
                            optionStyle = isCorrect ? styles.optionCorrect : styles.optionIncorrect;
                        } else if (index === currentQuestion.correctAnswerIndex && isSelected) {
                            // Show correct one if wrong selected? User didn't explicitly ask, but good UX.
                            // "Mark unanswered as incorrect" -> Maybe show correct answer if time ran out?
                            // Let's keep it simple: selected one turns green or red.
                        }

                        // If user selected WRONG answer, usually we highlight the CORRECT one too.
                        if (isSelected && index !== currentQuestion.correctAnswerIndex) {
                            // Current is selected & wrong -> red.
                            // The correct one -> green?
                        }
                        if (index === currentQuestion.correctAnswerIndex && selectedOptionIndex !== null && selectedOptionIndex !== index) {
                            optionStyle = styles.optionCorrect; // Show correct answer
                        }
                    }

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[styles.optionCard, optionStyle]}
                            onPress={() => handleSelectOption(index)}
                            disabled={isLocked}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
                                <Text style={styles.optionLetter}>{String.fromCharCode(65 + index)}</Text>
                            </View>
                            <Text style={styles.optionText}>{option}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Navigation Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.navButtonSecondary} onPress={goBack}>
                    <Text style={styles.navButtonTextSecondary}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navButtonPrimary} onPress={goNext}>
                    <Text style={styles.navButtonTextPrimary}>
                        {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
                    </Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.m,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.s,
        marginBottom: theme.spacing.m,
    },
    closeButton: {
        padding: theme.spacing.s,
    },
    closeButtonText: {
        color: theme.colors.textSecondary,
        fontSize: 24,
    },
    timerContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.round,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    timerText: {
        ...theme.typography.button,
        color: theme.colors.primary,
    },
    difficultyText: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    difficultyContainer: {
        // Just a label
    },
    progressBarBg: {
        height: 6,
        backgroundColor: theme.colors.progressBackground,
        borderRadius: 3,
        marginBottom: theme.spacing.s,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.progressFill,
    },
    progressText: {
        ...theme.typography.caption,
        alignSelf: 'center',
        marginBottom: theme.spacing.l,
    },
    questionCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.l,
        marginBottom: theme.spacing.l,
        minHeight: 120,
        justifyContent: 'center',
    },
    questionText: {
        ...theme.typography.h2,
        textAlign: 'center',
        lineHeight: 32,
    },
    optionsContainer: {
        flex: 1,
        gap: theme.spacing.m,
    },
    optionCard: {
        backgroundColor: theme.colors.optionBackground,
        borderRadius: theme.borderRadius.m,
        padding: theme.spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    optionCorrect: {
        borderColor: theme.colors.success,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    optionIncorrect: {
        borderColor: theme.colors.error,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    optionCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4B5563',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.m,
    },
    optionCircleSelected: {
        backgroundColor: theme.colors.primary,
    },
    optionLetter: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    optionText: {
        ...theme.typography.body,
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.l,
    },
    navButtonSecondary: {
        paddingVertical: theme.spacing.m,
        paddingHorizontal: theme.spacing.l,
        borderRadius: theme.borderRadius.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    navButtonTextSecondary: {
        color: theme.colors.text,
        fontWeight: '600',
    },
    navButtonPrimary: {
        paddingVertical: theme.spacing.m,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.borderRadius.m,
        backgroundColor: theme.colors.primary,
    },
    navButtonTextPrimary: {
        color: '#FFF',
        fontWeight: 'bold',
    }
});
