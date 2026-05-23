import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';

interface ContinueReadingCardProps {
  surahName: string;
  currentAyah: number;
  totalAyahs: number;
  dailyProgress: number;
  dailyGoal: number;
  onPress: () => void;
}

export const ContinueReadingCard: React.FC<ContinueReadingCardProps> = ({
  surahName,
  currentAyah,
  totalAyahs,
  dailyProgress,
  dailyGoal,
  onPress,
}) => {
  const progressPercent = Math.min(100, (currentAyah / (totalAyahs || 1)) * 100);
  
  const getMotivationalMessage = () => {
    if (dailyProgress === 0) return null;
    if (dailyProgress >= dailyGoal) return "Daily goal achieved! Mashallah! 🌟";
    
    const remaining = dailyGoal - dailyProgress;
    if (remaining <= 3) {
      return "You're close to maintaining your streak 🔥";
    }
    return `Just ${remaining} more ayahs to complete today's goal.`;
  };

  const message = getMotivationalMessage();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Continue Reading</Text>
      </View>

      <View style={styles.surahInfo}>
        <Text style={styles.surahName}>{surahName || 'Surah Al-Fatihah'}</Text>
        <Text style={styles.ayahInfo}>Ayah {currentAyah || 0} of {totalAyahs || 7}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.resumeButton} onPress={onPress}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.resumeButtonText}>Resume Reading</Text>
            <ChevronRight size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {message && (
          <Text style={styles.motivationalText}>{message}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f5f5f4',
  },
  header: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#a8a29e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  surahInfo: {
    marginBottom: 8,
  },
  surahName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#292524',
    marginBottom: 2,
  },
  ayahInfo: {
    fontSize: 14,
    color: '#57534e',
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  footer: {
    alignItems: 'center',
  },
  resumeButton: {
    width: '100%',
    marginBottom: 12,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  resumeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  motivationalText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
  },
});
