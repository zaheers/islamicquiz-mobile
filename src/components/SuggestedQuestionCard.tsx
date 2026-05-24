import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SpiritualCard } from './ui/SpiritualCard';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface SuggestedQuestionCardProps {
  question: string;
  onPress: () => void;
}

export const SuggestedQuestionCard: React.FC<SuggestedQuestionCardProps> = ({
  question,
  onPress,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.container}>
      <SpiritualCard style={styles.card}>
        <Text style={styles.question}>{question}</Text>
      </SpiritualCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.s,
  },
  card: {
    padding: spacing.m,
  },
  question: {
    ...typography.sg.bodyMd,
    color: colors.sg.onSurface,
  },
});
