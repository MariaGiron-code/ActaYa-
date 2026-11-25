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
  /** `null`: el acta no tiene ubicación (GPS apagado o permiso negado). */
  ubicacion: Ubicacion | null;
  /**
   * `captura`: la ve quien acaba de tomar la foto.
   * `detalle`: la ve un coordinador al abrir un acta ya registrada.
   */
  variante: 'captura' | 'detalle';
  /** Solo `detalle`: cuándo se registró el acta, para compararlo con la hora de la ubicación. */
  registradaEn?: string;
  /** Solo `captura`: vuelve a pedir la ubicación al GPS cuando no quedó verificada. */
  onReintentar?: () => void;
  reintentando?: boolean;
};

type Estado = 'verificada' | 'no_verificada' | 'sin_ubicacion';

const ESTILO_POR_ESTADO: Record<Estado, { color: string; tarjeta: 'verificada' | 'noVerificada' | 'sinUbicacion' }> = {
  verificada: { color: colors.success, tarjeta: 'verificada' },
  no_verificada: { color: colors.textPrimary, tarjeta: 'noVerificada' },
  sin_ubicacion: { color: colors.error, tarjeta: 'sinUbicacion' },
};

function estadoDe(ubicacion: Ubicacion | null): Estado {
  if (!ubicacion) return 'sin_ubicacion';
  return ubicacion.verificada ? 'verificada' : 'no_verificada';
}

/**
 * ADR-04 / S-10: muestra desde dónde se tomó la foto del acta.
 * Verde: ubicación reciente (verificada). Amarilla: la última conocida, de
 * más de 5 minutos. Roja: sin ubicación (GPS apagado o sin permiso); el
 * acta se guarda igual y queda marcada para revisión.
 */
export function TarjetaUbicacion({ ubicacion, variante, registradaEn, onReintentar, reintentando }: TarjetaUbicacionProps) {
  const estado = estadoDe(ubicacion);
  const { color, tarjeta } = ESTILO_POR_ESTADO[estado];

  const titulo =
    estado === 'sin_ubicacion'
      ? 'Sin ubicación'
      : estado === 'no_verificada'
        ? 'Ubicación no verificada'
        : variante === 'captura'
          ? 'Ubicación registrada'
          : 'Ubicación verificada';

  const lineas: string[] = [];
  if (!ubicacion) {
    lineas.push(
      variante === 'captura'
        ? 'El GPS está apagado o no diste permiso de ubicación. Puedes guardar el acta igual: quedará marcada para revisión.'
        : 'Se registró con el GPS apagado o sin permiso de ubicación. Para respaldarla, vuelve a tomar la foto con el GPS activo.'
    );
  } else if (variante === 'captura') {
    lineas.push(formatearCoordenadas(ubicacion));
    const precision =
      ubicacion.precisionMetros != null ? ` · precisión ±${Math.round(ubicacion.precisionMetros)} m` : '';
    lineas.push(`Tomada a las ${formatearHora(ubicacion.capturadaEn)}${precision}`);
    if (!ubicacion.verificada) {
      lineas.push('El GPS no respondió y se usó la última ubicación guardada en el teléfono. Puedes guardar igual.');
    }
  } else {
    lineas.push(formatearCoordenadas(ubicacion));
    const registro = registradaEn ? ` · acta registrada ${formatearHora(registradaEn)}` : '';
    lineas.push(`Ubicación ${formatearHora(ubicacion.capturadaEn)}${registro}`);
  }

  const puedeReintentar = variante === 'captura' && estado !== 'verificada' && onReintentar;

  return (
    <Animated.View
      entering={entradaDeBloque}
      layout={transicionDeLayout}
      style={[styles.tarjeta, styles[tarjeta]]}
      accessibilityLabel={`${titulo}. ${lineas.join('. ')}`}
    >
      <UbicacionIcon size={22} color={color} />
      <View style={styles.contenido}>
        <Text style={[styles.titulo, { color }]}>{titulo}</Text>
        {lineas.map((linea) => (
          <Text key={linea} style={styles.detalle}>
            {linea}
          </Text>
        ))}

        {variante === 'detalle' && ubicacion ? (
          <Pressable onPress={() => abrirEnMapa(ubicacion)} accessibilityRole="link" hitSlop={8} style={styles.enlace}>
            <Text style={styles.textoEnlace}>Ver en el mapa</Text>
          </Pressable>
        ) : null}

        {puedeReintentar ? (
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
  if (!ubicacion) {
    return (
      <View style={[styles.etiqueta, styles.etiquetaSinUbicacion]}>
        <UbicacionIcon size={14} color={colors.error} />
        <Text style={[styles.textoEtiqueta, { color: colors.error }]}>Sin ubicación</Text>
      </View>
    );
  }
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
  sinUbicacion: { backgroundColor: colors.error + '14', borderColor: colors.error },
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
  etiquetaSinUbicacion: {
    backgroundColor: colors.error + '1A',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  textoEtiqueta: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
});
