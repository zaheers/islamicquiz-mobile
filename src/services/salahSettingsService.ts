import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalculationMethod, CalculationParameters } from 'adhan';

export type LocationType = 'gps' | 'manual';
export type CalcMethodKey = 'MWL' | 'ISNA' | 'Egyptian' | 'Makkah' | 'Karachi' | 'Tehran' | 'Kuwait';

export interface SalahSettings {
  locationType: LocationType;
  latitude: number | null;
  longitude: number | null;
  cityName: string | null;
  calculationMethod: CalcMethodKey;
}

const SETTINGS_KEY = '@salah_settings';

const DEFAULT_SETTINGS: SalahSettings = {
  locationType: 'gps',
  latitude: null,
  longitude: null,
  cityName: null,
  calculationMethod: 'MWL',
};

export const salahSettingsService = {
  async getSettings(): Promise<SalahSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to load salah settings', e);
    }
    return DEFAULT_SETTINGS;
  },

  async saveSettings(settings: Partial<SalahSettings>): Promise<SalahSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save salah settings', e);
    }
    return updated;
  },

  getAdhanCalculationMethod(method: CalcMethodKey): CalculationParameters {
    switch (method) {
      case 'ISNA': return CalculationMethod.NorthAmerica();
      case 'Egyptian': return CalculationMethod.Egyptian();
      case 'Makkah': return CalculationMethod.UmmAlQura();
      case 'Karachi': return CalculationMethod.Karachi();
      case 'Tehran': return CalculationMethod.Tehran();
      case 'Kuwait': return CalculationMethod.Kuwait();
      case 'MWL':
      default:
        return CalculationMethod.MuslimWorldLeague();
    }
  }
};
