import React, { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { colors, spacing } from '@core/theme';
import { DireccionTransicion, entradaDeVista } from './transiciones';
import { FondoMarca } from './FondoMarca';

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
  /**
   * Animación de entrada al cambiar de vista DENTRO de una misma ruta (lista
   * -> formulario). Déjala sin definir en la primera vista de una ruta: el
   * stack nativo ya anima esa entrada y se vería doble.
   */
  transicion?: DireccionTransicion;
  /** Ola y acentos de marca detrás del contenido (solo pantallas sin header). */
  fondoMarca?: boolean;
}>;

/** Contenedor base de pantalla: respeta notch/status bar y fondo consistente. */
export function Screen({
  children,
  style,
  padded = true,
  scrollable = false,
  transicion,
  fondoMarca = false,
}: ScreenProps) {
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
      {fondoMarca ? <FondoMarca /> : null}
      {transicion ? (
        <Animated.View entering={entradaDeVista(transicion)} style={styles.container}>
          {contenido}
        </Animated.View>
      ) : (
        contenido
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xl },
  padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
});
