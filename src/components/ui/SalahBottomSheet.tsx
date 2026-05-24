import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Check, X, ChevronRight } from 'lucide-react-native';
import { auth } from '@/lib/firebase';
import { salahRepository, PrayerName, PRAYER_DISPLAY, SalahDayEntry } from '@/services/salahRepository';
import { getLocalDayStr } from '@/features/dailyGoal/streakService';
import { KhushuSlider } from './KhushuSlider';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const getUserId = () => auth?.currentUser?.uid || 'anonymous_user';

interface SalahBottomSheetProps {
    bottomSheetRef: React.RefObject<BottomSheet>;
    onProgressUpdate?: () => void;
}

export function SalahBottomSheet({ bottomSheetRef, onProgressUpdate }: SalahBottomSheetProps) {
    const router = useRouter();
    const snapPoints = useMemo(() => ['70%', '90%'], []);
    const [entries, setEntries] = useState<SalahDayEntry[]>([]);
    const [expandedPrayer, setExpandedPrayer] = useState<PrayerName | null>(null);

    const loadData = useCallback(async () => {
        try {
            const dayLog = await salahRepository.getDayLog(getUserId(), getLocalDayStr());
            setEntries(dayLog);
        } catch (e) {
            console.warn('[SalahBottomSheet] Load error:', e);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleToggle = async (prayerName: PrayerName) => {
        try {
            const newStatus = await salahRepository.togglePrayer(getUserId(), prayerName);
            
            setEntries(prev => prev.map(e => 
                e.prayer_name === prayerName 
                    ? { ...e, status: newStatus, marked_at: new Date().toISOString() } 
                    : e
            ));

            if (newStatus === 'prayed') {
                setExpandedPrayer(prayerName);
            } else if (expandedPrayer === prayerName) {
                setExpandedPrayer(null);
            }
            
            if (onProgressUpdate) onProgressUpdate();
        } catch (e) {
            console.warn('[SalahBottomSheet] Toggle error:', e);
        }
    };

    const handleUpdateKhushu = async (prayerName: PrayerName, khushu: number) => {
        try {
            const entry = entries.find(e => e.prayer_name === prayerName);
            await salahRepository.updateKhushuAndReflection(getUserId(), prayerName, khushu, entry?.reflection || null);
            setEntries(prev => prev.map(e => 
                e.prayer_name === prayerName ? { ...e, khushu } : e
            ));
        } catch (e) {
            console.warn('[SalahBottomSheet] Update Khushu error:', e);
        }
    };

    const renderBackdrop = useCallback((props: any) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.3} />
    ), []);

    const getFardEntries = () => entries.filter(e => e.prayer_name !== 'duha' && e.prayer_name !== 'tahajjud');

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            backdropComponent={renderBackdrop}
            backgroundStyle={styles.sheetBackground}
            handleIndicatorStyle={styles.indicator}
            onChange={(index) => {
                if (index >= 0) loadData();
            }}
        >
            <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerContainer}>
                    <View style={styles.headerTitleRow}>
                        <Text style={styles.headerTitle}>Log Salah</Text>
                        <TouchableOpacity 
                            style={styles.fullTrackerBtn}
                            onPress={() => {
                                bottomSheetRef.current?.close();
                                router.push('/salah-tracker' as any);
                            }}
                        >
                            <Text style={styles.fullTrackerText}>Full Tracker</Text>
                            <ChevronRight size={16} color={colors.sg.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.headerDesc}>Track your daily prayers and reflect on your focus.</Text>
                </View>

                <View style={styles.prayersList}>
                    {getFardEntries().map(entry => {
                        const isExpanded = expandedPrayer === entry.prayer_name;
                        const display = PRAYER_DISPLAY[entry.prayer_name];
                        const isPrayed = entry.status === 'prayed';
                        const isMissed = entry.status === 'missed';

                        return (
                            <View key={entry.prayer_name} style={styles.prayerCardWrapper}>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={[
                                        styles.fardCard,
                                        isPrayed && styles.fardCardPrayed,
                                        isMissed && styles.fardCardMissed
                                    ]}
                                    onPress={() => handleToggle(entry.prayer_name)}
                                >
                                    <View style={styles.fardLeft}>
                                        <View style={styles.iconCircle}>
                                            <Text style={{fontSize: 20}}>{display.emoji}</Text>
                                        </View>
                                        <View>
                                            <Text style={[styles.fardName, isPrayed && {color: colors.sg.onPrimaryContainer}]}>{display.label}</Text>
                                            <Text style={[styles.fardTime, isPrayed && {color: colors.sg.onPrimaryContainer}]}>{display.time}</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.checkbox, isPrayed && styles.checkboxChecked, isMissed && styles.checkboxMissed]}>
                                        {isPrayed && <Check size={18} color={colors.sg.onPrimaryContainer} strokeWidth={3} />}
                                        {isMissed && <X size={18} color={colors.sg.onErrorContainer} strokeWidth={3} />}
                                    </View>
                                </TouchableOpacity>

                                {isExpanded && (
                                    <View style={styles.expandedArea}>
                                        <KhushuSlider 
                                            value={entry.khushu || 3} 
                                            onValueChange={(val) => handleUpdateKhushu(entry.prayer_name, val)} 
                                        />
                                        <TouchableOpacity style={styles.doneBtn} onPress={() => setExpandedPrayer(null)}>
                                            <Text style={styles.doneBtnText}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            </BottomSheetScrollView>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    sheetBackground: {
        backgroundColor: colors.sg.surface,
        borderRadius: 28,
    },
    indicator: {
        backgroundColor: colors.sg.outline,
        width: 48,
    },
    headerContainer: {
        paddingBottom: 20,
        paddingTop: 8,
        alignItems: 'flex-start',
    },
    headerTitleRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    fullTrackerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: colors.sg.surfaceVariant,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    fullTrackerText: {
        ...typography.sg.labelMd,
        color: colors.sg.primary,
        fontWeight: 'bold',
    },
    headerTitle: {
        ...typography.sg.headlineMd,
        color: colors.sg.onSurface,
    },
    headerDesc: {
        ...typography.sg.bodyMd,
        color: colors.sg.onSurfaceVariant,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 48,
    },
    prayersList: {
        gap: 12,
    },
    prayerCardWrapper: {
        backgroundColor: colors.sg.surfaceContainerLowest,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.sg.outlineVariant,
    },
    fardCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'transparent',
    },
    fardCardPrayed: {
        backgroundColor: colors.sg.primaryContainer,
        borderColor: colors.sg.primary,
    },
    fardCardMissed: {
        backgroundColor: colors.sg.errorContainer,
    },
    fardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.sg.surfaceVariant,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fardName: {
        ...typography.sg.titleMd,
        color: colors.sg.onSurface,
    },
    fardTime: {
        ...typography.sg.labelMd,
        color: colors.sg.onSurfaceVariant,
        marginTop: 2,
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: colors.sg.outline,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.sg.primaryContainer,
        borderColor: colors.sg.primary,
    },
    checkboxMissed: {
        backgroundColor: colors.sg.errorContainer,
        borderColor: colors.sg.error,
    },
    expandedArea: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 4,
    },
    doneBtn: {
        backgroundColor: colors.sg.primary,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    doneBtnText: {
        ...typography.sg.labelLg,
        color: colors.sg.onPrimary,
        fontWeight: 'bold',
    }
});
