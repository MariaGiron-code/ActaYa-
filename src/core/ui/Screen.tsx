import React, { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@core/theme';

type ScreenProps = PropsWithChildren<{
  style?: ViewStyle;
  padded?: boolean;
  /**
   * Pon `scrollable` en CUALQUIER pantalla cuyo contenido sea un formulario u
   * otro contenido de alto variable (listas dinámicas de campos, mensajes de
   * error que aparecen/desaparecen, etc.) — sin esto, el contenido que no
   * quepa en la pantalla queda inalcanzable, sin forma de hacer scroll para
   * verlo ni de llegar al botón de enviar.
   *
   * NO la actives si el hijo directo es un `FlatList`/`SectionList`: esos ya
   * scrollean por su cuenta, y anidarlos dentro de un ScrollView rompe el
   * virtualizado y genera el warning de RN "VirtualizedLists should never be
   * nested inside plain ScrollViews".
   */
  scrollable?: boolean;
}>;

/** Contenedor base de pantalla: respeta notch/status bar y fondo consistente. */
export function Screen({ children, style, padded = true, scrollable = false }: ScreenProps) {
  const contenido = scrollable ? (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, padded && styles.padded, style]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  ) : (
    <View style={[styles.container, padded && styles.padded, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {contenido}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xl },
  padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
});
