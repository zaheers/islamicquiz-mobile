import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import {
  BookOpen,
  Headphones,
  MessageCircle,
  Share2,
  Star,
} from 'lucide-react-native';
import React, { memo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DailyAyah } from './ayahService';

interface Props {
  ayah: DailyAyah;
  reflection: string | null;
  isReflectionLoading: boolean;
  onAskNoor: (ayah: DailyAyah) => void;
  onReadContext: (ayah: DailyAyah) => void;
}

export const AyahOfDayCard = memo(({
  ayah,
  reflection,
  isReflectionLoading,
  onAskNoor,
  onReadContext,
}: Props) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Ayah of the Day\n\n"${ayah.translation_text}"\n\nSurah ${ayah.surah_name} ${ayah.surah_id}:${ayah.ayah_number}\n\nShared from the Al-Noor Quran App`,
      });
    } catch { /* ignore */ }
  };

  const toggleAudio = async () => {
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
        return;
      } catch {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } finally {
        setAudioLoading(false);
      }
    }

    setAudioLoading(true);
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri: ayah.audio_url },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying || false);
            if (status.didJustFinish) {
              setIsPlaying(false);
              soundRef.current?.unloadAsync();
              soundRef.current = null;
            }
          }
        }
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch (e) {
      console.error('[AyahOfDay] Audio error:', e);
    } finally {
      setAudioLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Star size={12} color="#059669" fill="#059669" />
          <Text style={styles.badgeText}>Ayah of the Day</Text>
        </View>
        <Text style={styles.ref}>{ayah.surah_name} {ayah.surah_id}:{ayah.ayah_number}</Text>
      </View>

      {/* Arabic text */}
      <Text style={styles.arabic}>{ayah.arabic_text}</Text>

      {/* Translation */}
      <Text style={styles.translation}>{ayah.translation_text}</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Noor Reflection */}
      <View style={styles.reflectionRow}>
        <MessageCircle size={14} color="#059669" style={{ marginRight: 6 }} />
        <Text style={styles.reflectionLabel}>Noor Reflection</Text>
      </View>
      {isReflectionLoading ? (
        <View style={styles.reflectionLoading}>
          <ActivityIndicator size="small" color="#059669" />
          <Text style={styles.reflectionLoadingText}>Generating reflection…</Text>
        </View>
      ) : reflection ? (
        <Text style={styles.reflectionText}>{reflection}</Text>
      ) : (
        <Text style={styles.reflectionText} />
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={toggleAudio} activeOpacity={0.75}>
          {audioLoading
            ? <ActivityIndicator size="small" color="#059669" />
            : <Headphones size={16} color="#059669" />}
          <Text style={styles.actionText}>{isPlaying ? 'Pause' : 'Listen'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onAskNoor(ayah)} activeOpacity={0.75}>
          <MessageCircle size={16} color="#059669" />
          <Text style={styles.actionText}>Ask Noor</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onReadContext(ayah)} activeOpacity={0.75}>
          <BookOpen size={16} color="#059669" />
          <Text style={styles.actionText}>Read</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.75}>
          <Share2 size={16} color="#059669" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

AyahOfDayCard.displayName = 'AyahOfDayCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ref: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a8a29e',
    letterSpacing: 0.3,
  },
  arabic: {
    fontSize: 26,
    color: '#1A3D2F',
    textAlign: 'right',
    lineHeight: 46,
    fontFamily: 'KFGQPCHafs',
    marginBottom: 10,
  },
  translation: {
    fontSize: 15,
    color: '#44403c',
    lineHeight: 24,
    fontFamily: 'RobotoSerif',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0FDF4',
    marginBottom: 12,
  },
  reflectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reflectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reflectionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  reflectionLoadingText: {
    fontSize: 13,
    color: '#a8a29e',
    fontStyle: 'italic',
  },
  reflectionText: {
    fontSize: 14,
    color: '#57534e',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f4',
    paddingTop: 12,
    gap: 4,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
});
