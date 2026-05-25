import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Clock, ChevronRight, X, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useFocusEffect } from '@react-navigation/native';
import { NoorHistoryItem, loadNoorHistory, deleteNoorHistoryItem } from '../services/noorHistoryService';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SpiritualCard } from '@/components/ui/SpiritualCard';

export const HistoryScreen = ({ navigation }: any) => {
    const { activeColors, colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [history, setHistory] = useState<NoorHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NoorHistoryItem | null>(null);

  // Reload every time the tab is focused
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        try {
          const rows = await loadNoorHistory();
          if (active) setHistory(rows);
        } catch (e) {
          console.error('Failed to load Noor history:', e);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => { active = false; };
    }, [])
  );

  const handleDelete = async (id: number) => {
    await deleteNoorHistoryItem(id);
    setHistory(prev => prev.filter(h => h.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const formatDate = (datetime: string) => {
    try {
      return new Date(datetime).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return datetime;
    }
  };

  const renderItem = ({ item }: { item: NoorHistoryItem }) => (
    <TouchableOpacity onPress={() => setSelected(item)} activeOpacity={0.75}>
      <SpiritualCard style={styles.card}>
        <View style={styles.cardIcon}>
          <Clock size={18} color={colors.sg.primary} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardQuestion} numberOfLines={2}>{item.question}</Text>
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        </View>
        <ChevronRight size={18} color={colors.sg.outline} />
      </SpiritualCard>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSub}>{history.length} conversation{history.length !== 1 ? 's' : ''}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.sg.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={48} color={colors.sg.outlineVariant} />
              <Text style={styles.emptyText}>No questions asked yet.</Text>
              <Text style={styles.emptyHint}>Ask Noor AI something to get started.</Text>
            </View>
          }
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        <ScreenContainer style={styles.modal}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setSelected(null)} style={styles.modalClose}>
              <X size={22} color={colors.sg.onSurface} />
            </Pressable>
            <Text style={styles.modalTitle}>Noor AI Response</Text>
            <Pressable
              onPress={() => selected && handleDelete(selected.id)}
              style={styles.modalDelete}
            >
              <Trash2 size={20} color={colors.sg.error} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Question */}
            <View style={styles.questionBubble}>
              <Text style={styles.questionLabel}>YOU ASKED</Text>
              <Text style={styles.questionText}>{selected?.question}</Text>
            </View>

            {/* Answer */}
            <SpiritualCard style={styles.answerBubble}>
              <Text style={styles.answerLabel}>NOOR AI</Text>
              <Text style={styles.answerText}>{selected?.answer}</Text>
            </SpiritualCard>

            <Text style={styles.timestampText}>{selected ? formatDate(selected.created_at) : ''}</Text>
          </ScrollView>
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sg.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    padding: spacing.l,
    backgroundColor: colors.sg.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.sg.surfaceContainerHigh,
  },
  headerTitle: { ...typography.sg.headlineLgMobile, fontSize: 28, color: colors.sg.primary },
  headerSub: { ...typography.sg.labelMd, color: colors.sg.outline, marginTop: 2 },

  listContent: { padding: spacing.m, gap: 10 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.sg.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  cardBody: { flex: 1 },
  cardQuestion: { ...typography.sg.bodyMd, color: colors.sg.onSurface, fontWeight: '600' },
  cardDate: { ...typography.sg.labelMd, color: colors.sg.outline, marginTop: 3 },

  emptyContainer: { marginTop: 100, alignItems: 'center', gap: 10 },
  emptyText: { ...typography.sg.bodyLg, fontWeight: '600', color: colors.sg.onSurfaceVariant },
  emptyHint: { ...typography.sg.bodyMd, color: colors.sg.outline },

  // Modal
  modal: { flex: 1, backgroundColor: colors.sg.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sg.surfaceContainerLowest,
    paddingHorizontal: spacing.m,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.sg.surfaceContainerHigh,
  },
  modalClose: { padding: 8 },
  modalTitle: { flex: 1, textAlign: 'center', ...typography.sg.headlineLgMobile, fontSize: 22, color: colors.sg.primary },
  modalDelete: { padding: 8 },

  modalContent: { padding: spacing.l, gap: 16 },

  questionBubble: {
    backgroundColor: colors.sg.primary,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: spacing.m,
    alignSelf: 'flex-end',
    maxWidth: '90%',
  },
  questionLabel: { ...typography.sg.labelMd, color: colors.sg.primaryFixed, letterSpacing: 1, marginBottom: 6 },
  questionText: { ...typography.sg.bodyMd, color: colors.sg.onPrimary, lineHeight: 22 },

  answerBubble: {
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: spacing.m,
    alignSelf: 'flex-start',
    maxWidth: '95%',
  },
  answerLabel: { ...typography.sg.labelMd, color: colors.sg.secondary, letterSpacing: 1, marginBottom: 6 },
  answerText: { ...typography.sg.bodyMd, color: colors.sg.onSurface, lineHeight: 26 },

  timestampText: { ...typography.sg.labelMd, color: colors.sg.outline, textAlign: 'center', marginTop: 8 },
});
