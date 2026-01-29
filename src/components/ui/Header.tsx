import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HeaderProps {
    title: string;
    showBack?: boolean;
    rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack = false, rightAction }) => {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.left}>
                {showBack && (
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                )}
            </View>

            <Text style={styles.title}>{title}</Text>

            <View style={styles.right}>
                {rightAction}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.m,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    left: {
        width: 40,
        alignItems: 'flex-start',
    },
    right: {
        width: 40,
        alignItems: 'flex-end',
    },
    backButton: {
        padding: spacing.xs,
        marginLeft: -spacing.xs,
    },
    title: {
        flex: 1,
        textAlign: 'center',
        ...typography.h3,
        color: colors.text,
    },
});
