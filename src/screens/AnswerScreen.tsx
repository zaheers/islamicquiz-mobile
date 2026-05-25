import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { QuestionCard } from '../components/QuestionCard';
import { AnswerCard } from '../components/AnswerCard';
import { SurahReferenceCard } from '../components/SurahReferenceCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveNoorHistory } from '../services/noorHistoryService';
import { ScreenContainer } from '@/components/ui/ScreenContainer';

export const AnswerScreen = ({ route, navigation }: any) => {
    const { activeColors, colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { question, result } = route.params;

  useEffect(() => {
    saveToHistory();
  }, []);

  const saveToHistory = async () => {
    try {
      const historyJson = await AsyncStorage.getItem('noor_history');
      let history = historyJson ? JSON.parse(historyJson) : [];
      
      const newItem = {
        question,
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        result,
      };
      
      history = history.filter((item: any) => item.question !== question);
      history.unshift(newItem);
      
      if (history.length > 50) history.pop();
      
      await AsyncStorage.setItem('noor_history', JSON.stringify(history));

      try {
        const answerText = typeof result.answer === 'string' ? result.answer : JSON.stringify(result.answer);
        await saveNoorHistory(question, answerText);
      } catch (sqlErr) {
        console.warn('SQLite history save failed (non-critical):', sqlErr);
      }
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const tafsirMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (result.tafsir && Array.isArray(result.tafsir)) {
      result.tafsir.forEach((t: any) => {
        if (typeof t === 'object' && t !== null) {
          const surah = t.surah_number || t.surah_id || t.number;
          const start = t.start_ayah || t.ayah_number || t.ayah;
          const end = t.end_ayah || t.ayah_number || t.ayah || start;
          const content = t.content || t.text || t.explanation;
          
          if (surah && start && content) {
            for (let i = Number(start); i <= Number(end); i++) {
              map[`${surah}:${i}`] = content;
            }
          }
        }
      });
    }
    return map;
  }, [result.tafsir]);

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={28} color={colors.sg.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Noor AI Response</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <QuestionCard question={question} />
        <AnswerCard answer={result.answer} />

        <View style={styles.referencesHeader}>
          <Text style={styles.referencesTitle}>Quran References</Text>
        </View>

        {result.verses.map((verse: any, index: number) => {
          const surahNum = verse.surah_number || verse.number || verse.surah_id || 0;
          const ayahNum = verse.ayah_number || verse.ayah || verse.start_ayah || 0;
          const key = `${surahNum}:${ayahNum}`;
          const tafsirContent = tafsirMap[key] || "";
          
          const rawName = verse.surah_name || verse.name || verse.surah || "";
          const cleanName = rawName ? String(rawName).replace(/^surah\s+/i, '').trim() : '';

          return (
            <SurahReferenceCard
              key={index}
              surahName={cleanName || (surahNum ? `Surah ${surahNum}` : 'Surah')}
              surahNumber={Number(surahNum)}
              ayahNumber={Number(ayahNum)}
              onPress={() =>
                navigation.navigate('SurahDetail', {
                  verse,
                  tafsir: tafsirContent,
                  surahKey: key
                })
              }
            />
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sg.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: colors.sg.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.sg.surfaceContainerHigh,
  },
  backButton: {
    padding: spacing.s,
  },
  headerTitle: {
    ...typography.sg.headlineLgMobile,
    fontSize: 22,
    marginLeft: spacing.s,
    color: colors.sg.primary,
  },
  content: {
    padding: spacing.m,
    paddingBottom: spacing.xxl * 2,
  },
  referencesHeader: {
    marginTop: spacing.l,
    marginBottom: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
  },
  referencesTitle: {
    ...typography.sg.headlineLgMobile,
    fontSize: 24,
    color: colors.sg.onSurface,
  },
});
