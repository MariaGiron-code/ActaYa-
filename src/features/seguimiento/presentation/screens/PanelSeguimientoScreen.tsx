import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Button, FeedbackState, Screen } from '@core/ui';
import { colors, spacing, typography } from '@core/theme';
import { Dignidad } from '@features/territorio/domain/entities/Territorio';
import { useProgresoPorDignidad, useResumenPorRecinto, useSuscripcionSeguimiento } from '../hooks/useSeguimiento';

const DIGNIDADES: { valor: Dignidad; etiqueta: string }[] = [
  { valor: 'ALCALDIA', etiqueta: 'Alcaldía' },
  { valor: 'PREFECTURA', etiqueta: 'Prefectura' },
];

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
      <Text style={styles.titulo}>Seguimiento del escrutinio</Text>
      <Text style={styles.subtituloGeneral}>
        {totalReportadas} de {totalMesas} mesas reportadas
      </Text>

      <Text style={styles.subtitulo}>Mesas por recinto</Text>
      {resumen.isLoading ? (
        <FeedbackState
          source={require('../../../../../assets/lottie/cargando.json')}
          message="Cargando resumen…"
          loop
        />
      ) : resumen.data && !resumen.data.ok ? (
        <Text style={styles.error}>{resumen.data.error.message}</Text>
      ) : (
        <BarChart
          data={(resumen.data?.ok ? resumen.data.value : []).map((r) => ({
            value: r.mesasReportadas,
            label: r.nombreRecinto.length > 14 ? `${r.nombreRecinto.slice(0, 14)}…` : r.nombreRecinto,
            frontColor: r.mesasReportadas === r.mesasTotales && r.mesasTotales > 0 ? colors.success : colors.primary,
            topLabelComponent: () => (
              <Text style={styles.etiquetaBarra}>
                {r.mesasReportadas}/{r.mesasTotales}
              </Text>
            ),
          }))}
          height={180}
          barWidth={28}
          spacing={24}
          noOfSections={4}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={colors.border}
          yAxisTextStyle={styles.ejeTexto}
          xAxisLabelTextStyle={styles.ejeTexto}
        />
      )}

      <Text style={styles.subtitulo}>Votos por candidato</Text>
      <View style={styles.acciones}>
        {DIGNIDADES.map((d) => (
          <Button
            key={d.valor}
            label={d.etiqueta}
            variant={dignidad === d.valor ? 'primary' : 'outline'}
            onPress={() => setDignidad(d.valor)}
          />
        ))}
      </View>

      {progreso.isLoading ? (
        <FeedbackState
          source={require('../../../../../assets/lottie/cargando.json')}
          message="Cargando progreso…"
          loop
        />
      ) : progreso.data && !progreso.data.ok ? (
        <Text style={styles.error}>{progreso.data.error.message}</Text>
      ) : (
        <BarChart
          data={(progreso.data?.ok ? progreso.data.value : []).map((p) => ({
            value: p.votosTotales,
            label: p.organizacionSiglas,
            frontColor: colors.secondary,
            topLabelComponent: () => <Text style={styles.etiquetaBarra}>{p.votosTotales}</Text>,
          }))}
          height={180}
          barWidth={28}
          spacing={24}
          noOfSections={4}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={colors.border}
          yAxisTextStyle={styles.ejeTexto}
          xAxisLabelTextStyle={styles.ejeTexto}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: { ...typography.h1, color: colors.primary, marginBottom: spacing.xs },
  subtituloGeneral: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  subtitulo: { ...typography.h3, marginTop: spacing.lg, marginBottom: spacing.sm },
  acciones: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  error: { ...typography.body, color: colors.error, textAlign: 'center', marginVertical: spacing.md },
  etiquetaBarra: { ...typography.caption, color: colors.textPrimary, textAlign: 'center' },
  ejeTexto: { color: colors.textSecondary, fontSize: 10 },
});
