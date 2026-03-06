import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Stack, useRouter } from 'expo-router';
import { Bookmark, BookOpen, ChevronLeft, History, Languages, Pause, Play, SkipBack, SkipForward, Type } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ayah, quranService, Surah } from '../services/quranService';
import { Bookmark as BookmarkType, HistoryEntry, storageService } from '../services/storageService';

// Safe utility to resolve the active word index based on current playback time
const resolveActiveWordIndex = (segments: number[][], currentTimeMs: number, wordsLength: number): number => {
    if (!segments || segments.length === 0) return -1;

    // Quran.com API format checking: V4 is [word_index, word_position, start_ms, end_ms]
    // V3 fallback format is [word_index, start_ms, end_ms]
    const isV4 = segments[0].length >= 4;
    const posIdx = isV4 ? 1 : 0;
    const startIdx = isV4 ? 2 : 1;

    // Ensure segments are sorted by start time
    const sortedSegments = [...segments].sort((a, b) => a[startIdx] - b[startIdx]);

    let activeWordPos = -1;

    for (const seg of sortedSegments) {
        // Find the latest segment whose start time has passed
        if (currentTimeMs >= seg[startIdx]) {
            // isCurrent expects word.position (1-based), which is seg[1] directly in V4
            activeWordPos = isV4 ? seg[posIdx] : (seg[posIdx] + 1);
        } else {
            // Since sorted, we can break early once we hit a segment in the future
            break;
        }
    }

    return activeWordPos;
};

