import { useTheme } from '@/hooks/useTheme';
import { borderRadius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    loading?: boolean;
    textStyle?: any;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    loading = false,
    style,
    textStyle,
    disabled,
    ...props
}) => {
    const { activeColors, colors } = useTheme();
    const isOutline = variant === 'outline';
    const isGhost = variant === 'ghost';

    const bgStyles = [
        styles.button,
        variant === 'primary' && { backgroundColor: colors.sg?.primary || colors.primary },
        variant === 'secondary' && { backgroundColor: colors.sg?.secondary || colors.secondary },
        isOutline && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.sg?.primary || colors.primary },
        isGhost && styles.ghost,
        disabled && !isOutline && !isGhost && { backgroundColor: colors.border, borderColor: colors.border },
        disabled && isOutline && { borderColor: colors.border },
        style,
    ];

    const textCommon = [styles.text, typography.button];
    const textStyles = [
        ...textCommon,
        variant === 'primary' && { color: colors.sg?.onPrimary || '#FFFFFF' },
        variant === 'secondary' && { color: colors.sg?.onSecondary || '#FFFFFF' },
        isOutline && { color: colors.text },
        isGhost && { color: colors.text },
        disabled && !isOutline && !isGhost && { color: colors.textSecondary },
        disabled && isOutline && { color: colors.textSecondary },
        textStyle,
    ];

    return (
        <TouchableOpacity
            style={bgStyles}
            disabled={disabled || loading}
            activeOpacity={0.8}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={isOutline || isGhost ? colors.text : (colors.sg?.onPrimary || '#FFFFFF')} />
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
    ghost: {
        backgroundColor: 'transparent',
    },
    text: {
        textAlign: 'center',
    },
});
