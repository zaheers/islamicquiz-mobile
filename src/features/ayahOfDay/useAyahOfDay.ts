import { useCallback, useEffect, useRef, useState } from 'react';
import { askNoor } from '../../services/noorApi';
import {
  DailyAyah,
  cacheReflection,
  fetchDailyAyah,
  getCachedReflection,
} from './ayahService';

export interface AyahOfDayState {
  ayah: DailyAyah | null;
  reflection: string | null;
  isLoading: boolean;
  isReflectionLoading: boolean;
  error: string | null;
}

export function useAyahOfDay(): AyahOfDayState {
  const [ayah, setAyah] = useState<DailyAyah | null>(null);
  const [reflection, setReflection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReflectionLoading, setIsReflectionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadAyah();
    return () => { mountedRef.current = false; };
  }, []);

  const loadAyah = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchDailyAyah();
      if (!mountedRef.current) return;
      setAyah(data);

      // Try loading cached reflection first (non-blocking)
      const cached = await getCachedReflection(data.surah_id, data.ayah_number);
      if (!mountedRef.current) return;

      if (cached) {
        setReflection(cached);
      } else {
        // Fetch AI reflection in background — don't block the card render
        loadReflection(data);
      }
    } catch (e: any) {
      if (mountedRef.current) setError('Could not load today\'s ayah.');
      console.error('[AyahOfDay] Load error:', e);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  const loadReflection = useCallback(async (data: DailyAyah) => {
    setIsReflectionLoading(true);
    try {
      const prompt = `Explain this Quran ayah in 1-2 sentences using authentic tafsir context and simple language. Avoid speculation.\n\nAyah: "${data.translation_text}"\n(${data.surah_name} ${data.surah_id}:${data.ayah_number})`;
      const result = await askNoor(prompt);
      const text = result?.answer || '';
      if (!mountedRef.current) return;
      if (text) {
        setReflection(text);
        await cacheReflection(data.surah_id, data.ayah_number, text);
      }
    } catch {
      // Reflection is optional — fail silently
    } finally {
      if (mountedRef.current) setIsReflectionLoading(false);
    }
  }, []);

  return { ayah, reflection, isLoading, isReflectionLoading, error };
}
