import React, { useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { QuestionCard } from '../components/QuestionCard';
import { AnswerCard } from '../components/AnswerCard';
import { SurahReferenceCard } from '../components/SurahReferenceCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveNoorHistory } from '../services/noorHistoryService';

export const AnswerScreen = ({ route, navigation }: any) => {
  const { question, result } = route.params;

  useEffect(() => {
    saveToHistory();
  }, []);

  const saveToHistory = async () => {
    try {
      const historyJson = await AsyncStorage.getItem('noor_history');
      let history = historyJson ? JSON.parse(historyJson) : [];
      
      // Add new item at the beginning
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
      
      // Filter out duplicate questions
      history = history.filter((item: any) => item.question !== question);
      history.unshift(newItem);
      
      // Keep only last 50 items
      if (history.length > 50) history.pop();
      
      await AsyncStorage.setItem('noor_history', JSON.stringify(history));

      // Also persist to SQLite for the History tab
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Noor AI Response</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.s,
  },
  headerTitle: {
    ...typography.h3,
    marginLeft: spacing.s,
    color: colors.text,
  },
  content: {
    padding: spacing.m,
  },
  referencesHeader: {
    marginTop: spacing.l,
    marginBottom: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
  },
  referencesTitle: {
    ...typography.h3,
    color: colors.text,
  },
});
