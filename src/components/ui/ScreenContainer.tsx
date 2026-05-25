import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { StatusBar, StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenContainerProps extends ViewProps {
    safe?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
    children,
    style,
    safe = true,
    ...props
}) => {
    const { activeColors, colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    const Container = safe ? SafeAreaView : View;

    return (
        <Container style={[styles.container, style]} edges={['top', 'left', 'right']} {...props}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
            {children}
        </Container>
    );
};

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
});
