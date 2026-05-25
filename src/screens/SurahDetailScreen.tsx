import React, { useState, useEffect, useRef } from 'react';

/** Strip HTML tags from transliteration / translation datasets */
const cleanText = (text?: string | null): string => {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')   // remove HTML tags
    .replace(/&[a-z]+;/gi, '') // remove HTML entities
    .replace(/\s+/g, ' ')      // normalize whitespace
    .trim();
};
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft, Play, Pause, BookOpen } from 'lucide-react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { quranService } from '../services/quranService';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/theme/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SpiritualCard } from '@/components/ui/SpiritualCard';

const PAD = (n: number) => n.toString().padStart(3, '0');

export const SurahDetailScreen = ({ route, navigation }: any) => {
    const { activeColors, colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { verse, tafsir } = route.params;

  const [ayahData, setAyahData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Resolve surah and ayah numbers from the verse object
  const surahNumber = Number(
    verse?.surah_number || verse?.number || verse?.surah_id || verse?.surah || verse?.sura || 0
  );
  const ayahNumber = Number(
    verse?.ayah_number || verse?.ayah || verse?.start_ayah || verse?.aya || verse?.numberInSurah || 0
  );

  // Resolve header display name
  const rawName = verse?.surah_name || verse?.name || verse?.surahName || '';
  const cleanName = rawName ? String(rawName).replace(/^surah\s+/i, '').trim() : '';
  const surahDisplayName = cleanName && isNaN(Number(cleanName))
    ? cleanName
    : (surahNumber ? `Surah ${surahNumber}` : 'Surah');

  const tafsirContent = typeof tafsir === 'string' ? tafsir : (tafsir?.content || tafsir?.text || '');

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
    });

    loadAyah();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [surahNumber, ayahNumber]);

  const loadAyah = async () => {
    if (!surahNumber || !ayahNumber) {
      setAyahData({
        arabic: verse?.text || verse?.arabic || '',
        translation: verse?.translation || verse?.text_translation || verse?.content || '',
        transliteration: '',
        audioUrl: '',
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await quranService.getAyah(surahNumber, ayahNumber);
      const audioAyah = ayahNumber === 0 ? 1 : ayahNumber;
      const audioSurah = ayahNumber === 0 ? 1 : surahNumber;
      setAyahData({
        arabic: data.text || '',
        translation: data.translation || '',
        transliteration: data.transliteration || '',
        audioUrl: `https://everyayah.com/data/Alafasy_128kbps/${PAD(audioSurah)}${PAD(audioAyah)}.mp3`,
      });
    } catch (e) {
      setAyahData({
        arabic: verse?.text || verse?.arabic || '',
        translation: verse?.translation || verse?.text_translation || verse?.content || '',
        transliteration: '',
        audioUrl: surahNumber && ayahNumber
          ? `https://everyayah.com/data/Alafasy_128kbps/${PAD(surahNumber)}${PAD(ayahNumber)}.mp3`
          : '',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAudio = async () => {
    if (!ayahData?.audioUrl) return;

    if (isPlaying && soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
      return;
    }

    if (soundRef.current) {
      try {
        setAudioLoading(true);
        await soundRef.current.playAsync();
        setIsPlaying(true);
      } catch {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } finally {
        setAudioLoading(false);
      }
      return;
    }

    setAudioLoading(true);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: ayahData.audioUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying || false);
            if (status.didJustFinish) {
              setIsPlaying(false);
            }
          }
        }
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch (e) {
      console.error('Audio error:', e);
    } finally {
      setAudioLoading(false);
    }
  };

  return (
    <ScreenContainer style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.sg.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{surahDisplayName}</Text>
          <Text style={styles.headerSub}>Verse {ayahNumber}</Text>
        </View>
        <View style={styles.headerRight}>
          <BookOpen size={20} color={colors.sg.secondary} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.sg.primary} />
            <Text style={styles.loadingText}>Loading verse...</Text>
          </View>
        ) : (
          <>
            <View style={styles.labelRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{surahDisplayName} · {ayahNumber}</Text>
              </View>
            </View>

            <SpiritualCard style={styles.verseCard}>
              <View style={styles.cardTopBar} />

              {ayahData?.arabic ? (
                <View style={styles.arabicSection}>
                  <Text style={styles.arabicText} allowFontScaling numberOfLines={0}>
                    {ayahData.arabic}
                  </Text>
                </View>
              ) : null}

              {ayahData?.arabic && (ayahData?.transliteration || ayahData?.translation) ? (
                <View style={styles.divider} />
              ) : null}

              {cleanText(ayahData?.transliteration) ? (
                <Text style={styles.transliterationText} numberOfLines={0}>
                  {cleanText(ayahData.transliteration)}
                </Text>
              ) : null}

              {cleanText(ayahData?.translation) ? (
                <Text style={styles.translationText} numberOfLines={0}>
                  {cleanText(ayahData.translation)}
                </Text>
              ) : null}
            </SpiritualCard>

            {ayahData?.audioUrl ? (
              <TouchableOpacity onPress={toggleAudio} activeOpacity={0.8}>
                <SpiritualCard style={styles.audioRow}>
                  <View style={styles.audioIcon}>
                    {audioLoading
                      ? <ActivityIndicator size="small" color={colors.sg.onPrimary} />
                      : isPlaying
                      ? <Pause size={18} color={colors.sg.onPrimary} fill={colors.sg.onPrimary} />
                      : <Play size={18} color={colors.sg.onPrimary} fill={colors.sg.onPrimary} style={{ marginLeft: 2 }} />
                    }
                  </View>
                  <Text style={styles.audioText}>
                    {audioLoading ? 'Loading recitation...' : isPlaying ? 'Pause Recitation' : 'Play Recitation'}
                  </Text>
                  <Text style={styles.reciterName}>Alafasy</Text>
                </SpiritualCard>
              </TouchableOpacity>
            ) : null}

            {tafsirContent ? (
              <SpiritualCard style={styles.tafsirCard}>
                <View style={styles.tafsirHeader}>
                  <Text style={styles.tafsirLabel}>📖  Tafsir Explanation</Text>
                </View>
                <Text style={styles.tafsirText}>{tafsirContent}</Text>
              </SpiritualCard>
            ) : null}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.sg.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sg.surfaceContainerLowest,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.sg.surfaceContainerHigh,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.sg.surfaceContainerHighest,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.sg.headlineLgMobile,
    fontSize: 22,
    color: colors.sg.primary,
  },
  headerSub: {
    ...typography.sg.labelMd,
    color: colors.sg.secondary,
    marginTop: 2,
  },
  headerRight: {
    padding: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  loadingText: {
    marginTop: 12,
    color: colors.sg.outline,
    ...typography.sg.bodyMd,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: colors.sg.secondaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.sg.secondaryFixed,
  },
  chipText: {
    color: colors.sg.onSecondaryContainer,
    ...typography.sg.labelMd,
    fontSize: 13,
  },
  verseCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardTopBar: {
    height: 4,
    backgroundColor: colors.sg.primary,
  },
  arabicSection: {
    backgroundColor: colors.sg.surfaceContainerHighest,
    padding: 24,
  },
  arabicText: {
    fontSize: 28,
    fontWeight: '500',
    color: colors.sg.onSurface,
    textAlign: 'right',
    lineHeight: 48,
    writingDirection: 'rtl',
    fontFamily: 'KFGQPCHafs',
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.sg.surfaceContainerHigh,
    marginHorizontal: 20,
  },
  transliterationText: {
    ...typography.sg.bodyMd,
    fontStyle: 'italic',
    color: colors.sg.outline,
    textAlign: 'left',
    paddingHorizontal: 20,
    paddingTop: 14,
    flexShrink: 1,
  },
  translationText: {
    ...typography.sg.spiritualText,
    fontSize: 18,
    color: colors.sg.primary,
    textAlign: 'left',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    flexShrink: 1,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  audioIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  audioText: {
    flex: 1,
    ...typography.sg.bodyLg,
    fontWeight: '600',
    color: colors.sg.primary,
  },
  reciterName: {
    ...typography.sg.labelMd,
    color: colors.sg.outline,
    fontStyle: 'italic',
  },
  tafsirCard: {
    padding: 0,
    marginBottom: 20,
  },
  tafsirHeader: {
    backgroundColor: colors.sg.surfaceContainerHighest,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.sg.surfaceContainerHigh,
  },
  tafsirLabel: {
    ...typography.sg.labelMd,
    color: colors.sg.primary,
  },
  tafsirText: {
    ...typography.sg.bodyMd,
    color: colors.sg.onSurface,
    padding: 20,
  },
});
