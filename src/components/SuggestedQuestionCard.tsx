import React from 'react';
import { StyleSheet, Text, Pressable } from 'react-native';
import { Card } from './ui/Card';
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
    <Card style={styles.container} onPress={onPress} variant="elevated">
      <Text style={styles.question}>{question}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.s,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  question: {
    ...typography.body,
    color: colors.textBody,
  },
});
