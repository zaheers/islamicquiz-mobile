import { Header } from '@/components/ui/Header';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
    return (
        <ScreenContainer>
            <Header title="Profile" showBack />
            <View style={styles.content}>
                <Text style={styles.text}>Profile Coming Soon</Text>
            </View>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.l,
    },
    text: {
        ...typography.h3,
        color: colors.textSecondary,
    },
});
