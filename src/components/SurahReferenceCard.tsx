import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Card } from './ui/Card';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { BookOpen, ChevronRight } from 'lucide-react-native';

interface SurahReferenceCardProps {
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  referenceCount?: number;
  onPress: () => void;
}

export const SurahReferenceCard: React.FC<SurahReferenceCardProps> = ({
  surahName,
  surahNumber,
  ayahNumber,
  referenceCount,
  onPress,
}) => {
  const displayName = surahName.toLowerCase().startsWith('surah') 
    ? surahName 
    : `Surah ${surahName}`;

  return (
    <Card style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <BookOpen size={20} color={colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.reference}>
            {displayName} ({surahNumber}:{ayahNumber})
          </Text>
          {referenceCount !== undefined && (
            <Text style={styles.subtext}>{referenceCount} References</Text>
          )}
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '10', // 10% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  textContainer: {
    flex: 1,
  },
  reference: {
    ...typography.bodyBold,
    color: colors.textBody,
  },
  subtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
