import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { RootStackParamList } from '../types';

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;
type ResultScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Result'>;

export const ResultScreen = () => {
    const navigation = useNavigation<ResultScreenNavigationProp>();
    const route = useRoute<ResultScreenRouteProp>();
    const { result, categoryId } = route.params;

    const percentage = Math.round((result.score / result.totalQuestions) * 100);

    // Simple feedback message
    let feedback = 'Keep Learning!';
    if (percentage >= 80) feedback = 'Excellent!';
    else if (percentage >= 50) feedback = 'Good Job!';

    const handleHome = () => {
        navigation.popToTop();
    };

    const handleViewAnswers = () => {
        // Placeholder logic
        // Ideally nav back to quiz in "review" mode or show a list.
        // For now, just alert or stay here. User said "Action Buttons (Home, View Answers)".
        alert('Detailed answers view implementation pending.');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <Text style={styles.headerTitle}>Quiz Results</Text>

                <View style={styles.scoreCard}>
                    <Text style={styles.feedbackText}>{feedback}</Text>
                    <Text style={styles.scoreText}>{result.score} / {result.totalQuestions}</Text>
                    <Text style={styles.percentageText}>{percentage}% Score</Text>
                </View>

                {/* Visualization */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <View style={[styles.dot, { backgroundColor: theme.colors.success }]} />
                        <Text style={styles.statLabel}>Correct</Text>
                        <Text style={styles.statValue}>{result.correctAnswers}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <View style={[styles.dot, { backgroundColor: theme.colors.error }]} />
                        <Text style={styles.statLabel}>Incorrect</Text>
                        <Text style={styles.statValue}>{result.totalQuestions - result.correctAnswers}</Text>
                    </View>
                </View>

                {/* Bar Chart Visualization */}
                <View style={styles.barContainer}>
                    <View style={[styles.barSegment, { flex: result.correctAnswers, backgroundColor: theme.colors.success }]} />
                    <View style={[styles.barSegment, { flex: (result.totalQuestions - result.correctAnswers), backgroundColor: theme.colors.error }]} />
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.buttonOutline} onPress={handleHome}>
                    <Text style={styles.buttonOutlineText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonFilled} onPress={handleViewAnswers}>
                    <Text style={styles.buttonFilledText}>View Answers</Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: theme.spacing.l,
        alignItems: 'center',
        flexGrow: 1,
        justifyContent: 'center',
    },
    headerTitle: {
        ...theme.typography.h2,
        marginBottom: theme.spacing.xl,
    },
    scoreCard: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    feedbackText: {
        ...theme.typography.h1,
        color: theme.colors.primary,
        marginBottom: theme.spacing.s,
    },
    scoreText: {
        fontSize: 64,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    percentageText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
    statsContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
        marginBottom: theme.spacing.m,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    statLabel: {
        ...theme.typography.body,
        marginRight: 8,
    },
    statValue: {
        ...theme.typography.h3,
    },
    barContainer: {
        flexDirection: 'row',
        height: 12,
        width: '100%',
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: theme.colors.card,
    },
    barSegment: {
        height: '100%',
    },
    footer: {
        padding: theme.spacing.l,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.spacing.m,
    },
    buttonOutline: {
        flex: 1,
        paddingVertical: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    buttonOutlineText: {
        ...theme.typography.button,
    },
    buttonFilled: {
        flex: 1,
        paddingVertical: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
    },
    buttonFilledText: {
        ...theme.typography.button,
    },
});
