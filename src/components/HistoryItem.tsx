import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './ui/Card';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { ChevronRight } from 'lucide-react-native';

interface HistoryItemProps {
  question: string;
  date: string;
  onPress: () => void;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({
  question,
  date,
  onPress,
}) => {
  return (
    <Card style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.question} numberOfLines={1}>
            {question}
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <ChevronRight size={20} color={colors.textSecondary} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.s,
    padding: spacing.m,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  question: {
    ...typography.bodyBold,
    color: colors.textBody,
    marginBottom: 4,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
