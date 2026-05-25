import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SpiritualCard } from './ui/SpiritualCard';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface QuestionCardProps {
  question: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
    const { activeColors, colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <SpiritualCard style={styles.container}>
      <Text style={styles.label}>Your Question</Text>
      <Text style={styles.question}>
        {typeof question === 'string' ? question : JSON.stringify(question)}
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
    color: colors.sg.secondary,
    marginBottom: spacing.xs,
  },
  question: {
    ...typography.sg.headlineLgMobile,
    fontSize: 22,
    color: colors.sg.primary,
  },
});
