import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';
import React from 'react';
import { Pressable, StyleSheet, View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
    onPress?: () => void;
    variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    onPress,
    variant = 'elevated',
    ...props
}) => {
    const containerStyles = [
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        variant === 'flat' && styles.flat,
        style,
    ];

    if (onPress) {
        return (
            <Pressable
                style={({ pressed }) => [containerStyles, pressed && styles.pressed]}
                onPress={onPress}
            >
                {children}
            </Pressable>
        );
    }

    return (
        <View style={containerStyles} {...props}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
    },
    elevated: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    outlined: {
        borderWidth: 1,
        borderColor: colors.border,
    },
    flat: {
        backgroundColor: 'transparent',
    },
    pressed: {
        opacity: 0.9,
        transform: [{ scale: 0.99 }],
    },
});
