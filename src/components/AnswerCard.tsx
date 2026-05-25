import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SpiritualCard } from './ui/SpiritualCard';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface AnswerCardProps {
  answer: string;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({ answer }) => {
    const { activeColors, colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <SpiritualCard style={styles.container}>
      <Text style={styles.label}>Answer</Text>
      <Text style={styles.answer}>
        {typeof answer === 'string' ? answer : JSON.stringify(answer)}
      </Text>
    </SpiritualCard>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: spacing.m,
    padding: spacing.l,
    backgroundColor: colors.sg.surfaceContainerLowest,
  },
  label: {
    ...typography.sg.labelMd,
    color: colors.sg.outline,
    marginBottom: spacing.xs,
  },
  answer: {
    ...typography.sg.bodyLg,
    color: colors.sg.onSurface,
  },
});
