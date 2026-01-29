import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { categories } from '@/lib/mockData';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
    const router = useRouter();
    // Web Parity: Categories are hardcoded in the web app, so we use the local definition here.
    // If future needs require Firestore categories, we would fetch them here.

    const renderCategory = ({ item }: { item: typeof categories[0] }) => (
        <Card
            style={styles.categoryCard}
            onPress={() => router.push(`/quiz/${item.slug}`)}
        >
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            </View>
        </Card>
    );

    return (
        <ScreenContainer>
            <Header title="Islamic Quiz" rightAction={<View />} />
            <FlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={{ height: spacing.m }} />}
            />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    listContent: {
        padding: spacing.m,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
    },
    icon: {
        fontSize: 40,
        marginRight: spacing.m,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        ...typography.h3,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    description: {
        ...typography.caption,
        color: colors.textSecondary,
    },
});
