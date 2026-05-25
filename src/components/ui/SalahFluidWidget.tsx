import React from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/theme/typography';
import { usePrayerTimes } from '@/features/salah/usePrayerTimes';
import { PRAYER_DISPLAY } from '@/services/salahRepository';

const { width } = Dimensions.get('window');
const WIDGET_WIDTH = width - 48; // padding 24 on each side

// A tiny sine wave component for the non-active prayers
const MiniWave = ({ color }: { color: string }) => (
  <Svg width="24" height="8" viewBox="0 0 24 8" fill="none">
    <Path
      d="M1 4C4 4 6 1 9 1C12 1 12 7 15 7C18 7 20 4 23 4"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.5}
    />
  </Svg>
);

export function SalahFluidWidget({ onPress }: { onPress?: () => void }) {
  const { activeColors, theme } = useTheme();
  const colors = { sg: activeColors };
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { prayers, nextPrayer, loading } = usePrayerTimes();
  const router = useRouter();

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.sg.primary} />
      </View>
    );
  }

  // If we can't find times, just show a fallback to configure location
  if (!prayers.length || !nextPrayer) {
    return (
      <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={() => router.push('/salah-settings' as any)}>
        <LinearGradient
          colors={[colors.sg.primaryContainer, colors.sg.primary]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ ...typography.sg.headlineMd, color: '#fff', marginBottom: 8 }}>Setup Prayer Times</Text>
          <Text style={{ ...typography.sg.bodyMd, color: 'rgba(255,255,255,0.7)' }}>Tap to configure your location</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const nextDisplay = PRAYER_DISPLAY[nextPrayer.name];
  
  const gradientColors = (theme === 'dark' 
    ? ['#1B4D3E', '#2E5A44'] 
    : [colors.sg.primaryContainer, colors.sg.primary]) as [string, string];

  const curveColor = theme === 'dark' ? '#2E5A44' : colors.sg.primary;

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={onPress}>
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* The Curved Horizon Separator */}
      <View style={styles.curveContainer}>
        <Svg width={WIDGET_WIDTH} height="40" viewBox={`0 0 ${WIDGET_WIDTH} 40`} fill="none">
          <Path
            d={`M0 20 Q ${WIDGET_WIDTH / 2} 40 ${WIDGET_WIDTH} 20 L ${WIDGET_WIDTH} 40 L 0 40 Z`}
            fill={curveColor}
            opacity={0.6}
          />
        </Svg>
      </View>

      {/* Top Section: Next Prayer */}
      <View style={styles.topSection}>
        <Text style={styles.topPrayerName}>{nextDisplay.label}</Text>
        <Text style={styles.topEmoji}>{nextDisplay.emoji}</Text>
        <Text style={styles.topPrayerTime}>{nextPrayer.formattedTime}</Text>
      </View>

      {/* Bottom Section: 5 Prayers */}
      <View style={styles.bottomSection}>
        {prayers.map((prayer) => {
          const display = PRAYER_DISPLAY[prayer.name];
          const isCurrent = prayer.isCurrent;

          return (
            <View key={prayer.name} style={styles.prayerColumn}>
              <Text style={[styles.bottomPrayerName, isCurrent && styles.activeText]}>
                {display.label}
              </Text>

              <View style={styles.indicatorContainer}>
                {isCurrent ? (
                  <Text style={styles.kaabaIcon}>🕋</Text>
                ) : (
                  <MiniWave color={colors.sg.onPrimary} />
                )}
              </View>

              <Text style={[styles.bottomPrayerTime, isCurrent && styles.activeText]}>
                {prayer.formattedTime}
              </Text>

              {/* Orange Underline for Current */}
              {isCurrent && <View style={styles.activeUnderline} />}
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    width: '100%',
    height: 160,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 48,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  curveContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
  },
  topSection: {
    height: 85,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 2,
  },
  topPrayerName: {
    ...typography.sg.headlineMd,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  topEmoji: {
    fontSize: 20,
  },
  topPrayerTime: {
    ...typography.sg.headlineMd,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  bottomSection: {
    height: 75,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 2,
    marginTop: 5, // Pushes it down into the darker curved area
  },
  prayerColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  bottomPrayerName: {
    ...typography.sg.labelMd,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  indicatorContainer: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  kaabaIcon: {
    fontSize: 16,
  },
  bottomPrayerTime: {
    ...typography.sg.labelMd,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  activeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: -8,
    width: 20,
    height: 2,
    backgroundColor: '#F59E0B', // Premium gold/orange
    borderRadius: 2,
  },
});
