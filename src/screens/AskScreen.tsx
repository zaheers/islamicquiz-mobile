import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Mic } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { SuggestedQuestionCard } from '../components/SuggestedQuestionCard';
import { askNoor } from '../services/noorApi';
import { ScreenContainer } from '@/components/ui/ScreenContainer';

const SUGGESTED_QUESTIONS = [
  'What does Quran say about patience?',
  'Explain charity in Islam',
  'Tell me about Prophet Musa',
  'What is the meaning of Surah Al-Ikhlas?',
];

export const AskScreen = ({ route, navigation }: any) => {
    const { activeColors, colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

  const initialQuery = route?.params?.query || '';
  const [question, setQuestion] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const autoAskTriggered = useRef(false);

  useEffect(() => {
    if (initialQuery && !autoAskTriggered.current) {
      autoAskTriggered.current = true;
      handleAsk(initialQuery);
    }
  }, [initialQuery]);

  const handleAsk = async (q: string) => {
    const query = q || question;
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const result = await askNoor(query);
      navigation.navigate('Answer', { question: query, result });
    } catch (error) {
      alert('Unable to reach Noor AI service. Please try again.');
    } finally {
      setIsLoading(false);
      setQuestion(''); // clear input
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Noor AI</Text>
          <Text style={styles.subtitle}>Ask about the Quran and Islam.</Text>
        </View>

        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="Ask about the Quran, Islam, or a Prophet..."
            placeholderTextColor={colors.sg.outline}
            value={question}
            onChangeText={setQuestion}
            multiline
          />
          <TouchableOpacity style={styles.micButton}>
            <Mic size={24} color={colors.sg.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.askButton, isLoading && { opacity: 0.7 }]}
          onPress={() => handleAsk(question)}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.askButtonText}>
            {isLoading ? 'Connecting to Noor AI...' : 'Ask Noor AI'}
          </Text>
        </TouchableOpacity>

        <View style={styles.suggestionsContainer}>
          {SUGGESTED_QUESTIONS.map((q, index) => (
            <SuggestedQuestionCard
              key={index}
              question={q}
              onPress={() => handleAsk(q)}
            />
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sg.background,
  },
  scrollContent: {
    padding: spacing.l,
    alignItems: 'center',
    paddingBottom: spacing.xxl * 2,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    ...typography.sg.displayLg,
    color: colors.sg.primary,
  },
  subtitle: {
    ...typography.sg.bodyLg,
    color: colors.sg.onSurfaceVariant,
    marginTop: 8,
  },
  inputCard: {
    backgroundColor: colors.sg.surfaceContainerLowest,
    width: '100%',
    borderRadius: 20,
    padding: spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: spacing.l,
    minHeight: 120,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.sg.surfaceContainerHigh,
  },
  input: {
    ...typography.sg.bodyLg,
    color: colors.sg.onSurface,
    textAlignVertical: 'top',
    flex: 1,
  },
  micButton: {
    alignSelf: 'flex-end',
    padding: spacing.s,
    backgroundColor: colors.sg.surfaceContainerHighest,
    borderRadius: 24,
  },
  askButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.sg.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: colors.sg.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  askButtonText: {
    ...typography.sg.labelMd,
    fontSize: 16,
    color: colors.sg.onPrimary,
  },
  suggestionsContainer: {
    width: '100%',
  },
});
