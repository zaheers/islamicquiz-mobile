import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    loading = false,
    style,
    disabled,
    ...props
}) => {
    const isOutline = variant === 'outline';
    const isGhost = variant === 'ghost';

    const bgStyles = [
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        isOutline && styles.outline,
        isGhost && styles.ghost,
        disabled && styles.disabled,
        style,
    ];

    const textCommon = [styles.text, typography.button];
    const textStyles = [
        ...textCommon,
        variant === 'primary' && { color: colors.surface },
        variant === 'secondary' && { color: colors.surface },
        isOutline && { color: colors.primary },
        isGhost && { color: colors.primary },
        disabled && { color: colors.textSecondary },
    ];

    return (
        <TouchableOpacity
            style={bgStyles}
            disabled={disabled || loading}
            activeOpacity={0.8}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={isOutline || isGhost ? colors.primary : colors.surface} />
            ) : (
                <Text style={textStyles as any}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.l,
        borderRadius: borderRadius.l,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    primary: {
        backgroundColor: colors.primary,
    },
    secondary: {
        backgroundColor: colors.secondary,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    disabled: {
        backgroundColor: colors.border,
        borderColor: colors.border,
    },
    text: {
        textAlign: 'center',
    },
});
