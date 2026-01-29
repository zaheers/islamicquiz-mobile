import { colors } from '@/theme/colors';
import { borderRadius } from '@/theme/spacing';
import React from 'react';
import { DimensionValue, StyleSheet, View } from 'react-native';

interface ProgressBarProps {
    progress: number; // 0 to 1
    height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, height = 8 }) => {
    const widthVal = `${Math.min(Math.max(progress, 0), 1) * 100}%` as DimensionValue;

    return (
        <View style={[styles.container, { height }]}>
            <View style={[styles.fill, { width: widthVal }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: colors.border,
        borderRadius: borderRadius.round,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.round,
    },
});
