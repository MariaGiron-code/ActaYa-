import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated';
import { CheckIcon } from '@core/ui';
import { colors, radius, spacing, typography } from '@core/theme';

/** Debe coincidir con el mínimo del esquema de `EstablecerClaveInicialScreen`. */
export const LARGO_MINIMO_CLAVE = 8;

type Nivel = { etiqueta: string; color: string; fraccion: number };

/**
 * Solo orientativo: no bloquea el envío. La regla real sigue siendo el
 * mínimo de caracteres del esquema.
 */
function nivelDeSeguridad(clave: string): Nivel {
  let puntos = 0;
  if (clave.length >= LARGO_MINIMO_CLAVE) puntos++;
  if (clave.length >= 12) puntos++;
  if (/[a-z]/.test(clave) && /[A-Z]/.test(clave)) puntos++;
  if (/\d/.test(clave)) puntos++;
  if (/[^A-Za-z0-9]/.test(clave)) puntos++;

  if (puntos <= 2) return { etiqueta: 'Débil', color: colors.error, fraccion: 0.33 };
  if (puntos <= 3) return { etiqueta: 'Media', color: colors.warning, fraccion: 0.66 };
  return { etiqueta: 'Fuerte', color: colors.success, fraccion: 1 };
}

/** Medidor de seguridad + lista de requisitos que se marcan mientras se escribe. */
export function RequisitosClave({ clave, confirmacion }: { clave: string; confirmacion: string }) {
  const nivel = nivelDeSeguridad(clave);
  const [anchoPista, setAnchoPista] = useState(0);
  const avance = useSharedValue(0);
  const objetivo = clave.length === 0 ? 0 : nivel.fraccion;

  useEffect(() => {
    avance.set(withTiming(objetivo, { duration: 350, easing: Easing.out(Easing.cubic) }));
  }, [objetivo, avance]);

  const estiloRelleno = useAnimatedStyle(() => ({ width: anchoPista * avance.value }));

  return (
    <View style={styles.contenedor}>
      <View style={styles.filaMedidor}>
        <Text style={styles.textoMedidor}>Seguridad de la clave</Text>
        {clave.length > 0 ? <Text style={[styles.nivel, { color: nivel.color }]}>{nivel.etiqueta}</Text> : null}
      </View>
      <View style={styles.pista} onLayout={(e: LayoutChangeEvent) => setAnchoPista(e.nativeEvent.layout.width)}>
        <Animated.View style={[styles.relleno, { backgroundColor: nivel.color }, estiloRelleno]} />
      </View>

      <Requisito cumplido={clave.length >= LARGO_MINIMO_CLAVE} texto={`Al menos ${LARGO_MINIMO_CLAVE} caracteres`} />
      <Requisito cumplido={confirmacion.length > 0 && clave === confirmacion} texto="Las dos claves coinciden" />
    </View>
  );
}

function Requisito({ cumplido, texto }: { cumplido: boolean; texto: string }) {
  return (
    <View
      style={styles.requisito}
      accessible
      accessibilityLabel={`${texto}: ${cumplido ? 'cumplido' : 'pendiente'}`}
    >
      {cumplido ? (
        <Animated.View key="si" entering={ZoomIn.springify().damping(12)} style={styles.marcaCumplida}>
          <CheckIcon size={11} />
        </Animated.View>
      ) : (
        <View key="no" style={styles.marcaPendiente} />
      )}
      <Text style={[styles.textoRequisito, cumplido && styles.textoCumplido]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: -spacing.xs, marginBottom: spacing.md, gap: spacing.xs },
  filaMedidor: { flexDirection: 'row', justifyContent: 'space-between' },
  textoMedidor: { ...typography.caption, color: colors.textSecondary },
  nivel: { ...typography.caption, fontWeight: '700' },
  pista: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surface, overflow: 'hidden', marginBottom: spacing.xs },
  relleno: { height: '100%', borderRadius: radius.pill },
  requisito: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  marcaCumplida: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaPendiente: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border },
  textoRequisito: { ...typography.caption, color: colors.textSecondary },
  textoCumplido: { color: colors.textPrimary },
});
