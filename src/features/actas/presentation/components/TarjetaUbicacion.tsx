import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { entradaDeBloque, haptics, transicionDeLayout, UbicacionIcon } from '@core/ui';
import { colors, radius, spacing, typography } from '@core/theme';
import { Ubicacion } from '../../domain/entities/Acta';

/** Dos dígitos: 9 -> "09". */
const dosDigitos = (n: number) => String(n).padStart(2, '0');

/** Hora local "14:32" sin depender de Intl (Hermes no siempre lo trae completo). */
export function formatearHora(iso: string): string {
  const fecha = new Date(iso);
  return `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

const formatearCoordenadas = (u: Ubicacion) => `${u.latitud.toFixed(5)}, ${u.longitud.toFixed(5)}`;

function abrirEnMapa(u: Ubicacion) {
  haptics.tap();
  // URL universal de Google Maps: abre la app si está instalada o el navegador si no.
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${u.latitud},${u.longitud}`);
}

type TarjetaUbicacionProps = {
  ubicacion: Ubicacion;
  /**
   * `captura`: la ve el veedor justo después de tomar la foto.
   * `detalle`: la ve un coordinador al abrir un acta ya registrada.
   */
  variante: 'captura' | 'detalle';
  /** Solo `detalle`: cuándo se registró el acta, para compararlo con la hora de la ubicación. */
  registradaEn?: string;
  /** Solo `captura`: vuelve a pedir la ubicación al GPS cuando quedó no verificada. */
  onReintentar?: () => void;
  reintentando?: boolean;
};

/**
 * ADR-04 / S-10: muestra desde dónde se tomó la foto del acta. Verde si la
 * ubicación es reciente (verificada); amarilla si tiene más de 5 minutos,
 * para que el veedor lo sepa al momento y el coordinador pueda revisarla.
 */
export function TarjetaUbicacion({ ubicacion, variante, registradaEn, onReintentar, reintentando }: TarjetaUbicacionProps) {
  const { verificada } = ubicacion;
  const color = verificada ? colors.success : colors.textPrimary;

  const titulo =
    variante === 'detalle'
      ? verificada
        ? 'Ubicación verificada'
        : 'Ubicación no verificada'
      : verificada
        ? 'Ubicación registrada'
        : 'Ubicación no verificada';

  const lineas: string[] = [formatearCoordenadas(ubicacion)];
  if (variante === 'captura') {
    const precision =
      ubicacion.precisionMetros != null ? ` · precisión ±${Math.round(ubicacion.precisionMetros)} m` : '';
    lineas.push(`Tomada a las ${formatearHora(ubicacion.capturadaEn)}${precision}`);
    if (!verificada) {
      lineas.push('El GPS no respondió y se usó la última ubicación guardada en el teléfono. Puedes guardar igual.');
    }
  } else {
    const registro = registradaEn ? ` · acta registrada ${formatearHora(registradaEn)}` : '';
    lineas.push(`Ubicación ${formatearHora(ubicacion.capturadaEn)}${registro}`);
  }

  return (
    <Animated.View
      entering={entradaDeBloque}
      layout={transicionDeLayout}
      style={[styles.tarjeta, verificada ? styles.verificada : styles.noVerificada]}
      accessibilityLabel={`${titulo}. ${lineas.join('. ')}`}
    >
      <UbicacionIcon size={22} color={verificada ? colors.success : colors.textPrimary} />
      <View style={styles.contenido}>
        <Text style={[styles.titulo, { color }]}>{titulo}</Text>
        {lineas.map((linea) => (
          <Text key={linea} style={styles.detalle}>
            {linea}
          </Text>
        ))}

        {variante === 'detalle' ? (
          <Pressable onPress={() => abrirEnMapa(ubicacion)} accessibilityRole="link" hitSlop={8} style={styles.enlace}>
            <Text style={styles.textoEnlace}>Ver en el mapa</Text>
          </Pressable>
        ) : null}

        {variante === 'captura' && !verificada && onReintentar ? (
          <Pressable
            onPress={() => {
              haptics.tap();
              onReintentar();
            }}
            disabled={reintentando}
            accessibilityRole="button"
            hitSlop={8}
            style={styles.enlace}
          >
            <Text style={styles.textoEnlace}>{reintentando ? 'Buscando señal GPS…' : 'Reintentar GPS'}</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

/** Versión corta para listas: una línea con el ícono y el estado de la ubicación. */
export function EtiquetaUbicacion({ ubicacion }: { ubicacion: Ubicacion | null }) {
  if (!ubicacion) return null;
  if (ubicacion.verificada) {
    return (
      <View style={styles.etiqueta}>
        <UbicacionIcon size={14} color={colors.success} />
        <Text style={[styles.textoEtiqueta, { color: colors.success }]}>Ubicación verificada</Text>
      </View>
    );
  }
  return (
    <View style={[styles.etiqueta, styles.etiquetaAviso]}>
      <UbicacionIcon size={14} color={colors.textPrimary} />
      <Text style={styles.textoEtiqueta}>Ubicación no verificada</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  verificada: { backgroundColor: colors.success + '14', borderColor: colors.success },
  noVerificada: { backgroundColor: colors.warning + '26', borderColor: colors.warning },
  contenido: { flex: 1, gap: 2 },
  titulo: { ...typography.bodyBold },
  detalle: { ...typography.caption, color: colors.textSecondary },
  enlace: { alignSelf: 'flex-start', marginTop: spacing.xs, minHeight: 24, justifyContent: 'center' },
  textoEnlace: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  etiqueta: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  etiquetaAviso: {
    backgroundColor: colors.warning + '40',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  textoEtiqueta: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
});
