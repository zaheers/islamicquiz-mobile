import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/theme/typography';
import { askNoor } from '@/services/noorApi';
import { Sparkles, Sun, Droplets, Cloud, Send, Brain, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// MOODS will be defined inside the component to access dynamic colors
interface Message {
    id: string;
    type: 'ai' | 'user' | 'system';
    text?: string;
    result?: { verses: any[], reflection: string };
    isTyping?: boolean;
}

export default function AskMyDayScreen() {
    const { activeColors, colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    const MOODS = React.useMemo(() => [
        { label: 'Grateful', icon: Sun, color: colors.sg.secondary },
        { label: 'Reflective', icon: Sparkles, color: colors.sg.secondary },
        { label: 'Peaceful', icon: Droplets, color: colors.sg.secondary },
        { label: 'Anxious', icon: Cloud, color: colors.sg.outline }
    ], [colors]);

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', type: 'ai', text: 'Assalamu alaikum. I am your Al-Noor Companion. How has your spiritual journey been today? Feel free to share your thoughts or worries.' }
    ]);
    const [inputText, setInputText] = useState('');
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    const handleSend = async (text: string, mood?: string) => {
        if (!text.trim() && !mood) return;

        const newMessages = [...messages];
        
        if (mood) {
            newMessages.push({ id: Date.now().toString(), type: 'system', text: `You feel ${mood}` });
            setSelectedMood(mood);
        } else {
            newMessages.push({ id: Date.now().toString(), type: 'user', text });
        }

        const typingId = (Date.now() + 1).toString();
        newMessages.push({ id: typingId, type: 'ai', isTyping: true });
        
        setMessages(newMessages);
        setInputText('');
        
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const prompt = mood 
                ? `I am feeling ${mood}. Provide 1-2 relevant Quranic ayat and exactly one short reflective wellness advice for me.`
                : `Here is what's on my mind: ${text}. Provide 1-2 relevant Quranic ayat and exactly one short reflective wellness advice.`;
                
            const data = await askNoor({
                mode: 'ask_my_day',
                topic: mood || 'reflection',
                systemPrompt: prompt
            });
            
            const verses = data.verses || data.answer?.verses || [];
            const reflection = data.reflection || data.answer?.reflection || data.answer || "Reflect deeply on these verses and how they apply to your life.";
            
            setMessages(prev => prev.map(m => m.id === typingId ? { id: typingId, type: 'ai', result: { verses, reflection } } : m));
        } catch (err) {
            setMessages(prev => prev.map(m => m.id === typingId ? { id: typingId, type: 'ai', text: "I'm sorry, I couldn't process that right now. Please try again." } : m));
        }
        
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    return (
        <ScreenContainer style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <ArrowLeft size={24} color={colors.sg.secondary} />
                </TouchableOpacity>
                <View style={styles.headerTitle}>
                    <Sparkles size={20} color={colors.sg.secondary} style={{ marginRight: 8 }} />
                    <Text style={styles.headerText}>Al-Noor</Text>
                </View>
                <View style={styles.placeholder} />
            </View>

            <KeyboardAvoidingView 
                style={styles.keyboardAvoid} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView 
                    ref={scrollViewRef}
                    contentContainerStyle={styles.scrollContent} 
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.introSection}>
                        <Text style={styles.introTitle}>How is your heart today?</Text>
                        <Text style={styles.introSubtitle}>Take a moment with Al-Noor to reflect on your state and find guidance.</Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodGrid}>
                        {MOODS.map(mood => {
                            const isSelected = selectedMood === mood.label;
                            const Icon = mood.icon;
                            return (
                                <TouchableOpacity 
                                    key={mood.label}
                                    style={[styles.moodBtn, isSelected && styles.moodBtnSelected]}
                                    onPress={() => handleSend('', mood.label)}
                                    activeOpacity={0.7}
                                >
                                    <Icon size={24} color={isSelected ? colors.sg.secondary : mood.color} />
                                    <Text style={[styles.moodText, isSelected && styles.moodTextSelected]}>{mood.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <View style={styles.chatContainer}>
                        {messages.map((msg) => (
                            <View key={msg.id} style={[
                                styles.messageRow,
                                msg.type === 'user' ? styles.messageRowUser : 
                                msg.type === 'system' ? styles.messageRowSystem : 
                                styles.messageRowAi
                            ]}>
                                {msg.type === 'ai' && (
                                    <View style={styles.aiAvatar}>
                                        <Brain size={16} color={colors.sg.onPrimaryContainer} />
                                    </View>
                                )}
                                
                                {msg.type === 'system' ? (
                                    <View style={styles.systemBubble}>
                                        <Text style={styles.systemText}>{msg.text}</Text>
                                    </View>
                                ) : msg.type === 'user' ? (
                                    <View style={styles.userBubble}>
                                        <Text style={styles.userText}>{msg.text}</Text>
                                    </View>
                                ) : (
                                    <View style={[styles.aiBubble, msg.result && styles.aiBubbleGlow]}>
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
                                                        <Text style={styles.verseRef}>- Surah {v.surah_name_en || v.surah_name} ({v.surah_number}:{v.ayah_number})</Text>
                                                    </View>
                                                ))}
                                                <View style={styles.adviceBox}>
                                                    <Text style={styles.adviceTitle}>WELLNESS ADVICE</Text>
                                                    <Text style={styles.adviceText}>{msg.result.reflection}</Text>
                                                </View>
                                            </View>
                                        ) : null}
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                </ScrollView>

                <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <View style={{ justifyContent: 'center' }}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Type your thoughts..."
                            placeholderTextColor={colors.sg.outlineVariant}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <TouchableOpacity style={styles.sendBtnInner} onPress={() => handleSend(inputText)} disabled={!inputText.trim()}>
                            <Send size={20} color={colors.sg.onPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScreenContainer>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.sg.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
    iconBtn: { padding: 10, borderRadius: 14 },
    headerTitle: { flexDirection: 'row', alignItems: 'center' },
    headerText: { ...typography.sg.headlineLgMobile, color: colors.sg.secondary },
    placeholder: { width: 44 },
    keyboardAvoid: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
    introSection: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
    introTitle: { ...typography.sg.headlineLg, color: colors.sg.secondary, textAlign: 'center', marginBottom: 8 },
    introSubtitle: { ...typography.sg.bodyMd, color: colors.sg.onSurfaceVariant, textAlign: 'center' },
    moodGrid: { paddingBottom: 10, marginBottom: 20, gap: 12 },
    moodBtn: { alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: colors.sg.surfaceContainerLowest, borderWidth: 2, borderColor: 'transparent', minWidth: 90 },
    moodBtnSelected: { backgroundColor: colors.sg.secondaryContainer, borderColor: colors.sg.secondary },
    moodText: { ...typography.sg.labelMd, marginTop: 8, color: colors.sg.onSurface },
    moodTextSelected: { color: colors.sg.onSecondaryContainer },
    chatContainer: { backgroundColor: colors.sg.surfaceContainerLowest, borderRadius: 24, padding: 20, minHeight: 400, borderTopWidth: 2, borderTopColor: colors.sg.secondary },
    messageRow: { flexDirection: 'row', marginBottom: 20 },
    messageRowUser: { justifyContent: 'flex-end' },
    messageRowAi: { justifyContent: 'flex-start' },
    messageRowSystem: { justifyContent: 'center', marginVertical: 10 },
    aiAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.sg.primaryContainer, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 4 },
    systemBubble: { backgroundColor: colors.sg.surfaceContainerHigh, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    systemText: { ...typography.sg.labelMd, fontSize: 12, color: colors.sg.onSurfaceVariant },
    userBubble: { backgroundColor: colors.sg.primary, padding: 16, borderRadius: 20, borderTopRightRadius: 4, maxWidth: '85%' },
    userText: { ...typography.sg.bodyMd, color: colors.sg.onPrimary },
    aiBubble: { backgroundColor: colors.sg.surfaceContainerLow, padding: 16, borderRadius: 20, borderTopLeftRadius: 4, maxWidth: '85%' },
    aiBubbleGlow: { shadowColor: colors.sg.inversePrimary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    aiText: { ...typography.sg.bodyMd, color: colors.sg.onSurface },
    aiTextItalic: { ...typography.sg.bodyMd, color: colors.sg.onSurfaceVariant, fontStyle: 'italic' },
    verseBox: { marginBottom: 15 },
    verseArabic: { fontFamily: 'KFGQPCHafs', fontSize: 24, color: colors.sg.secondary, textAlign: 'right', marginBottom: 10 },
    verseTranslation: { ...typography.sg.spiritualText, color: colors.sg.secondary, fontStyle: 'italic', marginBottom: 5 },
    verseRef: { ...typography.sg.labelMd, fontSize: 12, color: colors.sg.secondary, textAlign: 'right' },
    adviceBox: { backgroundColor: 'rgba(255,255,255,0.5)', borderLeftWidth: 4, borderLeftColor: colors.sg.secondary, padding: 12, borderTopRightRadius: 8, borderBottomRightRadius: 8 },
    adviceTitle: { ...typography.sg.labelMd, fontSize: 11, color: colors.sg.secondary, marginBottom: 4 },
    adviceText: { ...typography.sg.bodyMd, fontSize: 14, color: colors.sg.onSurfaceVariant, fontStyle: 'italic' },
    inputArea: { paddingHorizontal: 24, paddingTop: 16, backgroundColor: colors.sg.background },
    textInput: { backgroundColor: colors.sg.surfaceContainerHigh, borderRadius: 16, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, paddingRight: 60, minHeight: 50, maxHeight: 100, ...typography.sg.bodyMd, color: colors.sg.onSurface },
    sendBtnInner: { position: 'absolute', right: 12, bottom: 5, width: 40, height: 40, borderRadius: 12, backgroundColor: colors.sg.primary, alignItems: 'center', justifyContent: 'center' }
});
