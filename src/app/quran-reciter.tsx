import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Stack, useRouter } from 'expo-router';
import { Bookmark, ChevronLeft, Languages, Pause, Play, SkipBack, SkipForward, Type, Settings2, Book, History, Search, X, BookOpen, Brain } from 'lucide-react-native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView, FlingGestureHandler, Directions, State, ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import RenderHTML from 'react-native-render-html';
import { Ayah, quranService, Surah } from '../services/quranService';
import { storageService, Bookmark as BookmarkType, HistoryEntry } from '@/services/storageService';
import { incrementDailyGoal } from '@/features/dailyGoal/useDailyGoal';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/theme/typography';

const { width } = Dimensions.get('window');

const tajweedClassesStyles = {
    'tj-ham_wasl': { color: '#AAAAAA' },
    'tj-ghunnah': { color: '#FF7E00' },
    'tj-idgham_ghunnah': { color: '#169777' },
    'tj-ikhfa': { color: '#9400A1' },
    'tj-qalaqah': { color: '#DD0000' },
    'tj-madd_2': { color: '#537FFF' },
    'tj-madd_246': { color: '#2144C1' },
    'tj-madd_45': { color: '#4050FF' },
    'tj-madd_6': { color: '#000EBC' },
};



export default function QuranReciterScreen() {
    const { activeColors, colors, theme } = useTheme();
    const styles = React.useMemo(() => createStyles(colors, theme), [colors, theme]);

    const tajweedTagsStyles = React.useMemo(() => ({
        span: { 
            fontSize: 38, 
            lineHeight: Platform.OS === 'ios' ? 70 : 85, 
            textAlign: 'center' as const, 
            fontFamily: 'KFGQPCHafs',
            color: colors.sg.onSurface
        }
    }), [colors]);

    const translitTagsStyles = React.useMemo(() => ({
        body: {
            color: colors.sg.onSurfaceVariant,
            fontSize: 16,
            textAlign: 'center' as const,
            lineHeight: 24,
            fontFamily: 'Manrope_400Regular',
        }
    }), [colors]);

    const router = useRouter();
    const [surahs, setSurahs] = useState<Surah[]>([]);
    
    // Core State - Single Source of Truth
    const [currentSurah, setCurrentSurah] = useState<Surah | null>(null);
    const [currentAyahNumber, setCurrentAyahNumber] = useState(1);
    
    // Unified Ayah Data
    const [ayahData, setAyahData] = useState<Ayah | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const [autoPlay, setAutoPlay] = useState(true);
    const [showNavModal, setShowNavModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'surahs' | 'bookmarks' | 'memorizing' | 'history'>('surahs');
    const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
    const [memorizingList, setMemorizingList] = useState<BookmarkType[]>([]);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [hideArabic, setHideArabic] = useState(false);
    const [hideTranslation, setHideTranslation] = useState(false);
    const [hideTransliteration, setHideTransliteration] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState<number | null>(null);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isMemorizing, setIsMemorizing] = useState(false);

    // Audio Buffer System
    const currentSoundRef = useRef<Audio.Sound | null>(null);
    const nextSoundRef = useRef<{ sound: Audio.Sound; url: string } | null>(null);
    const shouldAutoPlayRef = useRef(false);
    const statusUpdateRef = useRef<((status: any) => void) | null>(null);

    const pad = (num: number) => num.toString().padStart(3, '0');

    // Initial Load
    useEffect(() => {
        const initData = async () => {
            try {
                const data = await quranService.getSurahs();
                setSurahs(data || []);
                const lastRead = await storageService.getLastRead();
                
                if (lastRead) {
                    const found = data.find(s => s.number === lastRead.surahNumber);
                    if (found) {
                        setCurrentSurah(found);
                        setCurrentAyahNumber(lastRead.ayahNumber);
                        return;
                    }
                }
                if (data.length > 0) setCurrentSurah(data[0]);
            } catch (e) { console.error("Init data error:", e); }
        };
        initData();
    }, []);

    // Effect triggered by Source of Truth
    useEffect(() => {
        if (currentSurah) {
            loadAyah(currentSurah, currentAyahNumber);
        }
    }, [currentSurah, currentAyahNumber]);

    const loadAyah = async (surah: Surah, ayah: number) => {
        setLoading(true);
        setAyahData(null); 
        setCurrentWordIndex(null);
        try {
            const data = await quranService.getAyahWithTranslationAndAudio(surah.number, ayah);
            setAyahData(data);
            // Track daily reading goal — fire-and-forget, keyed by surah:ayah to prevent duplicates
            incrementDailyGoal(`${surah.number}_${ayah}`).catch(() => {});
            
            await storageService.saveLastRead({
                surahNumber: surah.number, ayahNumber: ayah, surahName: surah.englishName, timestamp: Date.now()
            });
            await refreshUserData();
            
            await setupAudio(data.audio, shouldAutoPlayRef.current);
            shouldAutoPlayRef.current = false;

            // Trigger preload for next ayah
            preloadNextAyah(surah, ayah);
        } catch (e) { console.error("Load ayah error:", e); }
        finally { setLoading(false); }
    };

    const preloadNextAyah = async (surah: Surah, ayah: number) => {
        let nS = surah;
        let nA = ayah + 1;
        
        if (nA > surah.numberOfAyahs) {
            const idx = surahs.findIndex(s => s.number === surah.number) + 1;
            if (idx < surahs.length) {
                nS = surahs[idx];
                // Start next surah at Ayah 0 for Bismillah (if not 9 or 1)
                nA = (nS.number === 9 || nS.number === 1) ? 1 : 0;
            } else return; // No more surahs
        }

        const nextUrl = `https://everyayah.com/data/Alafasy_128kbps/${pad(nS.number)}${pad(nA)}.mp3`;
        
        // Skip if already preloaded
        if (nextSoundRef.current?.url === nextUrl) return;

        // Unload previous buffer
        if (nextSoundRef.current) {
            await nextSoundRef.current.sound.unloadAsync();
            nextSoundRef.current = null;
        }

        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: nextUrl },
                { shouldPlay: false }
            );
            nextSoundRef.current = { sound, url: nextUrl };
            console.log(`[Audio] Preloaded: ${nextUrl}`);
        } catch (e) { console.error("Preload error:", e); }
    };

    const setupAudio = async (url?: string, start: boolean = false) => {
        // Stop and unload current
        if (currentSoundRef.current) {
            await currentSoundRef.current.unloadAsync();
            currentSoundRef.current = null;
        }

        if (!url) return;

        // CHECK BUFFER: If this URL matches our nextSoundRef, PROMOTE it!
        if (nextSoundRef.current?.url === url) {
            console.log(`[Audio] Using preloaded buffer for: ${url}`);
            currentSoundRef.current = nextSoundRef.current.sound;
            nextSoundRef.current = null;
            
            // Set position and callback
            await currentSoundRef.current.setOnPlaybackStatusUpdate((st) => statusUpdateRef.current?.(st));
            if (start) await currentSoundRef.current.playAsync();
            setIsPlaying(start);
            setIsAudioLoading(false);
            return;
        }

        setIsAudioLoading(true);
        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: url }, { shouldPlay: start, progressUpdateIntervalMillis: 50 },
                (st) => {
                    if (st.isLoaded) setIsAudioLoading(false);
                    statusUpdateRef.current?.(st);
                }
            );
            currentSoundRef.current = sound;
            setIsPlaying(start);
        } catch (e) { 
            console.error("Setup audio error:", e);
            setIsAudioLoading(false);
        }
    };

    const refreshUserData = async () => {
        setBookmarks(await storageService.getBookmarks());
        setMemorizingList(await storageService.getMemorizing());
        setHistory(await storageService.getHistory());
        if (currentSurah) {
            setIsBookmarked(await storageService.isBookmarked(currentSurah.number, currentAyahNumber));
            setIsMemorizing(await storageService.isMemorizing(currentSurah.number, currentAyahNumber));
        }
    };

    useEffect(() => {
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false, staysActiveInBackground: true,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix, playsInSilentModeIOS: true,
            shouldDuckAndroid: true, interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
            playThroughEarpieceAndroid: false
        });
        return () => { 
            if (currentSoundRef.current) currentSoundRef.current.unloadAsync();
            if (nextSoundRef.current) nextSoundRef.current.sound.unloadAsync();
        };
    }, []);

    const onPlaybackStatusUpdate = (status: any) => {
        if (!status.isLoaded) return;
        setIsPlaying(status.isPlaying);
        if (ayahData?.words && status.durationMillis) {
            const progress = status.positionMillis / status.durationMillis;
            const wordIdx = ayahData.words.findIndex(w => progress >= w.start && progress < w.end);
            if (wordIdx !== -1 && wordIdx !== currentWordIndex) setCurrentWordIndex(wordIdx);
        }
        if (status.didJustFinish) onAudioEnded();
    };

    useEffect(() => { statusUpdateRef.current = onPlaybackStatusUpdate; });

    const togglePlay = async () => {
        if (!currentSoundRef.current) return;
        try {
            const status = await currentSoundRef.current.getStatusAsync();
            if (!status.isLoaded) return;
            status.isPlaying ? await currentSoundRef.current.pauseAsync() : await currentSoundRef.current.playAsync();
        } catch (e) { console.error(e); }
    };

    const toggleBookmark = async () => {
        if (!currentSurah || !ayahData) return;
        if (isBookmarked) {
            await storageService.removeBookmark(currentSurah.number, currentAyahNumber);
        } else {
            await storageService.saveBookmark({
                surahNumber: currentSurah.number,
                ayahNumber: currentAyahNumber,
                surahName: currentSurah.englishName,
                previewText: ayahData.translation || "",
                timestamp: Date.now()
            });
        }
        await refreshUserData();
    };

    const toggleMemorizing = async () => {
        if (!currentSurah || !ayahData) return;
        if (isMemorizing) {
            await storageService.removeMemorizing(currentSurah.number, currentAyahNumber);
        } else {
            await storageService.saveMemorizing({
                surahNumber: currentSurah.number,
                ayahNumber: currentAyahNumber,
                surahName: currentSurah.englishName,
                previewText: ayahData.translation || "",
                timestamp: Date.now()
            });
        }
        await refreshUserData();
    };

    const handleNext = () => {
        if (!currentSurah) return;
        // If current ayah is 0, next is 1. If current is last, move to next surah.
        if (currentAyahNumber < currentSurah.numberOfAyahs) {
            setCurrentAyahNumber(currentAyahNumber + 1);
        } else {
            const idx = surahs.findIndex(s => s.number === currentSurah.number) + 1;
            if (idx < surahs.length) {
                const nextSurah = surahs[idx];
                setCurrentSurah(nextSurah);
                // Start at Ayah 0 for Bismillah if not Surah 9 or 1, else Ayah 1
                setCurrentAyahNumber((nextSurah.number === 9 || nextSurah.number === 1) ? 1 : 0);
            }
        }
    };

    const handlePrevious = () => {
        if (!currentSurah) return;
        // If not Ayah 0, go to previous ayah
        if (currentAyahNumber > 0) {
            setCurrentAyahNumber(currentAyahNumber - 1);
        } else {
            // If at Ayah 0, move to previous surah's last ayah
            const idx = surahs.findIndex(s => s.number === currentSurah.number) - 1;
            if (idx >= 0) {
                const prevSurah = surahs[idx];
                setCurrentSurah(prevSurah);
                setCurrentAyahNumber(prevSurah.numberOfAyahs); // Go to the last ayah of the previous surah
            }
        }
    };

    const onAudioEnded = () => {
        setIsPlaying(false); setCurrentWordIndex(null);
        if (autoPlay) { shouldAutoPlayRef.current = true; handleNext(); }
    };

    const seekToWord = async (idx: number) => {
        if (!currentSoundRef.current || !ayahData?.words) return;
        try {
            const status = await currentSoundRef.current.getStatusAsync();
            if (status.isLoaded && status.durationMillis) {
                await currentSoundRef.current.setPositionAsync(Math.floor(ayahData.words[idx].start * status.durationMillis));
                if (!isPlaying) await currentSoundRef.current.playAsync();
            }
        } catch (e) { console.error(e); }
    };

    const onFlingLeft = (e: any) => {
        if (e.nativeEvent.state === State.ACTIVE) handleNext();
    };
    const onFlingRight = (e: any) => {
        if (e.nativeEvent.state === State.ACTIVE) handlePrevious();
    };

    const filteredSurahs = surahs.filter(s => 
        s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) || s.number.toString().includes(searchQuery)
    );

    const navigateToAyah = (surahNumber: number, ayahNumber: number) => {
        const found = surahs.find(s => s.number === surahNumber);
        if (found) { setCurrentSurah(found); setCurrentAyahNumber(ayahNumber); setShowNavModal(false); }
    };

    return (
        <GestureHandlerRootView style={styles.root}>
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                <Stack.Screen options={{ headerShown: false }} />
                
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}><ChevronLeft size={24} color={colors.sg.primary} /></TouchableOpacity>
                    <View style={styles.headerTitle}>
                        <Text style={styles.headerSurahName}>{currentSurah?.englishName || 'Loading...'}</Text>
                        <Text style={styles.ayahInfo}> {currentAyahNumber === 0 ? 'Bismillah' : `Ayah ${currentAyahNumber}`} OF {currentSurah?.numberOfAyahs || 114}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowNavModal(true)} style={styles.iconBtn}><Book size={20} color={colors.sg.primary} /></TouchableOpacity>
                </View>

                <View style={styles.progressBarTrack}><View style={[styles.progressBar, { width: `${(Math.max(0, currentAyahNumber) / (currentSurah?.numberOfAyahs || 1)) * 100}%` }]} /></View>

                <FlingGestureHandler direction={Directions.LEFT} onHandlerStateChange={onFlingLeft}>
                    <FlingGestureHandler direction={Directions.RIGHT} onHandlerStateChange={onFlingRight}>
                        <View style={{ flex: 1 }}>
                            <GHScrollView
                                style={styles.container}
                                contentContainerStyle={styles.scrollContent}
                                showsVerticalScrollIndicator={false}
                                removeClippedSubviews={true}
                                nestedScrollEnabled={true}
                                scrollEnabled={true}
                            >
                                {ayahData && ayahData.number === currentAyahNumber ? (
                                    <View style={styles.content}>
                                        <Text style={styles.focusLabel}>Current Reading Focus</Text>
                                        <Text style={styles.focusSurahName}>{currentSurah?.englishName}</Text>
                                        
                                        {!hideArabic && (
                                            <View style={styles.ayahContainer}>
                                                <View style={styles.ayahNumberBadge}>
                                                    <Text style={styles.ayahNumberText}>{currentAyahNumber}</Text>
                                                </View>
                                                <View style={styles.wordsWrapper}>
                                                    {ayahData.words?.map((word: any, i: number) => (
                                                        <TouchableOpacity key={i} onPress={() => seekToWord(i)} style={[styles.wordBtn, currentWordIndex === i && styles.wordHighlight]} activeOpacity={0.7}>
                                                            <RenderHTML contentWidth={width} source={{ html: `<span class="tj">${word.text}</span>` }} tagsStyles={tajweedTagsStyles as any} classesStyles={tajweedClassesStyles as any} />
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            </View>
                                        )}
                                        {!hideTransliteration && ayahData.transliteration ? (
                                            <View style={styles.transliterationBox}>
                                                <RenderHTML contentWidth={width - 48} source={{ html: `<body>${ayahData.transliteration}</body>` }} tagsStyles={translitTagsStyles as any} />
                                            </View>
                                        ) : null}
                                        {!hideTranslation && (
                                            <View style={styles.translationBox}>
                                                <Text style={styles.translation}>"{ayahData.translation}"</Text>
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <View style={styles.loading}>
                                        <ActivityIndicator color={colors.sg.primary} size="large" />
                                        <Text style={styles.loadingText}>Loading Ayah {currentAyahNumber}...</Text>
                                    </View>
                                )}
                            </GHScrollView>
                        </View>
                    </FlingGestureHandler>
                </FlingGestureHandler>

                <TouchableOpacity onPress={toggleBookmark} style={styles.bookmarkFab}>
                    <Bookmark size={24} color={isBookmarked ? colors.sg.secondary : colors.sg.onSurfaceVariant} fill={isBookmarked ? colors.sg.secondary : "none"} />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleMemorizing} style={styles.memorizeFab}>
                    <Brain size={24} color={isMemorizing ? colors.sg.secondary : colors.sg.onSurfaceVariant} />
                </TouchableOpacity>

                <View style={styles.footer} pointerEvents="box-none">
                    <View style={styles.player}>
                        <TouchableOpacity onPress={handlePrevious} style={styles.playerBtn}><SkipBack size={24} color={theme === 'dark' ? colors.sg.onSurface : colors.sg.onPrimary} /></TouchableOpacity>
                        <TouchableOpacity onPress={togglePlay} style={styles.playBtn} disabled={isAudioLoading}>
                            {isAudioLoading ? <ActivityIndicator color={colors.sg.onSecondaryFixed} /> : isPlaying ? <Pause size={28} color={colors.sg.onSecondaryFixed} fill={colors.sg.onSecondaryFixed} /> : <Play size={28} color={colors.sg.onSecondaryFixed} fill={colors.sg.onSecondaryFixed} style={{ marginLeft: 4 }} />}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleNext} style={styles.playerBtn}><SkipForward size={24} color={theme === 'dark' ? colors.sg.onSurface : colors.sg.onPrimary} /></TouchableOpacity>
                    </View>
                    <View style={styles.controls}>
                        <TouchableOpacity onPress={() => setShowNavModal(true)} style={styles.controlBtn}><Book size={20} color={colors.sg.primary} /></TouchableOpacity>
                        <TouchableOpacity onPress={() => setHideArabic(!hideArabic)} style={styles.controlBtn}><Type size={20} color={!hideArabic ? colors.sg.primary : colors.sg.outlineVariant} /></TouchableOpacity>
                        <TouchableOpacity onPress={() => setHideTranslation(!hideTranslation)} style={styles.controlBtn}><Languages size={20} color={!hideTranslation ? colors.sg.primary : colors.sg.outlineVariant} /></TouchableOpacity>
                        <TouchableOpacity onPress={() => {}} style={styles.controlBtn}><Settings2 size={20} color={colors.sg.outlineVariant} /></TouchableOpacity>
                    </View>
                </View>

                {/* Navigation Modal */}
                <Modal visible={showNavModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowNavModal(false)}>
                    <SafeAreaView style={styles.modalRoot}>
                        <View style={styles.tabBar}>
                            {['surahs', 'bookmarks', 'memorizing', 'history'].map((tab) => (
                                <TouchableOpacity key={tab} onPress={() => setActiveTab(tab as any)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
                                    <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {activeTab === 'surahs' && (
                            <View style={styles.searchContainer}>
                                <Search size={20} color={colors.sg.outlineVariant} style={styles.searchIcon} />
                                <TextInput placeholder="Search Surah..." value={searchQuery} onChangeText={setSearchQuery} style={styles.searchInput} placeholderTextColor={colors.sg.outlineVariant} />
                                {searchQuery !== '' && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={20} color={colors.sg.outlineVariant} /></TouchableOpacity>}
                            </View>
                        )}

                        <GHScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 100 }}>
                            {activeTab === 'surahs' ? (
                                filteredSurahs.map(s => (
                                    <TouchableOpacity key={s.number} onPress={() => navigateToAyah(s.number, (s.number === 1 || s.number === 9) ? 1 : 0)} style={styles.card}>
                                        <View style={styles.cardNumContainer}><Text style={styles.cardNum}>{pad(s.number)}</Text></View>
                                        <View style={styles.cardContent}><Text style={styles.cardName}>{s.englishName}</Text><Text style={styles.cardType}>{s.numberOfAyahs} VERSES • {s.revelationType.toUpperCase()}</Text></View>
                                        <Text style={styles.cardArabic}>{s.name}</Text>
                                    </TouchableOpacity>
                                ))
                            ) : activeTab === 'bookmarks' ? (
                                bookmarks.length > 0 ? bookmarks.map((b, i) => (
                                    <TouchableOpacity key={i} onPress={() => navigateToAyah(b.surahNumber, b.ayahNumber)} style={styles.card}>
                                        <View style={styles.cardContent}><Text style={styles.cardName}>{b.surahName} - Verse {b.ayahNumber}</Text><Text style={styles.cardPreview} numberOfLines={1}>{b.previewText}</Text></View>
                                    </TouchableOpacity>
                                )) : <View style={styles.empty}><Text style={styles.emptyText}>No bookmarks yet</Text></View>
                            ) : activeTab === 'memorizing' ? (
                                memorizingList.length > 0 ? memorizingList.map((b, i) => (
                                    <TouchableOpacity key={i} onPress={() => navigateToAyah(b.surahNumber, b.ayahNumber)} style={styles.card}>
                                        <Brain size={20} color={colors.sg.secondary} style={{ marginRight: 15 }} />
                                        <View style={styles.cardContent}><Text style={styles.cardName}>{b.surahName} - Verse {b.ayahNumber}</Text><Text style={styles.cardPreview} numberOfLines={1}>{b.previewText}</Text></View>
                                    </TouchableOpacity>
                                )) : <View style={styles.empty}><Text style={styles.emptyText}>No ayahs marked for memorization</Text></View>
                            ) : (
                                history.length > 0 ? history.map((h, i) => (
                                    <TouchableOpacity key={i} onPress={() => navigateToAyah(h.surahNumber, h.ayahNumber)} style={styles.card}>
                                        <History size={20} color={colors.sg.primary} style={{ marginRight: 15 }} />
                                        <View style={styles.cardContent}><Text style={styles.cardName}>{h.surahName}</Text><Text style={styles.cardType}>Verse {h.ayahNumber}</Text></View>
                                        <Text style={styles.cardDate}>{new Date(h.timestamp).toLocaleDateString()}</Text>
                                    </TouchableOpacity>
                                )) : <View style={styles.empty}><Text style={styles.emptyText}>No history yet</Text></View>
                            )}
                        </GHScrollView>

                        <View style={styles.modalFooter as any}>
                            <TouchableOpacity onPress={() => setShowNavModal(false)} style={styles.closeBtn}><Text style={styles.closeBtnText}>CLOSE SANCTUARY</Text></TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </Modal>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

const createStyles = (colors: any, theme: string) => StyleSheet.create({
    root: { flex: 1 },
    safeArea: { flex: 1, backgroundColor: colors.sg.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, backgroundColor: colors.sg.background },
    iconBtn: { padding: 10, borderRadius: 14, backgroundColor: colors.sg.surfaceContainerHighest },
    headerTitle: { alignItems: 'center', flex: 1 },
    headerSurahName: { ...typography.sg.headlineLgMobile, color: colors.sg.primary },
    ayahInfo: { ...typography.sg.labelMd, color: colors.sg.secondary, marginTop: 2 },
    progressBarTrack: { height: 2, backgroundColor: colors.sg.surfaceContainerHighest },
    progressBar: { height: 2, backgroundColor: colors.sg.secondaryContainer },
    container: { flex: 1, backgroundColor: colors.sg.surfaceContainerLowest, marginHorizontal: 16, marginTop: 16, borderRadius: 24, borderWidth: 1, borderColor: colors.sg.surfaceContainerHigh },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 220 },
    content: { alignItems: 'center', width: '100%', flexShrink: 1 },
    focusLabel: { ...typography.sg.labelMd, color: colors.sg.secondary, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
    focusSurahName: { ...typography.sg.displayLg, color: colors.sg.primary, fontStyle: 'italic', marginBottom: 24 },
    loading: { flexShrink: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    loadingText: { ...typography.sg.labelMd, color: colors.sg.onSurfaceVariant, marginTop: 10 },
    ayahContainer: { width: '100%', marginBottom: 35, alignItems: 'center' },
    ayahNumberBadge: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.sg.secondaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    ayahNumberText: { ...typography.sg.labelMd, color: colors.sg.secondary, fontSize: 12 },
    wordsWrapper: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
    wordBtn: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 10, margin: 2 },
    wordHighlight: { backgroundColor: colors.sg.surfaceContainerHighest },
    transliterationBox: { marginBottom: 25, width: '100%', paddingHorizontal: 10 },
    translationBox: { width: '100%', borderTopWidth: 1, borderTopColor: colors.sg.surfaceContainerHigh, paddingTop: 25, marginTop: 5 },
    translation: { ...typography.sg.spiritualText, color: colors.sg.onSurface, textAlign: 'center', fontStyle: 'italic' },
    bookmarkFab: { position: 'absolute', top: 90, left: 16, zIndex: 10, padding: 10, borderRadius: 25, backgroundColor: colors.sg.surfaceContainerLowest, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    memorizeFab: { position: 'absolute', top: 145, left: 16, zIndex: 10, padding: 10, borderRadius: 25, backgroundColor: colors.sg.surfaceContainerLowest, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    
    footer: { position: 'absolute', bottom: 30, width: '100%', alignItems: 'center' },
    player: { width: '85%', height: 75, backgroundColor: theme === 'dark' ? colors.sg.surfaceContainerHighest : colors.sg.primary, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', elevation: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    playBtn: { width: 58, height: 58, backgroundColor: theme === 'dark' ? colors.sg.primary : colors.sg.secondaryContainer, borderRadius: 29, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    playerBtn: { padding: 15 },
    controls: { flexDirection: 'row', gap: 15, marginTop: 20, backgroundColor: colors.sg.surfaceContainerLowest, padding: 10, borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, borderWidth: 1, borderColor: colors.sg.surfaceContainerHigh },
    controlBtn: { padding: 10, borderRadius: 20 },

    modalRoot: { flex: 1, backgroundColor: colors.sg.background },
    tabBar: { flexDirection: 'row', padding: 20, justifyContent: 'space-between', gap: 10 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.sg.surfaceContainer, alignItems: 'center' },
    tabActive: { backgroundColor: colors.sg.primary },
    tabText: { ...typography.sg.labelMd, fontSize: 10, color: colors.sg.onSurfaceVariant },
    tabTextActive: { color: colors.sg.onPrimary },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.sg.surfaceContainerLowest, marginHorizontal: 20, marginBottom: 15, paddingHorizontal: 15, borderRadius: 15, borderWidth: 1, borderColor: colors.sg.outlineVariant },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, height: 50, ...typography.sg.bodyMd, color: colors.sg.onSurface },
    list: { flex: 1, paddingHorizontal: 20 },
    card: { flexDirection: 'row', padding: 18, marginBottom: 12, borderRadius: 16, backgroundColor: colors.sg.surfaceContainerLowest, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: colors.sg.surfaceContainerHigh },
    cardNumContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.sg.surfaceContainer, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    cardNum: { ...typography.sg.spiritualText, color: colors.sg.primary },
    cardContent: { flex: 1 },
    cardName: { ...typography.sg.labelMd, fontSize: 16, color: colors.sg.onSurface },
    cardType: { ...typography.sg.labelMd, fontSize: 10, color: colors.sg.onSurfaceVariant, marginTop: 2 },
    cardArabic: { fontSize: 24, color: colors.sg.primary, fontFamily: 'KFGQPCHafs' },
    cardPreview: { ...typography.sg.bodyMd, fontSize: 13, color: colors.sg.onSurfaceVariant, marginTop: 4 },
    cardDate: { ...typography.sg.labelMd, fontSize: 11, color: colors.sg.onSurfaceVariant },
    empty: { alignItems: 'center', marginTop: 50 },
    emptyText: { ...typography.sg.bodyMd, color: colors.sg.onSurfaceVariant },
    modalFooter: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: colors.sg.background + 'E6' },
    closeBtn: { padding: 16, backgroundColor: colors.sg.primary, borderRadius: 15, alignItems: 'center' },
    closeBtnText: { ...typography.sg.labelMd, color: colors.sg.onPrimary }
});
