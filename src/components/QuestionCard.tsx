import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './ui/Card';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface QuestionCardProps {
  question: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  return (
    <Card style={styles.container}>
      <Text style={styles.label}>Question Card</Text>
      <Text style={styles.question}>
        {typeof question === 'string' ? question : JSON.stringify(question)}
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
  question: {
    ...typography.h3,
    color: colors.textBody,
  },
});
