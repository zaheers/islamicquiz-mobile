import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Clock, ChevronRight, X, Trash2 } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useFocusEffect } from '@react-navigation/native';
import {
  NoorHistoryItem,
  loadNoorHistory,
  deleteNoorHistoryItem,
} from '../services/noorHistoryService';

export const HistoryScreen = ({ navigation }: any) => {
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
    <TouchableOpacity style={styles.card} onPress={() => setSelected(item)} activeOpacity={0.75}>
      <View style={styles.cardIcon}>
        <Clock size={18} color={colors.primary} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardQuestion} numberOfLines={2}>{item.question}</Text>
        <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
      </View>
      <ChevronRight size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSub}>{history.length} conversation{history.length !== 1 ? 's' : ''}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={48} color={colors.border} />
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
        <SafeAreaView style={styles.modal}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setSelected(null)} style={styles.modalClose}>
              <X size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.modalTitle}>Noor AI Response</Text>
            <Pressable
              onPress={() => selected && handleDelete(selected.id)}
              style={styles.modalDelete}
            >
              <Trash2 size={20} color={colors.error} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Question */}
            <View style={styles.questionBubble}>
              <Text style={styles.questionLabel}>YOU ASKED</Text>
              <Text style={styles.questionText}>{selected?.question}</Text>
            </View>

            {/* Answer */}
            <View style={styles.answerBubble}>
              <Text style={styles.answerLabel}>NOOR AI</Text>
              <Text style={styles.answerText}>{selected?.answer}</Text>
            </View>

            <Text style={styles.timestampText}>{selected ? formatDate(selected.created_at) : ''}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    padding: spacing.l,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.h1, color: colors.text },
  headerSub: { ...typography.body, color: colors.textSecondary, marginTop: 2 },

  listContent: { padding: spacing.m, gap: 10 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.m,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  cardBody: { flex: 1 },
  cardQuestion: { ...typography.body, color: colors.text, fontWeight: '600' },
  cardDate: { ...typography.label, color: colors.textSecondary, marginTop: 3 },

  emptyContainer: { marginTop: 100, alignItems: 'center', gap: 10 },
  emptyText: { ...typography.h3, color: colors.textSecondary },
  emptyHint: { ...typography.body, color: colors.textSecondary },

  // Modal
  modal: { flex: 1, backgroundColor: '#F3F4F6' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.m,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalClose: { padding: 8 },
  modalTitle: { flex: 1, textAlign: 'center', ...typography.h3, color: colors.text },
  modalDelete: { padding: 8 },

  modalContent: { padding: spacing.l, gap: 16 },

  questionBubble: {
    backgroundColor: colors.primaryDark,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: spacing.m,
    alignSelf: 'flex-end',
    maxWidth: '90%',
  },
  questionLabel: { fontSize: 10, fontWeight: '700', color: colors.primaryLight, letterSpacing: 1, marginBottom: 6 },
  questionText: { ...typography.body, color: '#fff', lineHeight: 22 },

  answerBubble: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: spacing.m,
    alignSelf: 'flex-start',
    maxWidth: '95%',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  answerLabel: { fontSize: 10, fontWeight: '700', color: colors.primary, letterSpacing: 1, marginBottom: 6 },
  answerText: { ...typography.body, color: colors.textBody, lineHeight: 26 },

  timestampText: { ...typography.label, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
