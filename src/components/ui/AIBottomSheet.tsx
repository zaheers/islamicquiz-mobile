import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Keyboard, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetView, BottomSheetFooter } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { askNoor } from '@/services/noorApi';
import { Send, ArrowLeft, MoreVertical, Sparkles, PlusCircle, Sun } from 'lucide-react-native';

interface Message {
    id: string;
    type: 'ai' | 'user' | 'system';
    text?: string;
    result?: { verses: any[], reflection: string };
    isTyping?: boolean;
}

interface AIBottomSheetProps {
    bottomSheetRef: React.RefObject<BottomSheet>;
    initialPrompt?: string;
    topic?: string;
}

export function AIBottomSheet({ bottomSheetRef, initialPrompt, topic }: AIBottomSheetProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['95%'], []); 
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');

    useEffect(() => {
        if (initialPrompt && topic) {
            handleInitialPrompt(initialPrompt, topic);
        }
    }, [initialPrompt, topic]);

    const handleInitialPrompt = async (prompt: string, topicLabel: string) => {
        setMessages([
            { id: Date.now().toString(), type: 'system', text: `You feel ${prompt}` },
            { id: (Date.now() + 1).toString(), type: 'ai', isTyping: true }
        ]);

        try {
            const systemPrompt = `I am feeling ${prompt}. Act as a therapeutic Islamic companion using the 'Sakina Method'. Structure your exact response in 3 short stages: 1. Validate Context (1 sentence), 2. Reveal Revelation (1 short Quranic ayah), 3. Prescribe Action (1 actionable sentence). Keep token length strictly under 80 words to prevent UI clipping.`;
            const data = await askNoor({
                mode: 'ask_my_day',
                topic: topicLabel,
                systemPrompt: systemPrompt
            });
            
            const verses = data.verses || data.answer?.verses || [];
            const reflection = data.reflection || data.answer?.reflection || data.answer || "Reflect deeply on these verses and how they apply to your life.";
            
            setMessages(prev => prev.map(m => m.isTyping ? { id: m.id, type: 'ai', result: { verses, reflection } } : m));
        } catch (err) {
            setMessages(prev => prev.map(m => m.isTyping ? { id: m.id, type: 'ai', text: "I'm sorry, I couldn't process that right now. Please try again." } : m));
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const text = inputText;
        const newMessages = [...messages, { id: Date.now().toString(), type: 'user', text }];
        const typingId = (Date.now() + 1).toString();
        newMessages.push({ id: typingId, type: 'ai', isTyping: true });
        
        setMessages(newMessages);
        setInputText('');
        Keyboard.dismiss();

        try {
            const prompt = `Here is what's on my mind: ${text}. Act as a therapeutic Islamic companion using the 'Sakina Method'. Structure your exact response in 3 short stages: 1. Validate Context (1 sentence), 2. Reveal Revelation (1 short Quranic ayah), 3. Prescribe Action (1 actionable sentence). Keep token length strictly under 80 words to prevent UI clipping.`;
            const data = await askNoor({
                mode: 'ask_my_day',
                topic: topic || 'reflection',
                systemPrompt: prompt
            });
            
            const verses = data.verses || data.answer?.verses || [];
            const reflection = data.reflection || data.answer?.reflection || data.answer || "Reflect deeply on these verses and how they apply to your life.";
            
            setMessages(prev => prev.map(m => m.id === typingId ? { id: typingId, type: 'ai', result: { verses, reflection } } : m));
        } catch (err) {
            setMessages(prev => prev.map(m => m.id === typingId ? { id: typingId, type: 'ai', text: "I'm sorry, I couldn't process that right now. Please try again." } : m));
        }
    };

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                opacity={0.3}
                style={props.style}
            />
        ),
        []
    );

    const bottomPadding = Math.max(insets.bottom + (Platform.OS === 'android' ? 48 : 0), 40);

    const baseChips = [
        "Show me a Dua for peace",
        "Quranic verses on patience",
        "Short Surah for commute"
    ];
    
    const hasAiResponse = messages.some(m => m.type === 'ai' && m.result);
    const suggestionChips = hasAiResponse ? ["✨ Wrap up my reflection", ...baseChips] : baseChips;

    const handleWrapUp = () => {
        bottomSheetRef.current?.close();
        const lastAiMsg = [...messages].reverse().find(m => m.type === 'ai' && m.result);
        if (lastAiMsg && lastAiMsg.result) {
            const verse = lastAiMsg.result.verses?.[0];
            router.push({
                pathname: '/reflection-summary',
                params: {
                    verseText: verse?.text || '',
                    verseRef: verse ? `Surah ${verse.surah} (${verse.surah}:${verse.ayah})` : '',
                    aiInsight: lastAiMsg.result.reflection || ''
                }
            });
        } else {
            router.push('/reflection-summary');
        }
    };



    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            backdropComponent={renderBackdrop}
            backgroundStyle={styles.sheetBackground}
            handleIndicatorStyle={styles.indicator}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
        >
            <View style={{ flex: 1 }}>
                <BottomSheetView style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => bottomSheetRef.current?.close()} style={styles.headerBtn}>
                        <ArrowLeft size={24} color={colors.sg.onSurfaceVariant} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Deep Reflection</Text>
                        <View style={styles.listeningStatus}>
                            <View style={styles.pulsingDot} />
                            <Text style={styles.listeningText}>Al-Noor AI is listening</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.headerBtn}>
                        <MoreVertical size={24} color={colors.sg.onSurfaceVariant} />
                    </TouchableOpacity>
                </BottomSheetView>
                
                <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.chatContainer}>
                    {messages.map((msg) => (
                        <View key={msg.id} style={styles.messageWrapper}>
                            {msg.type === 'system' && (
                                <View style={styles.systemBubble}>
                                    <Text style={styles.systemText}>{msg.text}</Text>
                                </View>
                            )}

                            {msg.type === 'user' && (
                                <View style={styles.userContainer}>
                                    <View style={styles.userBubble}>
                                        <Text style={styles.userText}>{msg.text}</Text>
                                    </View>
                                    <Text style={styles.timestampText}>SENT JUST NOW</Text>
                                </View>
                            )}

                            {msg.type === 'ai' && (
                                <View style={styles.aiContainer}>
                                    <View style={styles.aiHeader}>
                                        <View style={styles.aiAvatar}>
                                            <Sparkles size={16} color={colors.sg.onPrimary} />
                                        </View>
                                        <Text style={styles.aiHeaderTitle}>Al-Noor Guidance</Text>
                                    </View>
                                    
                                    <View style={styles.aiBubble}>
                                        {msg.isTyping ? (
                                            <Text style={styles.aiTextItalic}>Finding words of Noor for you...</Text>
                                        ) : msg.text ? (
                                            <Text style={styles.aiText}>{msg.text}</Text>
                                        ) : msg.result ? (
                                            <View>
                                                {msg.result.verses && msg.result.verses.map((v: any, i: number) => (
                                                    <View key={i} style={styles.verseBox}>
                                                        {v.arabic_text && <Text style={styles.verseArabic}>{v.arabic_text}</Text>}
                                                        <Text style={styles.verseTranslation}>"{v.translation || v.text}"</Text>
                                                        <Text style={styles.verseRef}>- Surah {v.surah_name_en || v.surah_name || v.surah} ({v.surah_number || v.surah}:{v.ayah_number || v.ayah})</Text>
                                                    </View>
                                                ))}
                                                
                                                <View style={styles.adviceSection}>
                                                    <Text style={styles.adviceSectionTitle}>Spiritual Intentions for You:</Text>
                                                    
                                                    <View style={styles.bentoCard}>
                                                        <Sun size={20} color={colors.sg.secondary} style={{ marginRight: 12 }} />
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={styles.bentoTitle}>Sakina Insight</Text>
                                                            <Text style={styles.bentoText}>{msg.result.reflection}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                                
                                                <Text style={[styles.aiText, { marginTop: 16 }]}>
                                                    Would you like a specific Dua for tranquility, or perhaps we can look at a short Surah to recite?
                                                </Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    <Text style={styles.timestampTextAi}>REFLECTED JUST NOW</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </BottomSheetScrollView>
            </View>
            
            <View style={[styles.footerContainer, { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.sg.surface, paddingBottom: bottomPadding }]}>
                {/* Suggestion Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll} style={styles.chipWrapper}>
                    {suggestionChips.map((chip, i) => (
                        <TouchableOpacity 
                            key={i} 
                            style={[styles.suggestionChip, chip.startsWith('✨') && { backgroundColor: colors.sg.primaryContainer }]} 
                            onPress={() => {
                                if (chip.startsWith('✨')) {
                                    handleWrapUp();
                                } else {
                                    setInputText(chip);
                                }
                            }}
                        >
                            <Text style={[styles.suggestionText, chip.startsWith('✨') && { color: colors.sg.onPrimaryContainer, fontWeight: 'bold' }]}>{chip}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                
                {/* Input Area */}
                <View style={styles.inputRow}>
                    <TouchableOpacity style={styles.plusBtn}>
                        <PlusCircle size={28} color={colors.sg.secondary} />
                    </TouchableOpacity>
                    <View style={styles.inputBox}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Share your thoughts..."
                            placeholderTextColor={colors.sg.outline}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                    </View>
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!inputText.trim()}>
                        <Send size={20} color={colors.sg.onPrimary} />
                    </TouchableOpacity>
                </View>
            </View>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    sheetBackground: { backgroundColor: colors.sg.surface, borderRadius: 32 },
    indicator: { backgroundColor: colors.sg.outlineVariant, width: 48, height: 6, marginTop: 4 },
    
    headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.sg.surfaceVariant },
    headerBtn: { padding: 8, borderRadius: 20 },
    headerCenter: { alignItems: 'center' },
    headerTitle: { ...typography.sg.headlineLgMobile, color: colors.sg.primary, fontSize: 22, fontWeight: 'bold' },
    listeningStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    pulsingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.sg.secondary }, 
    listeningText: { ...typography.sg.labelMd, fontSize: 10, color: colors.sg.secondary, textTransform: 'uppercase', letterSpacing: 1 },
    
    scrollContent: { padding: 24, paddingBottom: 160 },
    chatContainer: { flex: 1 },
    messageWrapper: { marginBottom: 24 },
    
    systemBubble: { alignSelf: 'center', backgroundColor: colors.sg.surfaceContainerHigh, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    systemText: { ...typography.sg.labelMd, color: colors.sg.onSurfaceVariant },
    
    userContainer: { alignItems: 'flex-end' },
    userBubble: { backgroundColor: colors.sg.surfaceContainerHigh, paddingHorizontal: 20, paddingVertical: 16, borderRadius: 24, borderTopRightRadius: 4, maxWidth: '85%' },
    userText: { ...typography.sg.bodyMd, color: colors.sg.onSurface },
    
    aiContainer: { alignItems: 'flex-start' },
    aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    aiAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.sg.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    aiHeaderTitle: { ...typography.sg.labelMd, color: colors.sg.primary, textTransform: 'uppercase', letterSpacing: 1 },
    
    aiBubble: { backgroundColor: colors.sg.surfaceContainerLowest, borderLeftWidth: 4, borderLeftColor: colors.sg.secondary, padding: 24, borderRadius: 24, borderTopLeftRadius: 4, maxWidth: '95%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    aiText: { ...typography.sg.bodyLg, color: colors.sg.onSurface, lineHeight: 28 },
    aiTextItalic: { ...typography.sg.bodyMd, color: colors.sg.onSurfaceVariant, fontStyle: 'italic' },
    
    verseBox: { marginBottom: 24 },
    verseArabic: { fontFamily: 'KFGQPCHafs', fontSize: 24, color: colors.sg.primary, textAlign: 'right', marginBottom: 10, lineHeight: 38 },
    verseTranslation: { ...typography.sg.spiritualText, color: colors.sg.primary, fontStyle: 'italic', marginBottom: 8, lineHeight: 28 },
    verseRef: { ...typography.sg.labelMd, fontSize: 12, color: colors.sg.secondary, textAlign: 'right' },
    
    adviceSection: { marginTop: 16 },
    adviceSectionTitle: { ...typography.sg.labelMd, color: colors.sg.primary, borderBottomWidth: 1, borderBottomColor: colors.sg.surfaceVariant, paddingBottom: 8, marginBottom: 16 },
    bentoCard: { backgroundColor: colors.sg.surfaceContainerLow, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    bentoTitle: { ...typography.sg.labelMd, color: colors.sg.primary, fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
    bentoText: { ...typography.sg.bodyMd, fontSize: 13, color: colors.sg.onSurfaceVariant },
    
    timestampText: { fontSize: 10, color: colors.sg.onSurfaceVariant, marginTop: 6, marginRight: 8, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 },
    timestampTextAi: { fontSize: 10, color: colors.sg.onSurfaceVariant, marginTop: 6, marginLeft: 40, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 },
    
    footerContainer: { backgroundColor: colors.sg.surface, borderTopWidth: 1, borderTopColor: colors.sg.surfaceVariant, paddingTop: 12 },
    chipWrapper: { marginBottom: 12, maxHeight: 40 },
    chipScroll: { paddingHorizontal: 24, gap: 8 },
    suggestionChip: { backgroundColor: colors.sg.surfaceContainerHighest, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    suggestionText: { ...typography.sg.labelMd, color: colors.sg.primary, fontSize: 13 },
    
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 24, gap: 12, paddingBottom: 12 },
    plusBtn: { paddingBottom: 10 },
    inputBox: { flex: 1, backgroundColor: colors.sg.surfaceContainerLow, borderRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, minHeight: 48, maxHeight: 120, justifyContent: 'center' },
    textInput: { ...typography.sg.bodyMd, color: colors.sg.onSurface, padding: 0, margin: 0 },
    sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.sg.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }
});
