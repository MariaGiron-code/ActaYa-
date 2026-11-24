import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { animaciones, FeedbackState, haptics, Screen, SegmentedControl } from '@core/ui';
import { colors, radius, spacing, typography } from '@core/theme';
import { Dignidad } from '@features/territorio/domain/entities/Territorio';
import { useProgresoPorDignidad, useResumenPorRecinto, useSuscripcionSeguimiento } from '../hooks/useSeguimiento';

const DIGNIDADES: { valor: Dignidad; etiqueta: string }[] = [
  { valor: 'ALCALDIA', etiqueta: 'Alcaldía' },
  { valor: 'PREFECTURA', etiqueta: 'Prefectura' },
];

/** Estilo común de las barras: entran creciendo, puntas redondeadas y se resaltan al tocarlas. */
const PROPS_GRAFICO = {
  height: 180,
  barWidth: 28,
  spacing: 24,
  noOfSections: 4,
  yAxisThickness: 0,
  xAxisThickness: 1,
  xAxisColor: colors.border,
  rulesColor: colors.surface,
  isAnimated: true,
  animationDuration: 700,
  roundedTop: true,
  showGradient: true,
  focusBarOnPress: true,
  focusedBarConfig: { color: colors.accent },
  onPress: () => haptics.tap(),
} as const;

/**
 * RF-16 / RNF-07: el coordinador provincial ve, sin recargar la pantalla,
 * cuántas mesas han reportado por recinto y cómo va el conteo por
 * candidato — como un exit poll propio, sin esperar al CNE.
 */
export function PanelSeguimientoScreen() {
  const [dignidad, setDignidad] = useState<Dignidad>('ALCALDIA');
  useSuscripcionSeguimiento(dignidad);

  const resumen = useResumenPorRecinto();
  const progreso = useProgresoPorDignidad(dignidad);

  const totalReportadas = resumen.data?.ok ? resumen.data.value.reduce((acc, r) => acc + r.mesasReportadas, 0) : 0;
  const totalMesas = resumen.data?.ok ? resumen.data.value.reduce((acc, r) => acc + r.mesasTotales, 0) : 0;

  return (
    <Screen scrollable>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Seguimiento del escrutinio</Text>
        <IndicadorEnVivo />
      </View>

      <ProgresoMesas reportadas={totalReportadas} total={totalMesas} />

      <Text style={styles.subtitulo}>Mesas por recinto</Text>
      {resumen.isLoading ? (
        <FeedbackState source={animaciones.cargando} message="Cargando resumen…" loop />
      ) : resumen.data && !resumen.data.ok ? (
        <FeedbackState source={animaciones.error} message={resumen.data.error.message} />
      ) : (
        <BarChart
          {...PROPS_GRAFICO}
          data={(resumen.data?.ok ? resumen.data.value : []).map((r) => {
            const completo = r.mesasReportadas === r.mesasTotales && r.mesasTotales > 0;
            const color = completo ? colors.success : colors.primary;
            return {
              value: r.mesasReportadas,
              label: r.nombreRecinto.length > 14 ? `${r.nombreRecinto.slice(0, 14)}…` : r.nombreRecinto,
              frontColor: color,
              gradientColor: color + '99',
              topLabelComponent: () => (
                <Text style={styles.etiquetaBarra}>
                  {r.mesasReportadas}/{r.mesasTotales}
                </Text>
              ),
            };
          })}
          yAxisTextStyle={styles.ejeTexto}
          xAxisLabelTextStyle={styles.ejeTexto}
        />
      )}

      <Text style={styles.subtitulo}>Votos por candidato</Text>
      <SegmentedControl opciones={DIGNIDADES} valor={dignidad} onChange={setDignidad} />

      {progreso.isLoading ? (
        <FeedbackState source={animaciones.cargando} message="Cargando progreso…" loop />
      ) : progreso.data && !progreso.data.ok ? (
        <FeedbackState source={animaciones.error} message={progreso.data.error.message} />
      ) : (
        <BarChart
          {...PROPS_GRAFICO}
          // `key` por dignidad: al cambiar de pestaña las barras vuelven a crecer desde cero.
          key={dignidad}
          data={(progreso.data?.ok ? progreso.data.value : []).map((p) => ({
            value: p.votosTotales,
            label: p.organizacionSiglas,
            frontColor: colors.secondary,
            gradientColor: colors.secondary + '99',
            topLabelComponent: () => <Text style={styles.etiquetaBarra}>{p.votosTotales}</Text>,
          }))}
          yAxisTextStyle={styles.ejeTexto}
          xAxisLabelTextStyle={styles.ejeTexto}
        />
      )}
    </Screen>
  );
}

