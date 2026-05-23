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
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ChevronLeft, Play, Pause, BookOpen } from 'lucide-react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { quranService } from '../services/quranService';

const PAD = (n: number) => n.toString().padStart(3, '0');

export const SurahDetailScreen = ({ route, navigation }: any) => {
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
      // Fallback: use what's in the verse object
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
      // Graceful fallback
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

    // Load fresh
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
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#1A3D2F" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{surahDisplayName}</Text>
          <Text style={styles.headerSub}>Verse {ayahNumber}</Text>
        </View>
        <View style={styles.headerRight}>
          <BookOpen size={20} color="#059669" />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Loading verse...</Text>
          </View>
        ) : (
          <>
            {/* Surah label chip */}
            <View style={styles.labelRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{surahDisplayName} · {ayahNumber}</Text>
              </View>
            </View>

            {/* Verse Card */}
            <View style={styles.verseCard}>
              {/* Decorative top bar */}
              <View style={styles.cardTopBar} />

              {/* Arabic Text */}
              {ayahData?.arabic ? (
                <View style={styles.arabicSection}>
                  <Text style={styles.arabicText} allowFontScaling numberOfLines={0}>
                    {ayahData.arabic}
                  </Text>
                </View>
              ) : null}

              {/* Divider */}
              {ayahData?.arabic && (ayahData?.transliteration || ayahData?.translation) ? (
                <View style={styles.divider} />
              ) : null}

              {/* Transliteration */}
              {cleanText(ayahData?.transliteration) ? (
                <Text style={styles.transliterationText} numberOfLines={0}>
                  {cleanText(ayahData.transliteration)}
                </Text>
              ) : null}

              {/* Translation */}
              {cleanText(ayahData?.translation) ? (
                <Text style={styles.translationText} numberOfLines={0}>
                  {cleanText(ayahData.translation)}
                </Text>
              ) : null}
            </View>

            {/* Audio Row */}
            {ayahData?.audioUrl ? (
              <TouchableOpacity style={styles.audioRow} onPress={toggleAudio} activeOpacity={0.8}>
                <View style={styles.audioIcon}>
                  {audioLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : isPlaying
                    ? <Pause size={18} color="#fff" fill="#fff" />
                    : <Play size={18} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
                  }
                </View>
                <Text style={styles.audioText}>
                  {audioLoading ? 'Loading recitation...' : isPlaying ? 'Pause Recitation' : 'Play Recitation'}
                </Text>
                <Text style={styles.reciterName}>Alafasy</Text>
              </TouchableOpacity>
            ) : null}

            {/* Tafsir Section */}
            {tafsirContent ? (
              <View style={styles.tafsirCard}>
                <View style={styles.tafsirHeader}>
                  <Text style={styles.tafsirLabel}>📖  Tafsir Explanation</Text>
                </View>
                <Text style={styles.tafsirText}>{tafsirContent}</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3D2F',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.5,
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
    color: '#6B7280',
    fontSize: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  chipText: {
    color: '#065F46',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  verseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 16,
  },
  cardTopBar: {
    height: 4,
    backgroundColor: '#059669',
  },
  arabicSection: {
    backgroundColor: '#F0FDF4',
    padding: 24,
  },
  arabicText: {
    fontSize: 28,
    fontWeight: '500',
    color: '#1A3D2F',
    textAlign: 'right',
    lineHeight: 48,
    writingDirection: 'rtl',
    fontFamily: 'KFGQPCHafs',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  transliterationText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#6B7280',
    textAlign: 'left',
    paddingHorizontal: 20,
    paddingTop: 14,
    lineHeight: 26,
    fontFamily: 'NotoSans',
    flexShrink: 1,
  },
  translationText: {
    fontSize: 18,
    color: '#2F4F4F',
    textAlign: 'left',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    lineHeight: 30,
    fontFamily: 'RobotoSerif',
    letterSpacing: 0.2,
    flexShrink: 1,
  },

  // Audio Row
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  audioIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  audioText: {
    flex: 1,
    fontSize: 15,
    color: '#1A3D2F',
    fontWeight: '600',
  },
  reciterName: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },

  // Tafsir Card
  tafsirCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  tafsirHeader: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  tafsirLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.4,
  },
  tafsirText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 26,
    padding: 20,
  },
});
