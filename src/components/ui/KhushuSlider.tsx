import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, LayoutChangeEvent } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import * as Haptics from 'expo-haptics';

interface KhushuSliderProps {
    value: number; // 1 to 5
    onValueChange: (value: number) => void;
}

export const KhushuSlider: React.FC<KhushuSliderProps> = ({ value, onValueChange }) => {
    const [trackWidth, setTrackWidth] = useState(0);
    const thumbRadius = 14;
    
    // Map 1-5 to a 0-1 percentage
    const getPercentage = (val: number) => (val - 1) / 4;
    
    const pan = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (trackWidth > 0) {
            const initialX = getPercentage(value) * (trackWidth - thumbRadius * 2);
            pan.setValue(initialX);
        }
    }, [trackWidth, value]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
            onPanResponderMove: (_, gestureState) => {
                let newX = getPercentage(value) * (trackWidth - thumbRadius * 2) + gestureState.dx;
                if (newX < 0) newX = 0;
                if (newX > trackWidth - thumbRadius * 2) newX = trackWidth - thumbRadius * 2;
                pan.setValue(newX);
            },
            onPanResponderRelease: (_, gestureState) => {
                let finalX = getPercentage(value) * (trackWidth - thumbRadius * 2) + gestureState.dx;
                if (finalX < 0) finalX = 0;
                if (finalX > trackWidth - thumbRadius * 2) finalX = trackWidth - thumbRadius * 2;
                
                const percentage = finalX / (trackWidth - thumbRadius * 2);
                const newValue = Math.round(percentage * 4) + 1; // Maps 0-1 to 1-5
                
                // Snap to nearest point
                const snapX = getPercentage(newValue) * (trackWidth - thumbRadius * 2);
                Animated.spring(pan, {
                    toValue: snapX,
                    useNativeDriver: false,
                    friction: 5
                }).start();

                if (newValue !== value) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onValueChange(newValue);
                }
            }
        })
    ).current;

    const onTrackLayout = (e: LayoutChangeEvent) => {
        setTrackWidth(e.nativeEvent.layout.width);
    };

    const getLabelText = () => {
        if (value <= 2) return "Rushed";
        if (value === 3) return "Present";
        return "Deep Peace";
    };

    const getLabelColor = () => {
        if (value <= 2) return colors.sg.error;
        if (value === 3) return colors.sg.primary;
        return colors.sg.secondary;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Quality Reflection</Text>
                <Text style={[styles.statusText, { color: getLabelColor() }]}>{getLabelText()}</Text>
            </View>
            
            <View style={styles.sliderContainer}>
                <View style={styles.track} onLayout={onTrackLayout}>
                    <Animated.View style={[styles.activeTrack, { width: Animated.add(pan, thumbRadius) }]} />
                    <Animated.View 
                        style={[styles.thumb, { transform: [{ translateX: pan }] }]} 
                        {...panResponder.panHandlers}
                    >
                        <View style={styles.thumbInner} />
                    </Animated.View>
                </View>
                <View style={styles.marksContainer}>
                    <View style={styles.mark} />
                    <View style={styles.mark} />
                    <View style={styles.mark} />
                    <View style={styles.mark} />
                    <View style={styles.mark} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
        padding: 16,
        backgroundColor: colors.sg.surfaceContainerLowest,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.sg.outlineVariant,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        ...typography.sg.labelLg,
        color: colors.sg.onSurface,
    },
    statusText: {
        ...typography.sg.labelMd,
        fontWeight: 'bold',
    },
    sliderContainer: {
        position: 'relative',
        height: 28,
        justifyContent: 'center',
    },
    track: {
        height: 6,
        backgroundColor: colors.sg.surfaceContainerHigh,
        borderRadius: 3,
        position: 'relative',
        justifyContent: 'center',
    },
    activeTrack: {
        height: '100%',
        backgroundColor: colors.sg.primary,
        borderRadius: 3,
        position: 'absolute',
        left: 0,
    },
    thumb: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#fff',
        position: 'absolute',
        left: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.sg.primary,
    },
    marksContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'absolute',
        top: 13,
        left: 14,
        right: 14,
        zIndex: -1,
    },
    mark: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.sg.outlineVariant,
    }
});
