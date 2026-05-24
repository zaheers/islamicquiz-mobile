import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SpiritualCard } from './ui/SpiritualCard';
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
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.container}>
      <SpiritualCard style={styles.card}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <BookOpen size={20} color={colors.sg.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.reference}>
              {displayName} ({surahNumber}:{ayahNumber})
            </Text>
            {referenceCount !== undefined && (
              <Text style={styles.subtext}>{referenceCount} References</Text>
            )}
          </View>
          <ChevronRight size={20} color={colors.sg.outline} />
        </View>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sg.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  textContainer: {
    flex: 1,
  },
  reference: {
    ...typography.sg.bodyLg,
    fontWeight: '600',
    color: colors.sg.onSurface,
  },
  subtext: {
    ...typography.sg.labelMd,
    color: colors.sg.onSurfaceVariant,
    marginTop: 2,
  },
});
