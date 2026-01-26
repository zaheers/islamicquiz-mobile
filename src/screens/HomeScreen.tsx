import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { dataSource } from '../services/dataSource';
import { QuizCategory, RootStackParamList } from '../types';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const CARD_WIDTH = (width - theme.spacing.m * 3) / COLUMN_COUNT;

export const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const [categories, setCategories] = useState<QuizCategory[]>([]);

    useEffect(() => {
        const loadCategories = async () => {
            const cats = await dataSource.getCategories();
            setCategories(cats);
        };
        loadCategories();
    }, []);

    const handleStartQuiz = (category: QuizCategory) => {
        navigation.navigate('Quiz', { categoryId: category.id, categoryTitle: category.title });
    };

    const renderFeaturedCard = () => (
        <View style={styles.featuredContainer}>
            <View style={styles.featuredCard}>
                <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>FEATURED</Text>
                </View>
                <Text style={styles.featuredTitle}>Ramadan Special</Text>
                <Text style={styles.featuredDescription}>
                    Test your knowledge about the holy month of fasting and its rulings.
                </Text>
                <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => handleStartQuiz({ id: 'quran', title: 'Ramadan Special', description: '', icon: '' })} // Hardcoded map for demo
                    activeOpacity={0.8}
                >
                    <Text style={styles.startButtonText}>Start Now</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>Select Category</Text>
        </View>
    );

    const renderCategoryItem = ({ item }: { item: QuizCategory }) => (
        <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => handleStartQuiz(item)}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <Text style={styles.iconText}>{item.icon}</Text>
            </View>
            <Text style={styles.categoryTitle}>{item.title}</Text>
            <Text style={styles.categoryDesc} numberOfLines={2}>{item.description}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={categories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                numColumns={COLUMN_COUNT}
                columnWrapperStyle={styles.columnWrapper}
                ListHeaderComponent={renderFeaturedCard}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    listContent: {
        padding: theme.spacing.m,
        paddingBottom: theme.spacing.xl,
    },
    featuredContainer: {
        marginBottom: theme.spacing.l,
    },
    featuredCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.l,
        marginBottom: theme.spacing.l,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    featuredBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: theme.spacing.s,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.s,
        marginBottom: theme.spacing.s,
    },
    featuredBadgeText: {
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    featuredTitle: {
        ...theme.typography.h1,
        marginBottom: theme.spacing.s,
    },
    featuredDescription: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.m,
    },
    startButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        alignItems: 'center',
    },
    startButtonText: {
        ...theme.typography.button,
    },
    sectionTitle: {
        ...theme.typography.h2,
        marginBottom: theme.spacing.s,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: theme.spacing.m,
    },
    categoryCard: {
        width: CARD_WIDTH,
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.m,
        padding: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minHeight: 140,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
    },
    iconText: {
        fontSize: 20,
    },
    categoryTitle: {
        ...theme.typography.h3,
        fontSize: 16,
        marginBottom: 4,
    },
    categoryDesc: {
        ...theme.typography.caption,
        lineHeight: 18,
    },
});
