import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './ui/Card';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface AnswerCardProps {
  answer: string;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({ answer }) => {
  return (
    <Card style={styles.container}>
      <Text style={styles.label}>Answer</Text>
      <Text style={styles.answer}>
        {typeof answer === 'string' ? answer : JSON.stringify(answer)}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
    padding: spacing.l,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  answer: {
    ...typography.body,
    color: colors.textBody,
    lineHeight: 24,
  },
});
