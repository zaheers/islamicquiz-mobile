import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Header } from '@/components/ui/Header';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { askNoor, NoorAnswer } from '@/services/noorApi';
import { reflectionRepository } from '@/services/reflectionRepository';
import { HelpCircle, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const TOPICS = [
    "Anxiety",
    "Work Stress",
    "Laziness in Salah",
    "Family Issues",
    "Feeling Lost",
    "Gratitude"
];

export default function AskMyDayScreen() {
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [detail, setDetail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ verses: any[], reflection: string } | null>(null);
    const [reflectionNote, setReflectionNote] = useState('');
    const [isSavingReflection, setIsSavingReflection] = useState(false);
    const [reflectionSaved, setReflectionSaved] = useState(false);

    const handleTopicSelect = (topic: string) => {
        setSelectedTopic(topic);
    };

    const handleGetGuidance = async () => {
        if (!selectedTopic) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const prompt = detail 
                ? `I am experiencing ${selectedTopic}. Here is some context: ${detail}. Provide 1-2 relevant Quranic ayat and exactly one short reflective question for me to think about. Return JSON with fields "verses" and "reflection".`
                : `I am experiencing ${selectedTopic}. Provide 1-2 relevant Quranic ayat and exactly one short reflective question for me to think about. Return JSON with fields "verses" and "reflection".`;
                
            const data = await askNoor({
                mode: 'ask_my_day',
                topic: selectedTopic,
                systemPrompt: prompt
            });
            
            // data could be {"verses": [...], "reflection": "..."}
            // we will handle if it's nested or direct
            const verses = data.verses || data.answer?.verses || [];
            const reflection = data.reflection || data.answer?.reflection || data.answer || "Reflect deeply on these verses and how they apply to your life.";
            
            setResult({ verses, reflection });
        } catch (err) {
            console.error(err);
            setError("I'm sorry, I couldn't process your request at this time. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    const resetSelection = () => {
        setSelectedTopic(null);
        setDetail('');
        setError(null);
        setResult(null);
        setReflectionNote('');
        setReflectionSaved(false);
    };

    const handleSaveReflection = async () => {
        if (!reflectionNote.trim() || !selectedTopic || !result) return;
        setIsSavingReflection(true);
        try {
            await reflectionRepository.saveReflection(selectedTopic, result.verses, reflectionNote.trim());
            setReflectionSaved(true);
            setReflectionNote('');
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingReflection(false);
        }
    };

    return (
        <ScreenContainer style={styles.container}>
            <Header title="Ask About My Day" showBack />
            
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {!loading && !result && (
                    <View style={styles.introSection}>
                        <HelpCircle size={48} color={colors.primary} style={styles.introIcon} />
                        <Text style={styles.introTitle}>How are you feeling today?</Text>
                        <Text style={styles.introSubtitle}>Select a topic below, and Noor AI will provide relevant Quranic guidance and a short reflection for your situation.</Text>
                        
                        <View style={styles.topicsGrid}>
                            {TOPICS.map((topic) => {
                                const isSelected = selectedTopic === topic;
                                return (
                                    <TouchableOpacity 
                                        key={topic} 
                                        style={[styles.topicChip, isSelected && styles.topicChipSelected]}
                                        onPress={() => handleTopicSelect(topic)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.topicChipText, isSelected && styles.topicChipTextSelected]}>{topic}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        
                        <View style={styles.detailContainer}>
                            <Text style={styles.detailLabel}>Add more about your situation (optional)</Text>
                            <TextInput
                                style={styles.detailInput}
                                placeholder="E.g. deadlines at work, argument with family, missing Fajr..."
                                placeholderTextColor="#94a3b8"
                                value={detail}
                                onChangeText={setDetail}
                                multiline
                                numberOfLines={2}
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.getGuidanceBtn, !selectedTopic && styles.getGuidanceBtnDisabled]} 
                            onPress={handleGetGuidance}
                            disabled={!selectedTopic}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.getGuidanceBtnText}>Get guidance</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {loading && (
                    <View style={styles.loadingSection}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Reflecting on "{selectedTopic}"...</Text>
                        <Text style={styles.loadingSubtext}>Finding the perfect verses for you</Text>
                    </View>
                )}

                {error && !loading && (
                    <View style={styles.errorSection}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={handleGetGuidance}>
                            <Text style={styles.retryBtnText}>Try again</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {result && !loading && !error && (
                    <View style={styles.resultSection}>
                        <View style={styles.topicHeader}>
                            <Text style={styles.topicHeaderLabel}>Topic</Text>
                            <Text style={styles.topicHeaderText}>{selectedTopic}</Text>
                        </View>

                        {result.verses && result.verses.length > 0 && (
                            <View style={styles.versesContainer}>
                                {result.verses.map((verse: any, index) => (
                                    <View key={index} style={styles.verseCard}>
                                        <Text style={styles.verseTranslation}>{verse.text || verse.translation}</Text>
                                        {(verse.arabic_text || verse.arabic) && (
                                            <Text style={styles.verseArabic}>{verse.arabic_text || verse.arabic}</Text>
                                        )}
                                        <View style={styles.verseReference}>
                                            <Text style={styles.verseReferenceText}>
                                                Surah {verse.surah_name_en || verse.surah_name || verse.surah} ({verse.surah_number || verse.surah}:{verse.ayah_number || verse.ayah})
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {result.reflection && (
                            <LinearGradient
                                colors={['#f0fdf4', '#dcfce7']}
                                style={styles.reflectionCard}
                            >
                                <Text style={styles.reflectionTitle}>AI Reflection</Text>
                                <Text style={styles.reflectionText}>{result.reflection}</Text>
                            </LinearGradient>
                        )}

                        <View style={styles.userReflectionSection}>
                            <Text style={styles.detailLabel}>Write one thought about this (optional)</Text>
                            {reflectionSaved ? (
                                <View style={styles.savedBanner}>
                                    <CheckCircle2 size={20} color="#15803d" />
                                    <Text style={styles.savedBannerText}>Saved to your weekly reflections</Text>
                                </View>
                            ) : (
                                <>
                                    <TextInput
                                        style={styles.detailInput}
                                        placeholder="What does this mean to you right now?"
                                        placeholderTextColor="#94a3b8"
                                        value={reflectionNote}
                                        onChangeText={setReflectionNote}
                                        multiline
                                        numberOfLines={3}
                                    />
                                    <TouchableOpacity 
                                        style={[styles.saveBtn, (!reflectionNote.trim() || isSavingReflection) && styles.saveBtnDisabled]}
                                        onPress={handleSaveReflection}
                                        disabled={!reflectionNote.trim() || isSavingReflection}
                                        activeOpacity={0.8}
                                    >
                                        {isSavingReflection ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <Text style={styles.saveBtnText}>Save Reflection</Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                        <TouchableOpacity 
                            style={styles.resetBtn} 
                            onPress={resetSelection}
                            activeOpacity={0.8}
                        >
                            <RefreshCw color="#64748b" size={20} />
                            <Text style={styles.resetBtnText}>Ask about another topic</Text>
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        padding: spacing.l,
        paddingBottom: spacing.xxl * 2,
    },
    introSection: {
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    introIcon: {
        marginBottom: 16,
    },
    introTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    introSubtitle: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        paddingHorizontal: 16,
    },
    topicsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    topicChip: {
        backgroundColor: '#ffffff',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    topicChipSelected: {
        backgroundColor: '#f0fdf4',
        borderColor: '#16a34a',
    },
    topicChipText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
    },
    topicChipTextSelected: {
        color: '#15803d',
    },
    detailContainer: {
        width: '100%',
        marginTop: 32,
        marginBottom: 24,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    detailInput: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: '#334155',
        minHeight: 80,
        textAlignVertical: 'top',
    },
    getGuidanceBtn: {
        backgroundColor: colors.primary,
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    getGuidanceBtnDisabled: {
        backgroundColor: '#cbd5e1',
        shadowOpacity: 0,
        elevation: 0,
    },
    getGuidanceBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    errorSection: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        padding: 24,
        backgroundColor: '#fef2f2',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    errorText: {
        color: '#b91c1c',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 16,
    },
    retryBtn: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    retryBtnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    loadingSection: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginTop: 24,
        marginBottom: 8,
    },
    loadingSubtext: {
        fontSize: 14,
        color: '#64748b',
    },
    resultSection: {
        marginTop: spacing.m,
    },
    topicHeader: {
        backgroundColor: '#e2e8f0',
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    topicHeaderLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    topicHeaderText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
    },
    versesContainer: {
        marginBottom: 24,
    },
    verseCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    verseArabic: {
        fontSize: 26,
        lineHeight: 44,
        textAlign: 'center',
        fontFamily: 'KFGQPCHafs',
        color: '#0f172a',
        marginBottom: 16,
    },
    verseTranslation: {
        fontSize: 16,
        lineHeight: 26,
        color: '#475569',
        textAlign: 'center',
        marginBottom: 16,
    },
    verseReference: {
        alignItems: 'center',
    },
    verseReferenceText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    reflectionCard: {
        padding: 24,
        borderRadius: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    reflectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#166534',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    reflectionText: {
        fontSize: 16,
        lineHeight: 26,
        color: '#15803d',
        fontStyle: 'italic',
        fontWeight: '500',
    },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        gap: 8,
    },
    resetBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#475569',
    },
    userReflectionSection: {
        marginBottom: 32,
    },
    saveBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    saveBtnDisabled: {
        backgroundColor: '#cbd5e1',
    },
    saveBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    savedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        gap: 8,
    },
    savedBannerText: {
        color: '#15803d',
        fontWeight: '600',
        fontSize: 15,
    }
});