/** RNF-07: deja claro que los datos llegan solos, sin recargar. */
function IndicadorEnVivo() {
  const latido = useSharedValue(1);

  useEffect(() => {
    latido.set(withRepeat(withSequence(withTiming(0.3, { duration: 800 }), withTiming(1, { duration: 800 })), -1));
  }, [latido]);

  const estiloPunto = useAnimatedStyle(() => ({ opacity: latido.value }));

  return (
    <View style={styles.enVivo} accessibilityLabel="Datos en tiempo real">
      <Animated.View style={[styles.puntoEnVivo, estiloPunto]} />
      <Text style={styles.textoEnVivo}>En vivo</Text>
    </View>
  );
}

/** Barra de avance de mesas reportadas; crece suave cada vez que llega un acta nueva. */
function ProgresoMesas({ reportadas, total }: { reportadas: number; total: number }) {
  const [anchoPista, setAnchoPista] = useState(0);
  const avance = useSharedValue(0);
  const fraccion = total > 0 ? reportadas / total : 0;
  const porcentaje = Math.round(fraccion * 100);

  useEffect(() => {
    avance.set(withTiming(fraccion, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [fraccion, avance]);

  const estiloRelleno = useAnimatedStyle(() => ({ width: anchoPista * avance.value }));

  return (
    <View style={styles.tarjetaProgreso} accessibilityLabel={`${reportadas} de ${total} mesas reportadas, ${porcentaje} por ciento`}>
      <View style={styles.filaProgreso}>
        <Text style={styles.cifra}>
          {reportadas}
          <Text style={styles.cifraTotal}> / {total}</Text>
        </Text>
        <Text style={styles.porcentaje}>{porcentaje}%</Text>
      </View>
      <Text style={styles.etiquetaProgreso}>mesas reportadas</Text>
      <View style={styles.pista} onLayout={(e: LayoutChangeEvent) => setAnchoPista(e.nativeEvent.layout.width)}>
        <Animated.View
          style={[styles.relleno, { backgroundColor: porcentaje === 100 ? colors.success : colors.primary }, estiloRelleno]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  titulo: { ...typography.h2, color: colors.primary, flex: 1 },
  enVivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.error + '14',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  puntoEnVivo: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
  textoEnVivo: { ...typography.caption, color: colors.error, fontWeight: '700' },
  tarjetaProgreso: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary + '0D',
    borderWidth: 1,
    borderColor: colors.primary + '26',
  },
  filaProgreso: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  cifra: { ...typography.h1, color: colors.primary },
  cifraTotal: { ...typography.h3, color: colors.textSecondary },
  porcentaje: { ...typography.h3, color: colors.primary },
  etiquetaProgreso: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  pista: { height: 10, borderRadius: radius.pill, backgroundColor: colors.surface, overflow: 'hidden' },
  relleno: { height: '100%', borderRadius: radius.pill },
  subtitulo: { ...typography.h3, marginTop: spacing.lg, marginBottom: spacing.sm },
  etiquetaBarra: { ...typography.caption, color: colors.textPrimary, textAlign: 'center' },
  ejeTexto: { color: colors.textSecondary, fontSize: 10 },
});
