import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Header } from '@/components/ui/Header';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import { Sun, Cloud, Heart, Book, ChevronRight, Plus, X } from 'lucide-react-native';
import { journalService, JournalEntry } from '@/services/journalService';
import { LinearGradient } from 'expo-linear-gradient';

export default function JournalHistoryScreen() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [stats, setStats] = useState({ total: 0, streak: 0 });
    const [isModalVisible, setModalVisible] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('sun');

    const loadData = async () => {
        const fetchedEntries = await journalService.getEntries();
        const fetchedStats = await journalService.getStats();
        setEntries(fetchedEntries);
        setStats(fetchedStats);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSaveNewEntry = async () => {
        if (!newTitle.trim() || !newContent.trim()) return;
        await journalService.saveEntry(newTitle, newContent, selectedIcon);
        setNewTitle('');
        setNewContent('');
        setSelectedIcon('sun');
        setModalVisible(false);
        loadData();
    };

    const getIconComponent = (name: string, color: string) => {
        switch (name) {
            case 'sun': return <Sun size={20} color={color} />;
            case 'cloud': return <Cloud size={20} color={color} />;
            case 'heart': return <Heart size={20} color={color} />;
            default: return <Book size={20} color={color} />;
        }
    };

    const formatDate = (isoString: string) => {
        const d = new Date(isoString);
        return {
            month: d.toLocaleString('en-US', { month: 'short' }),
            day: d.getDate().toString().padStart(2, '0')
        };
    };

    const renderJournalCard = ({ item, index }: { item: JournalEntry, index: number }) => {
        const isPrimary = index % 2 === 1;
        const borderColor = isPrimary ? colors.sg.primary : colors.sg.secondary;
        const iconColor = isPrimary ? colors.sg.primaryContainer : colors.sg.secondary;
        const dateObj = formatDate(item.date);

        return (
            <TouchableOpacity style={[styles.journalCard, { borderLeftColor: borderColor }]} activeOpacity={0.9}>
                <View style={styles.dateCol}>
                    <Text style={styles.dateMonth}>{dateObj.month}</Text>
                    <Text style={[styles.dateDay, { color: isPrimary ? colors.sg.primary : colors.sg.secondary }]}>
                        {dateObj.day}
                    </Text>
                </View>
                
                <View style={styles.contentCol}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        {getIconComponent(item.moodIcon, iconColor)}
                    </View>
                    <Text style={styles.cardExcerpt} numberOfLines={2}>
                        "{item.content}"
                    </Text>
                </View>

                <View style={styles.actionCol}>
                    <View style={styles.chevronBtn}>
                        <ChevronRight size={20} color={colors.sg.primary} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <ScreenContainer style={styles.screen} safe={false}>
            <Header title="Sakina" showBack />
            
            <FlatList
                data={entries}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListHeaderComponent={
                    <View style={styles.headerSection}>
                        <Text style={styles.pageTitle}>Gratitude Journey</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.pill}>
                                <Text style={styles.pillText}>{stats.total} Reflections Logged</Text>
                            </View>
                            <Text style={styles.streakText}>Current Streak: {stats.streak} days</Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Heart size={48} color={colors.sg.surfaceDim} strokeWidth={1} style={{ marginBottom: 16 }} />
                        <Text style={styles.emptyTitle}>No reflections yet</Text>
                        <Text style={styles.emptySub}>Tap the + button to write your first reflection and begin your journey.</Text>
                    </View>
                }
                ListFooterComponent={
                    entries.length > 0 ? (
                        <View style={styles.quoteSection}>
                            <Text style={styles.quoteText}>
                                "He who is grateful, his gratitude is for the good of his own soul."
                            </Text>
                            <Text style={styles.quoteAuthor}>— Luqman 31:12</Text>
                        </View>
                    ) : null
                }
                renderItem={renderJournalCard}
            />

            {/* Floating Action Button */}
            <TouchableOpacity 
                style={styles.fab} 
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[colors.sg.primary, colors.sg.primaryContainer]}
                    style={styles.fabGradient}
                >
                    <Plus size={24} color="white" />
                </LinearGradient>
            </TouchableOpacity>

            {/* New Entry Modal */}
            <Modal visible={isModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Reflection</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color={colors.sg.onSurfaceVariant} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Title</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="e.g. Morning Gratitude"
                            placeholderTextColor={colors.sg.outlineVariant}
                            value={newTitle}
                            onChangeText={setNewTitle}
                        />

                        <Text style={styles.inputLabel}>Mood</Text>
                        <View style={styles.moodRow}>
                            {['sun', 'cloud', 'heart', 'book'].map((mood) => (
                                <TouchableOpacity 
                                    key={mood}
                                    style={[styles.moodBtn, selectedIcon === mood && styles.moodBtnActive]}
                                    onPress={() => setSelectedIcon(mood)}
                                >
                                    {getIconComponent(mood, selectedIcon === mood ? 'white' : colors.sg.primary)}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.inputLabel}>Reflection</Text>
                        <TextInput 
                            style={[styles.input, styles.textArea]} 
                            placeholder="What's on your mind today?"
                            placeholderTextColor={colors.sg.outlineVariant}
                            multiline
                            textAlignVertical="top"
                            value={newContent}
                            onChangeText={setNewContent}
                        />

                        <TouchableOpacity 
                            style={[styles.saveBtn, (!newTitle || !newContent) && styles.saveBtnDisabled]}
                            onPress={handleSaveNewEntry}
                            disabled={!newTitle || !newContent}
                        >
                            <Text style={styles.saveBtnText}>Save Reflection</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    screen: {
        backgroundColor: colors.sg.background,
    },
    listContainer: {
        padding: 24,
        paddingBottom: 120,
    },
    headerSection: {
        marginBottom: 48,
    },
    pageTitle: {
        ...typography.sg.headlineLg,
        color: colors.sg.primary,
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
    },
    pill: {
        backgroundColor: colors.sg.secondaryContainer,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
    },
    pillText: {
        ...typography.sg.labelMd,
        color: colors.sg.onSecondaryContainer,
    },
    streakText: {
        ...typography.sg.labelMd,
        color: colors.sg.onSurfaceVariant,
    },
    journalCard: {
        backgroundColor: colors.sg.surfaceContainerLowest,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        flexDirection: 'row',
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
        elevation: 2,
    },
    dateCol: {
        width: 50,
        justifyContent: 'center',
    },
    dateMonth: {
        ...typography.sg.labelMd,
        color: colors.sg.onSurfaceVariant,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    dateDay: {
        ...typography.sg.headlineLg,
        fontSize: 28,
        marginTop: -4,
    },
    contentCol: {
        flex: 1,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        ...typography.sg.labelMd,
        color: colors.sg.onSurface,
        fontWeight: 'bold',
    },
    cardExcerpt: {
        ...typography.sg.spiritualText,
        fontSize: 16,
        lineHeight: 24,
        color: colors.sg.onSurfaceVariant,
        fontStyle: 'italic',
    },
    actionCol: {
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    chevronBtn: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyTitle: {
        ...typography.sg.bodyLg,
        color: colors.sg.onSurface,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySub: {
        ...typography.sg.bodyMd,
        color: colors.sg.onSurfaceVariant,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    quoteSection: {
        marginTop: 48,
        paddingTop: 32,
        borderTopWidth: 1,
        borderTopColor: colors.sg.outlineVariant + '40',
        alignItems: 'center',
    },
    quoteText: {
        ...typography.sg.spiritualText,
        color: colors.sg.primary,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 8,
    },
    quoteAuthor: {
        ...typography.sg.labelMd,
        color: colors.sg.onSurfaceVariant,
    },
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    fabGradient: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.sg.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 48,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        ...typography.sg.headlineLgMobile,
        color: colors.sg.onSurface,
    },
    inputLabel: {
        ...typography.sg.labelMd,
        color: colors.sg.onSurfaceVariant,
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: colors.sg.surfaceContainerLowest,
        borderRadius: 12,
        padding: 16,
        ...typography.sg.bodyMd,
        color: colors.sg.onSurface,
        borderWidth: 1,
        borderColor: colors.sg.outlineVariant + '40',
    },
    textArea: {
        height: 120,
    },
    moodRow: {
        flexDirection: 'row',
        gap: 12,
    },
    moodBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.sg.surfaceContainerLowest,
        borderWidth: 1,
        borderColor: colors.sg.outlineVariant + '40',
        justifyContent: 'center',
        alignItems: 'center',
    },
    moodBtnActive: {
        backgroundColor: colors.sg.primary,
        borderColor: colors.sg.primary,
    },
    saveBtn: {
        backgroundColor: colors.sg.primary,
        borderRadius: 100,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 32,
    },
    saveBtnDisabled: {
        backgroundColor: colors.sg.outlineVariant,
    },
    saveBtnText: {
        ...typography.sg.labelMd,
        color: 'white',
        fontSize: 16,
    }
});
