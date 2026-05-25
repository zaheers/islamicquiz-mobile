import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/theme/typography';
import { useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Search, Check } from 'lucide-react-native';
import { salahSettingsService, SalahSettings, LocationType, CalcMethodKey } from '@/services/salahSettingsService';
import * as Location from 'expo-location';

const CALC_METHODS: { key: CalcMethodKey; label: string; desc: string }[] = [
  { key: 'MWL', label: 'Muslim World League', desc: 'Europe, Far East, parts of US' },
  { key: 'ISNA', label: 'ISNA', desc: 'North America' },
  { key: 'Egyptian', label: 'Egyptian General Authority', desc: 'Africa, Syria, Lebanon' },
  { key: 'Makkah', label: 'Umm Al-Qura', desc: 'Arabian Peninsula' },
  { key: 'Karachi', label: 'University of Islamic Sciences', desc: 'Pakistan, Bangladesh, India' },
];

export default function SalahSettingsScreen() {
    const { activeColors, colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

  const router = useRouter();
  const [settings, setSettings] = useState<SalahSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    salahSettingsService.getSettings().then(s => {
      setSettings(s);
      if (s.cityName) setSearchQuery(s.cityName);
    });
  }, []);

  const updateSetting = async (partial: Partial<SalahSettings>) => {
    if (!settings) return;
    const updated = await salahSettingsService.saveSettings(partial);
    setSettings(updated);
  };

  const handleSearchCity = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const results = await Location.geocodeAsync(searchQuery);
      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];
        await updateSetting({
          locationType: 'manual',
          latitude,
          longitude,
          cityName: searchQuery.trim()
        });
      } else {
        setSearchError('City not found. Please try again.');
      }
    } catch (e) {
      setSearchError('Error searching for city.');
    } finally {
      setSearching(false);
    }
  };

  const setGpsMode = async () => {
    setSearching(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        // Try reverse geocode for a nice city name
        const rev = await Location.reverseGeocodeAsync(loc.coords);
        const city = rev[0]?.city || rev[0]?.region || 'Current Location';
        
        await updateSetting({
          locationType: 'gps',
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          cityName: city,
        });
        setSearchQuery(city);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setSearching(false);
    }
  };

  if (!settings) {
    return (
      <ScreenContainer style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.sg.primary} size="large" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={colors.sg.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prayer Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Location Section */}
        <Text style={styles.sectionTitle}>Location</Text>
        
        <View style={styles.card}>
          <View style={styles.tabs}>
            <TouchableOpacity 
              style={[styles.tab, settings.locationType === 'gps' && styles.activeTab]}
              onPress={setGpsMode}
            >
              <Text style={[styles.tabText, settings.locationType === 'gps' && styles.activeTabText]}>Auto (GPS)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, settings.locationType === 'manual' && styles.activeTab]}
              onPress={() => updateSetting({ locationType: 'manual' })}
            >
              <Text style={[styles.tabText, settings.locationType === 'manual' && styles.activeTabText]}>Manual</Text>
            </TouchableOpacity>
          </View>

          {settings.locationType === 'manual' && (
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter your city..."
                placeholderTextColor={colors.sg.outline}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchCity}
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearchCity}>
                {searching ? <ActivityIndicator size="small" color="#fff" /> : <Search size={20} color="#fff" />}
              </TouchableOpacity>
            </View>
          )}

          {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}

          <View style={styles.currentLocationRow}>
            <MapPin size={16} color={colors.sg.primary} />
            <Text style={styles.currentLocationText}>
              Currently using: {settings.cityName || 'Unknown Location'}
            </Text>
          </View>
        </View>

        {/* Calculation Method */}
        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Calculation Method</Text>
        
        <View style={styles.card}>
          {CALC_METHODS.map((method, index) => {
            const isSelected = settings.calculationMethod === method.key;
            return (
              <TouchableOpacity 
                key={method.key}
                style={[
                  styles.methodRow, 
                  index !== CALC_METHODS.length - 1 && styles.borderBottom,
                  isSelected && styles.selectedRow
                ]}
                onPress={() => updateSetting({ calculationMethod: method.key })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.methodTitle, isSelected && styles.selectedText]}>{method.label}</Text>
                  <Text style={styles.methodDesc}>{method.desc}</Text>
                </View>
                {isSelected && <Check size={20} color={colors.sg.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sg.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.sg.titleLg,
    color: colors.sg.onSurface,
    fontWeight: '600',
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    ...typography.sg.titleMd,
    color: colors.sg.onSurface,
    fontWeight: '600',
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.sg.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.sg.surfaceVariant,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.sg.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    ...typography.sg.labelLg,
    color: colors.sg.onSurfaceVariant,
  },
  activeTabText: {
    color: colors.sg.primary,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.sg.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    ...typography.sg.bodyLg,
    color: colors.sg.onSurface,
  },
  searchBtn: {
    width: 48,
    height: 48,
    backgroundColor: colors.sg.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.sg.labelMd,
    color: colors.error,
    marginBottom: 16,
  },
  currentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.sg.surfaceContainerHighest,
    padding: 12,
    borderRadius: 8,
  },
  currentLocationText: {
    ...typography.sg.bodyMd,
    color: colors.sg.primary,
    fontWeight: '500',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.sg.surfaceVariant,
  },
  selectedRow: {
    backgroundColor: colors.sg.surfaceContainerHighest,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  methodTitle: {
    ...typography.sg.bodyLg,
    color: colors.sg.onSurface,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedText: {
    color: colors.sg.primary,
    fontWeight: '600',
  },
  methodDesc: {
    ...typography.sg.bodySm,
    color: colors.sg.outline,
  }
});
