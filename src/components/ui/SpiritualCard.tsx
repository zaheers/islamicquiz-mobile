import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export function SpiritualCard({ children, style, featured }: ViewProps & { featured?: boolean }) {
    const { activeColors, colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    return (
        <View style={[styles.card, featured && styles.featuredCard, style]}>
            {children}
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    card: {
        backgroundColor: colors.sg.surfaceContainerLowest,
        borderRadius: 16, // Organic shapes
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04, // Very soft, diffused shadow
        shadowRadius: 20,
        elevation: 2,
    },
    featuredCard: {
        borderTopWidth: 2,
        borderTopColor: colors.sg.secondaryContainer, // Gold accent line
    }
});
