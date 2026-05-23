import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, Send, MessageSquare } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { SuggestedQuestionCard } from '../components/SuggestedQuestionCard';
import { askNoor } from '../services/noorApi';

const SUGGESTED_QUESTIONS = [
  'What does Quran say about patience?',
  'Explain charity in Islam',
  'Tell me about Prophet Musa',
  'What is the meaning of Surah Al-Ikhlas?',
];

export const AskScreen = ({ navigation }: any) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    }
  };

  return (
    <LinearGradient
      colors={['#E6F4EA', '#F3F4F6']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Noor AI</Text>
            <Text style={styles.subtitle}>Ask about the Quran and Islam.</Text>
          </View>

          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              placeholder="Ask about the Quran, Islam, or a Prophet..."
              value={question}
              onChangeText={setQuestion}
              multiline
            />
            <TouchableOpacity style={styles.micButton}>
              <Mic size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.askButton}
            onPress={() => handleAsk(question)}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.askButtonText}>
                {isLoading ? 'Connecting to Noor AI...' : 'Ask Noor AI'}
              </Text>
            </LinearGradient>
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
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.l,
    alignItems: 'center',
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'serif', // Placeholder for premium font
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 8,
  },
  inputCard: {
    backgroundColor: colors.surface,
    width: '100%',
    borderRadius: 20,
    padding: spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: spacing.l,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  input: {
    ...typography.body,
    color: colors.textBody,
    textAlignVertical: 'top',
    flex: 1,
  },
  micButton: {
    alignSelf: 'flex-end',
    padding: spacing.s,
  },
  askButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  askButtonText: {
    ...typography.button,
    color: colors.textLight,
  },
  suggestionsContainer: {
    width: '100%',
  },
});
