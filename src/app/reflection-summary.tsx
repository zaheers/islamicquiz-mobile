import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Share, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { journalService } from '@/services/journalService';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/theme/typography';
import { ArrowLeft, Edit3, Heart, Share2, Headphones, Edit } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ReflectionSummaryScreen() {
    const { activeColors, colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { verseText, verseRef, aiInsight } = useLocalSearchParams<{ verseText: string, verseRef: string, aiInsight: string }>();
    const [journalEntry, setJournalEntry] = useState('');
    const [journalSaved, setJournalSaved] = useState(false);
    const [blessingLogged, setBlessingLogged] = useState(false);
    const [sound, setSound] = useState<Audio.Sound>();
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        return sound
            ? () => {
                  sound.unloadAsync();
              }
            : undefined;
    }, [sound]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Reflecting on this Noor AI Insight:\n\n${aiInsight || verseText}`
            });
        } catch (error) {
            console.log(error);
        }
    };

    const handleSaveEntry = async () => {
        if (!journalEntry.trim()) return;
        try {
            await journalService.saveEntry('Reflection', journalEntry.trim(), 'book');
            setJournalSaved(true);
            setJournalEntry('');
            setTimeout(() => setJournalSaved(false), 3000);
        } catch (e) {
            console.error('Failed to save to journalService:', e);
        }
    };

    const handleLogBlessing = async () => {
        if (blessingLogged) return;
        try {
            await journalService.saveEntry('Blessing Logged', 'I logged a blessing today.', 'heart');
            setBlessingLogged(true);
            setTimeout(() => setBlessingLogged(false), 3000);
        } catch (e) {
            console.error('Failed to save to journalService:', e);
        }
    };

    const handlePlaySurah = async () => {
        if (isPlaying && sound) {
            await sound.pauseAsync();
            setIsPlaying(false);
            return;
        }

        try {
            if (sound) {
                await sound.playAsync();
                setIsPlaying(true);
            } else {
                // Surah Ar-Rahman recitation by Mishary Rashid Alafasy
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: 'https://server8.mp3quran.net/afs/055.mp3' },
                    { shouldPlay: true }
                );
                setSound(newSound);
                setIsPlaying(true);
                
                newSound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        setIsPlaying(false);
                    }
                });
            }
        } catch (error) {
            Alert.alert('Error', 'Could not play the Surah at this time.');
        }
    };

    const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Background elements */}
            <View style={styles.bgBlobTop} />
            <View style={styles.bgBlobBottom} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <ArrowLeft size={24} color={colors.sg.onSurfaceVariant} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Al-Noor</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
                
                {/* Main Quranic Verse Card */}
                {verseText ? (
                    <View style={styles.verseCard}>
                        <Text style={styles.verseRefLabel}>{verseRef || 'SURAH'}</Text>
                        <Text style={[styles.verseArabic, !isArabic(verseText) && { fontFamily: 'Libre Caslon Text', fontSize: 24 }]}>
                            {verseText}
                        </Text>
                        <View style={styles.divider} />
                        {isArabic(verseText) ? (
                            <Text style={styles.verseTranslation}>"{verseText}"</Text>
                        ) : null}
                    </View>
                ) : null}

                {/* AI Insight Section */}
                {aiInsight ? (
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Heart size={20} color={colors.sg.primary} />
                            <Text style={styles.sectionTitle}>AI Insight</Text>
                        </View>
                        <View style={styles.insightBox}>
                            <Text style={styles.insightText}>{aiInsight}</Text>
                        </View>
                    </View>
                ) : null}

                {/* My Gratitude Journal */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Edit3 size={20} color={colors.sg.primary} />
                        <Text style={styles.sectionTitle}>My Gratitude Journal</Text>
                    </View>
                    <View style={styles.journalBox}>
                        <TextInput
                            style={styles.journalInput}
                            placeholder="What are you grateful for today?"
                            placeholderTextColor={colors.sg.outlineVariant}
                            multiline
                            textAlignVertical="top"
                            value={journalEntry}
                            onChangeText={setJournalEntry}
                        />
                        <View style={styles.saveBtnContainer}>
                            <TouchableOpacity 
                                style={[styles.saveBtn, journalSaved && { backgroundColor: colors.sg.primaryContainer }]} 
                                onPress={handleSaveEntry}
                                disabled={journalSaved}
                            >
                                <Text style={[styles.saveBtnText, journalSaved && { color: colors.sg.onPrimaryContainer }]}>
                                    {journalSaved ? 'Saved!' : 'Save Entry'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Suggested Actions */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.suggestedActionsTitle}>Suggested Actions</Text>
                    
                    <TouchableOpacity 
                        style={[styles.actionCard, blessingLogged && { borderColor: colors.sg.primary }]} 
                        onPress={handleLogBlessing}
                        disabled={blessingLogged}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconBox, { backgroundColor: blessingLogged ? colors.sg.primaryContainer : colors.sg.secondaryContainer + '40' }]}>
                                <Edit size={24} color={blessingLogged ? colors.sg.primary : colors.sg.secondary} />
                            </View>
                            <Text style={styles.actionText}>{blessingLogged ? 'Blessing Logged!' : 'Log a Blessing'}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={handlePlaySurah}>
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.sg.primaryFixed + '60' }]}>
                                <Headphones size={24} color={colors.sg.primary} />
                            </View>
                            <Text style={styles.actionText}>{isPlaying ? 'Pause Surah Ar-Rahman' : 'Listen to Surah Ar-Rahman'}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={handleShare}>
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.sg.tertiaryFixed }]}>
                                <Share2 size={24} color={colors.sg.tertiary} />
                            </View>
                            <Text style={styles.actionText}>Share with a Friend</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.sg.background,
    },
    bgBlobTop: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: colors.sg.primaryFixedDim,
        opacity: 0.4,
        top: -50,
        left: -100,
    },
    bgBlobBottom: {
        position: 'absolute',
        width: 350,
        height: 350,
        borderRadius: 175,
        backgroundColor: colors.sg.secondaryFixed,
        opacity: 0.2,
        bottom: -50,
        right: -100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    headerBtn: {
        padding: 8,
    },
    headerTitle: {
        ...typography.sg.headlineLgMobile,
        color: colors.sg.primary,
        fontWeight: 'bold',
        fontSize: 24,
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.sg.outlineVariant,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    scrollContent: {
        padding: 24,
        paddingTop: 16,
    },
    verseCard: {
        backgroundColor: colors.sg.surfaceContainerLowest,
        borderRadius: 32,
        padding: 32,
        borderTopWidth: 2,
        borderTopColor: colors.sg.secondary,
        alignItems: 'center',
        marginBottom: 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
        elevation: 3,
    },
    verseRefLabel: {
        color: colors.sg.secondary,
        ...typography.sg.labelMd,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 24,
    },
    verseArabic: {
        fontFamily: 'KFGQPCHafs',
        fontSize: 32,
        color: colors.sg.primary,
        textAlign: 'center',
        lineHeight: 48,
    },
    divider: {
        width: 48,
        height: 1,
        backgroundColor: colors.sg.secondary,
        opacity: 0.3,
        marginVertical: 24,
    },
    verseTranslation: {
        ...typography.sg.spiritualText,
        color: colors.sg.onSurfaceVariant,
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 32,
    },
    sectionContainer: {
        marginBottom: 48,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        ...typography.sg.labelMd,
        color: colors.sg.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    insightBox: {
        backgroundColor: colors.sg.primary + '0D', // 5% opacity
        borderRadius: 16,
        padding: 24,
        borderLeftWidth: 2,
        borderLeftColor: colors.sg.primary,
    },
    insightText: {
        ...typography.sg.bodyLg,
        color: colors.sg.onSurface,
        lineHeight: 28,
    },
    journalBox: {
        backgroundColor: colors.sg.surfaceContainerLow,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: colors.sg.outlineVariant + '4D', // 30% opacity
    },
    journalInput: {
        ...typography.sg.spiritualText,
        fontSize: 18,
        color: colors.sg.onSurfaceVariant,
        height: 120,
        marginBottom: 16,
    },
    saveBtnContainer: {
        alignItems: 'flex-end',
    },
    saveBtn: {
        backgroundColor: colors.sg.primary,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 24,
    },
    saveBtnText: {
        ...typography.sg.labelMd,
        color: colors.sg.onPrimary,
    },
    suggestedActionsTitle: {
        ...typography.sg.labelMd,
        color: colors.sg.onSurfaceVariant,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 24,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.sg.surfaceContainerLowest,
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.sg.outlineVariant + '4D',
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        ...typography.sg.bodyMd,
        fontWeight: '600',
        color: colors.sg.primary,
    }
});
