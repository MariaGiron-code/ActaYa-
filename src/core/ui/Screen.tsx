import React, { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@core/theme';

type ScreenProps = PropsWithChildren<{ style?: ViewStyle; padded?: boolean }>;

/** Contenedor base de pantalla: respeta notch/status bar y fondo consistente. */
export function Screen({ children, style, padded = true }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={[styles.container, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
});
