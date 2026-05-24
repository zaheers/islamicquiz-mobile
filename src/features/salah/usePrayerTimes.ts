import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { Coordinates, PrayerTimes } from 'adhan';
import { PrayerName } from '@/services/salahRepository';
import { salahSettingsService } from '@/services/salahSettingsService';

export interface DailyPrayer {
  name: PrayerName;
  label: string;
  time: Date;
  isNext: boolean;
  isCurrent: boolean;
  formattedTime: string;
}

export function usePrayerTimes() {
  const [prayers, setPrayers] = useState<DailyPrayer[]>([]);
  const [nextPrayer, setNextPrayer] = useState<DailyPrayer | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

    const fetchTimes = async () => {
      try {
        const settings = await salahSettingsService.getSettings();
        let coords: Coordinates | null = null;

        if (settings.locationType === 'manual' && settings.latitude && settings.longitude) {
          coords = new Coordinates(settings.latitude, settings.longitude);
        } else {
          // GPS Flow
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            // Fallback to cached coords if available
            if (settings.latitude && settings.longitude) {
              coords = new Coordinates(settings.latitude, settings.longitude);
            } else {
              if (mounted) setLoading(false);
              return;
            }
          } else {
            let loc = await Location.getLastKnownPositionAsync();
            if (!loc) {
              loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
            }
            if (loc) {
              coords = new Coordinates(loc.coords.latitude, loc.coords.longitude);
              // Optimistically cache it
              salahSettingsService.saveSettings({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            }
          }
        }

        if (!coords || !mounted) return;

        const params = salahSettingsService.getAdhanCalculationMethod(settings.calculationMethod);
        const now = new Date();
        const pt = new PrayerTimes(coords, now, params);

        const list = [
          { name: 'fajr' as PrayerName, label: 'Fajr', time: pt.fajr },
          { name: 'dhuhr' as PrayerName, label: 'Dhuhr', time: pt.dhuhr },
          { name: 'asr' as PrayerName, label: 'Asr', time: pt.asr },
          { name: 'maghrib' as PrayerName, label: 'Maghrib', time: pt.maghrib },
          { name: 'isha' as PrayerName, label: 'Isha', time: pt.isha },
        ];

        // Format times and determine next
        const formatOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: false };
        let nextP: DailyPrayer | null = null;
        let foundNext = false;

        const mapped: DailyPrayer[] = list.map((p, index) => {
          const isPast = now > p.time;
          const isNext = !isPast && !foundNext;
          if (isNext) foundNext = true;

          const dp: DailyPrayer = {
            ...p,
            isNext,
            isCurrent: false, // We'll compute this next
            formattedTime: p.time.toLocaleTimeString([], formatOptions),
          };

          if (isNext) nextP = dp;
          return dp;
        });

        // If all are past, next is tomorrow's Fajr
        if (!nextP) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tmrwPt = new PrayerTimes(coords, tomorrow, params);
            
            nextP = {
                name: 'fajr',
                label: 'Fajr',
                time: tmrwPt.fajr,
                isNext: true,
                isCurrent: false,
                formattedTime: tmrwPt.fajr.toLocaleTimeString([], formatOptions),
            };
            mapped[4].isCurrent = true; // Isha is current
        } else {
            // Find current (the one immediately preceding next)
            const nextIdx = mapped.findIndex(p => p.name === nextP?.name);
            if (nextIdx > 0) {
                mapped[nextIdx - 1].isCurrent = true;
            }
        }

        if (mounted) {
          setPrayers(mapped);
          setNextPrayer(nextP);
          setLoading(false);
        }
      } catch (e) {
        console.warn('Error computing prayer times', e);
        if (mounted) setLoading(false);
      }
    };

    fetchTimes();

    // Refresh every minute to update the "next" prayer precisely
    const interval = setInterval(() => {
        fetchTimes();
    }, 60000);

      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }, [])
  );

  return { prayers, nextPrayer, loading };
}