export default function QuranReciterScreen() {
    const router = useRouter();
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [currentSurah, setCurrentSurah] = useState<Surah | null>(null);
    const [currentAyahNumber, setCurrentAyahNumber] = useState(1);
    const [ayahData, setAyahData] = useState<Ayah | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);
    const [autoNextSurah, setAutoNextSurah] = useState(true);
    const [showSurahList, setShowSurahList] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'surahs' | 'history' | 'bookmarks'>('surahs');
    const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [highlightWords, setHighlightWords] = useState(true);
    const [hideArabic, setHideArabic] = useState(false);
    const [hideTranslation, setHideTranslation] = useState(false);
    const [hideTransliteration, setHideTransliteration] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState<number | null>(null);
    const [hafizLock, setHafizLock] = useState(false);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    const soundRef = useRef<Audio.Sound | null>(null);
    const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const shouldAutoPlayRef = useRef(false);
    const activeWordIndexRef = useRef<number | null>(null);
    const statusUpdateRef = useRef<((status: any) => void) | null>(null);

    // Initialize Data
    useEffect(() => {
        const initData = async () => {
            try {
                const data = await quranService.getSurahs();
                setSurahs(data);

                const savedBookmarks = await storageService.getBookmarks();
                const lastRead = await storageService.getLastRead();
                setBookmarks(savedBookmarks);
                setHistory(await storageService.getHistory());

                const startPoint = savedBookmarks[0] || lastRead;
                if (startPoint) {
                    const surah = data.find(s => s.number === startPoint.surahNumber);
                    if (surah) {
                        setCurrentSurah(surah);
                        setCurrentAyahNumber(startPoint.ayahNumber);
                    } else {
                        setCurrentSurah(data[0]);
                    }
                } else {
                    setCurrentSurah(data[0]);
                }
            } catch (error) {
                console.error('Error fetching surahs:', error);
            }
        };

        initData();
    }, []);

    useEffect(() => {
        if (currentSurah) {
            fetchAyah(currentSurah.number, currentAyahNumber, shouldAutoPlayRef.current);
            shouldAutoPlayRef.current = false;
        }
    }, [currentSurah, currentAyahNumber]);

    useEffect(() => {
        // Configure audio
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
            playThroughEarpieceAndroid: false
        });

        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    const fetchAyah = async (surahNum: number, ayahNum: number, autoStart: boolean = false) => {
        setLoading(true);
        setCurrentWordIndex(null);
        activeWordIndexRef.current = null;
        try {
            const data = await quranService.getAyahWithTranslationAndAudio(surahNum, ayahNum);
            setAyahData(data);
            setIsPlaying(false);

            if (currentSurah) {
                await storageService.saveLastRead({
                    surahNumber: surahNum,
                    ayahNumber: ayahNum,
                    surahName: currentSurah.englishName,
                    timestamp: Date.now()
                });
                setHistory(await storageService.getHistory());
            }

            await loadAudio(data.audio, autoStart);

        } catch (error) {
            console.error('Error fetching ayah:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAudio = async (audioUrl?: string, autoStart: boolean = false) => {
        if (soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current = null;
        }

        if (!audioUrl) return;

        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                { shouldPlay: autoStart, progressUpdateIntervalMillis: 50 },
                (status) => statusUpdateRef.current?.(status)
            );
            soundRef.current = sound;
            if (autoStart) {
                setIsPlaying(true);
            }
        } catch (error) {
            console.error("Failed to load sound:", error);
        }
    };

    const onPlaybackStatusUpdate = (status: any) => {
        if (!status.isLoaded) {
            // @ts-ignore
            if (status.error) console.error(`Audio Error: ${status.error}`);
            return;
        }

        setIsPlaying(prev => prev !== status.isPlaying ? status.isPlaying : prev);

        if (status.didJustFinish) {
            onAudioEnded();
            return;
        }

        // Word Highlighting Logic
        if (highlightWords && ayahData?.segments) {
            const currentTimeMs = status.positionMillis;
            const segments = ayahData.segments;
            const wordsLength = ayahData.words?.length || 0;

            const activeWordPos = resolveActiveWordIndex(segments, currentTimeMs, wordsLength);

            // Only update state if the resolved word is different to prevent re-render storms
            if (activeWordPos !== -1 && activeWordPos !== activeWordIndexRef.current) {
                activeWordIndexRef.current = activeWordPos;
                setCurrentWordIndex(activeWordPos);
            }
        }
    };

    useEffect(() => {
        statusUpdateRef.current = onPlaybackStatusUpdate;
    });

    const togglePlay = async () => {
        if (!soundRef.current) return;
        try {
            if (isPlaying) {
                await soundRef.current.pauseAsync();
            } else {
                await soundRef.current.playAsync();
            }
        } catch (e) {
            console.error("Toggle play error", e);
        }
    };

    const handleNext = () => {
        if (!currentSurah) return;
        if (currentAyahNumber < currentSurah.numberOfAyahs) {
            setCurrentAyahNumber(currentAyahNumber + 1);
        } else {
            const nextSurahIndex = surahs.findIndex(s => s.number === currentSurah.number) + 1;
            if (nextSurahIndex < surahs.length) {
                setCurrentSurah(surahs[nextSurahIndex]);
                setCurrentAyahNumber(1);
            }
        }
    };

    const handlePrevious = () => {
        if (!currentSurah) return;
        if (currentAyahNumber > 1) {
            setCurrentAyahNumber(currentAyahNumber - 1);
        } else {
            const prevSurahIndex = surahs.findIndex(s => s.number === currentSurah.number) - 1;
            if (prevSurahIndex >= 0) {
                const prevSurah = surahs[prevSurahIndex];
                setCurrentSurah(prevSurah);
                setCurrentAyahNumber(prevSurah.numberOfAyahs);
            }
        }
    };

    const onAudioEnded = () => {
        setIsPlaying(false);
        setCurrentWordIndex(null);
        activeWordIndexRef.current = null;
        if (autoPlay) {
            const isLastVerse = currentAyahNumber === currentSurah?.numberOfAyahs;
            if (isLastVerse && !autoNextSurah) return;
            shouldAutoPlayRef.current = true;
            handleNext();
        }
    };

    const handleTooltipTrigger = () => {
        setShowTooltip(true);
        if (tooltipTimerRef.current) {
            clearTimeout(tooltipTimerRef.current);
        }
        tooltipTimerRef.current = setTimeout(() => {
            setShowTooltip(false);
        }, 2500);
    };

    useEffect(() => {
        const initialTimer = setTimeout(() => {
            handleTooltipTrigger();
        }, 1500);

        return () => {
            clearTimeout(initialTimer);
            if (tooltipTimerRef.current) {
                clearTimeout(tooltipTimerRef.current);
            }
        };
    }, []);

    const toggleBookmark = async () => {
        if (!currentSurah || !ayahData) return;
        const isBookmarked = await storageService.isBookmarked(currentSurah.number, currentAyahNumber);

        if (isBookmarked) {
            await storageService.removeBookmark(currentSurah.number, currentAyahNumber);
        } else {
            await storageService.saveBookmark({
                surahNumber: currentSurah.number,
                ayahNumber: currentAyahNumber,
                surahName: currentSurah.englishName,
                previewText: ayahData.text,
                timestamp: Date.now()
            });
        }
        setBookmarks(await storageService.getBookmarks());
    };

    const seekToWord = async (wordPosition: number) => {
        if (!soundRef.current || !ayahData?.segments) return;

        let segment = ayahData.segments.find(seg => seg[0] === wordPosition);
        if (!segment) {
            segment = [...ayahData.segments]
                .filter(s => s[0] <= wordPosition)
                .sort((a, b) => b[0] - a[0])[0];
        }

        if (segment) {
            await soundRef.current.setPositionAsync(segment[1]);
            setCurrentWordIndex(wordPosition);
            if (!isPlaying) {
                await soundRef.current.playAsync();
            }
        }
    };

    const isCurrentAyahBookmarked = currentSurah
        ? bookmarks.some(b => b.surahNumber === currentSurah.number && b.ayahNumber === currentAyahNumber)
        : false;

    const filteredSurahs = surahs.filter(s =>
        s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.number.toString().includes(searchQuery)
    );

    const progressPercent = currentSurah ? (currentAyahNumber / currentSurah.numberOfAyahs) * 100 : 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header Section */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIconButton}>
                    <ChevronLeft size={24} color="#57534e" />
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>
                        {currentSurah?.englishName || 'Loading...'}
                    </Text>
                    <Text style={styles.subtitleText}>
                        Ayah {currentAyahNumber} of {currentSurah?.numberOfAyahs || 0}
                    </Text>
                </View>

                <View style={{ position: 'relative' }}>
                    <TouchableOpacity
                        onPress={() => { setActiveTab('surahs'); setShowSurahList(true); }}
                        onLongPress={handleTooltipTrigger}
                        delayLongPress={400}
                        style={styles.headerIconButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <BookOpen size={20} color="#57534e" />
                    </TouchableOpacity>

                    {showTooltip && (
                        <View style={styles.tooltipContainer}>
                            <Text style={styles.tooltipText}>Browse Quran</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
            </View>

            {/* Content Section */}
            <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.scrollContentLayout} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Loading Verse...</Text>
                    </View>
                ) : (
                    <View style={styles.contentContainer}>
                        {/* Arabic Section */}
                        <View style={[styles.arabicTextContainer, hideArabic ? styles.hiddenText : null]}>
                            {highlightWords && ayahData?.words ? (
                                ayahData.words.map((word) => {
                                    const isCurrent = currentWordIndex === word.position;
                                    return (
                                        <TouchableOpacity
                                            key={word.id}
                                            onPress={() => seekToWord(word.position)}
                                            style={[styles.wordButton, isCurrent ? styles.wordButtonActive : null]}
                                        >
                                            <Text style={[styles.arabicWordText, isCurrent ? styles.arabicWordTextActive : null]}>
                                                {word.text}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                <Text style={styles.arabicFullText}>
                                    {ayahData?.text}
                                </Text>
                            )}
                        </View>

                        {/* Transliteration Section */}
                        {!hideTransliteration && (
                            <View style={styles.transliterationContainer}>
                                {highlightWords && ayahData?.words ? (
                                    <View style={styles.transliterationWordsWrapper}>
                                        {ayahData.words.map((word) => {
                                            if (!word.transliteration) return null;
                                            const isCurrent = currentWordIndex === word.position;
                                            return (
                                                <TouchableOpacity
                                                    key={`trans-${word.id}`}
                                                    onPress={() => seekToWord(word.position)}
                                                >
                                                    <Text style={[
                                                        styles.transliterationText,
                                                        isCurrent ? styles.transliterationTextActive : null,
                                                        { marginRight: 6 } // Space between words
                                                    ]}>
                                                        {word.transliteration}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                ) : (
                                    <Text style={styles.transliterationText}>
                                        {ayahData?.transliteration}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Translation Section */}
                        {!hideTranslation && (
                            <View style={styles.translationContainer}>
                                <Text style={styles.translationText}>
                                    {ayahData?.translation}
                                </Text>
                            </View>
                        )}

                        {/* Extra spacer for dock */}
                        <View style={{ height: 120 }} />
                    </View>
                )}
            </ScrollView>

            {/* Floating Bookmarker */}
            <TouchableOpacity
                onPress={toggleBookmark}
                style={styles.floatingBookmark}
            >
                <Bookmark size={22} color={isCurrentAyahBookmarked ? "#059669" : "#a8a29e"} fill={isCurrentAyahBookmarked ? "#059669" : "none"} />
            </TouchableOpacity>

            {/* Floating Control Dock */}
            <View style={styles.dockWrapper}>
                <View style={styles.dockContainer}>
                    {/* Toggles */}
                    <View style={styles.dockToggles}>
                        <TouchableOpacity style={[styles.dockToggleBtn, !hideArabic && styles.dockToggleBtnActive]} onPress={() => setHideArabic(!hideArabic)}>
                            <BookOpen size={20} color={!hideArabic ? '#059669' : '#a8a29e'} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.dockToggleBtn, !hideTransliteration && styles.dockToggleBtnActive]} onPress={() => setHideTransliteration(!hideTransliteration)}>
                            <Type size={20} color={!hideTransliteration ? '#059669' : '#a8a29e'} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.dockToggleBtn, !hideTranslation && styles.dockToggleBtnActive]} onPress={() => setHideTranslation(!hideTranslation)}>
                            <Languages size={20} color={!hideTranslation ? '#059669' : '#a8a29e'} />
                        </TouchableOpacity>
                    </View>

                    {/* Media Controls */}
                    <View style={styles.dockMediaControls}>
                        <TouchableOpacity style={styles.dockMediaBtn} onPress={handlePrevious}>
                            <SkipBack size={24} color="#57534e" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={togglePlay}
                            disabled={loading}
                            style={styles.dockPlayButton}
                        >
                            {isPlaying ? <Pause size={28} color="white" fill="white" /> : <Play size={28} color="white" fill="white" style={styles.dockPlayIcon} />}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.dockMediaBtn} onPress={handleNext}>
                            <SkipForward size={24} color="#57534e" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Lists Modal */}
            <Modal visible={showSurahList} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSurahList(false)}>
                <SafeAreaView style={styles.surahListSafeArea}>
                    <View style={styles.surahListTabsContainer}>
                        {['surahs', 'bookmarks', 'history'].map(tab => (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => setActiveTab(tab as any)}
                                style={[styles.surahListTab, activeTab === tab ? styles.surahListTabActive : styles.surahListTabInactive]}
                            >
                                <Text style={[styles.surahListTabText, activeTab === tab ? styles.surahListTabTextActive : styles.surahListTabTextInactive]}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.surahListContent}>
                        {activeTab === 'surahs' && (
                            <>
                                <View style={styles.surahListHeader}>
                                    <TextInput
                                        placeholder="Search Surah..."
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        style={styles.surahListSearchInput}
                                        placeholderTextColor="#a8a29e"
                                    />
                                </View>
                                <ScrollView style={styles.surahListContent}>
                                    {filteredSurahs.map(surah => (
                                        <TouchableOpacity
                                            key={surah.number}
                                            onPress={() => { setCurrentSurah(surah); setCurrentAyahNumber(1); setShowSurahList(false); }}
                                            style={styles.surahListItem}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <View style={styles.surahListNumberContainer}>
                                                    <Text style={styles.surahListNumber}>{surah.number}</Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.surahListEnglishName}>{surah.englishName}</Text>
                                                    <Text style={styles.surahListTranslation}>{surah.revelationType}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.surahListArabicName}>{surah.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        )}

                        {activeTab === 'bookmarks' && (
                            <ScrollView style={styles.surahListContent}>
                                {bookmarks.map((entry) => (
                                    <TouchableOpacity
                                        key={`${entry.surahNumber}-${entry.ayahNumber}`}
                                        onPress={() => {
                                            const surah = surahs.find(s => s.number === entry.surahNumber);
                                            if (surah) { setCurrentSurah(surah); setCurrentAyahNumber(entry.ayahNumber); setShowSurahList(false); }
                                        }}
                                        style={styles.surahListItem}
                                    >
                                        <View>
                                            <Text style={{ fontWeight: '600', color: '#047857' }}>{entry.surahName} - Verse {entry.ayahNumber}</Text>
                                            <Text style={{ color: '#78716c', marginTop: 4 }} numberOfLines={1}>{entry.previewText}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {activeTab === 'history' && (
                            <ScrollView style={styles.surahListContent}>
                                {history.map((entry, i) => (
                                    <TouchableOpacity
                                        key={`${entry.surahNumber}-${entry.ayahNumber}-${i}`}
                                        onPress={() => {
                                            const surah = surahs.find(s => s.number === entry.surahNumber);
                                            if (surah) { setCurrentSurah(surah); setCurrentAyahNumber(entry.ayahNumber); setShowSurahList(false); }
                                        }}
                                        style={styles.surahListItem}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <History size={18} color="#059669" style={{ marginRight: 12 }} />
                                            <View>
                                                <Text style={{ fontWeight: '600', color: '#292524' }}>{entry.surahName}</Text>
                                                <Text style={{ fontSize: 10, color: '#a8a29e' }}>Verse {entry.ayahNumber}</Text>
                                            </View>
                                        </View>
                                        <Text style={{ fontSize: 10, color: '#a8a29e', textTransform: 'uppercase' }}>{new Date(entry.timestamp).toLocaleDateString()}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => setShowSurahList(false)}
                        style={{ margin: 16, backgroundColor: '#e5e5e5', padding: 16, borderRadius: 12, alignItems: 'center' }}
                    >
                        <Text style={{ fontWeight: 'bold', color: '#57534e', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12 }}>Close</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFAF9' },

    // Header Structure
    headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#FAFAF9', zIndex: 10 },
    headerIconButton: { padding: 8, borderRadius: 12, backgroundColor: '#f5f5f4' },
    titleContainer: { flex: 1, alignItems: 'center' },
    titleText: { color: '#292524', fontWeight: '800', fontSize: 18, letterSpacing: 0.5 },
    subtitleText: { color: '#a8a29e', fontSize: 13, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },

    // Progress
    progressTrack: { height: 2, backgroundColor: '#f5f5f4', width: '100%' },
    progressBar: { height: 2, backgroundColor: '#059669' },

    // Layout
    scrollViewContainer: { flex: 1 },
    scrollContentLayout: { paddingHorizontal: 24, paddingVertical: 40 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 120 },
    loadingText: { color: '#a8a29e', fontSize: 16 },
    contentContainer: { alignItems: 'center', width: '100%' },

    // Arabic Section (Primary Focus)
    arabicTextContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24, width: '100%' },
    hiddenText: { opacity: 0.1 },
    wordButton: { paddingHorizontal: 4, paddingVertical: 4, borderRadius: 8 },
    wordButtonActive: { backgroundColor: '#d1fae5' },
    arabicWordText: { fontSize: 44, lineHeight: 76, textAlign: 'right', fontWeight: '500', color: '#1c1917' },
    arabicWordTextActive: { color: '#047857' },
    arabicFullText: { fontSize: 44, lineHeight: 76, textAlign: 'center', color: '#1c1917', fontWeight: '500' },

    // Transliteration Section
    transliterationContainer: { width: '100%', marginBottom: 32, paddingHorizontal: 8 },
    transliterationWordsWrapper: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    transliterationText: { color: '#78716c', fontSize: 20, textAlign: 'center', fontWeight: '500', lineHeight: 32 },
    transliterationTextActive: { color: '#047857', fontWeight: '700' },

    // Translation Section
    translationContainer: { width: '100%', marginTop: 8, borderTopWidth: 1, borderTopColor: '#f5f5f4', paddingTop: 32 },
    translationText: { color: '#44403c', fontSize: 18, textAlign: 'left', fontWeight: '400', lineHeight: 30 },

    // Top Right Ribbon
    floatingBookmark: { position: 'absolute', top: 84, right: 24, zIndex: 20, backgroundColor: 'white', padding: 12, borderRadius: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },

    // Tooltip
    tooltipContainer: { position: 'absolute', top: '100%', right: 0, marginTop: 8, backgroundColor: '#f5f5f4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, zIndex: 60, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, minWidth: 105, alignItems: 'center' },
    tooltipText: { color: '#57534e', fontSize: 12, fontWeight: '600', textAlign: 'center' },

    // Bottom Control Dock
    dockWrapper: { position: 'absolute', bottom: 32, width: '100%', alignItems: 'center', zIndex: 50 },
    dockContainer: { width: '92%', backgroundColor: '#ffffff', borderRadius: 28, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 12, borderWidth: 1, borderColor: '#f5f5f4' },

    // Toggles inside Dock
    dockToggles: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    dockToggleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f5f5f4', alignItems: 'center', justifyContent: 'center' },
    dockToggleBtnActive: { backgroundColor: '#d1fae5' },

    // Media Controls inside Dock
    dockMediaControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dockMediaBtn: { padding: 8 },
    dockPlayButton: { width: 56, height: 56, backgroundColor: '#059669', borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#059669', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
    dockPlayIcon: { marginLeft: 4 },

    // Surah List Modal
    surahListSafeArea: { flex: 1, backgroundColor: 'white' },
    surahListHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
    surahListSearchInput: { backgroundColor: '#f5f5f4', padding: 12, borderRadius: 8, fontSize: 16 },
    surahListTabsContainer: { flexDirection: 'row', padding: 16, gap: 8, borderBottomWidth: 1, borderBottomColor: '#e7e5e4' },
    surahListTab: { flex: 1, paddingVertical: 8, borderRadius: 12, marginHorizontal: 4, alignItems: 'center' },
    surahListTabActive: { backgroundColor: '#059669' },
    surahListTabInactive: { backgroundColor: '#f5f5f4' },
    surahListTabText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5 },
    surahListTabTextActive: { color: 'white' },
    surahListTabTextInactive: { color: '#78716c' },
    surahListContent: { flex: 1, padding: 16 },
    surahListItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f4', alignItems: 'center', backgroundColor: '#fafaf9', borderRadius: 16, marginBottom: 8, justifyContent: 'space-between' },
    surahListNumberContainer: { width: 32, height: 32, backgroundColor: '#fff', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#e5e5e5' },
    surahListNumber: { color: '#57534e', fontWeight: 'bold', fontSize: 12 },
    surahListEnglishName: { fontWeight: '600', color: '#292524', fontSize: 16 },
    surahListTranslation: { color: '#a8a29e', fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1.5 },
    surahListArabicName: { color: '#78716c', fontWeight: '600', fontSize: 20 }
});
