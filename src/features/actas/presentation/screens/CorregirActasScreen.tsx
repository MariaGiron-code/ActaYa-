import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Button, FeedbackState, Screen, StatusBadge, TextField } from '@core/ui';
import { colors, radius, spacing, typography } from '@core/theme';
import { useMesa, useOrganizacionesConCandidatos } from '@features/territorio/presentation/hooks/useTerritorio';
import { useActasCorregibles, useCorregirActa } from '../hooks/useActas';
import { Acta } from '../../domain/entities/Acta';
import { ConflictoVersion } from '../../domain/repositories/ActasRepository';

/**
 * RF-12: "el veedor corrige sus mesas y el coordinador de recinto corrige
 * cualquier acta de su recinto" — la lista ya viene filtrada así por la
 * RLS de `actas` (`actas_select_alcance`), según quién abra esta pantalla.
 */
export function CorregirActasScreen() {
  const actas = useActasCorregibles();
  const [actaSeleccionada, setActaSeleccionada] = useState<Acta | null>(null);

  if (actaSeleccionada) {
    return <FormularioCorreccion acta={actaSeleccionada} onVolver={() => setActaSeleccionada(null)} />;
  }

  return (
    <Screen>
      <Text style={styles.titulo}>Corregir actas</Text>

      {actas.isLoading ? (
        <FeedbackState
          source={require('../../../../../assets/lottie/cargando.json')}
          message="Cargando actas…"
          loop
        />
      ) : actas.data && !actas.data.ok ? (
        <Text style={styles.error}>{actas.data.error.message}</Text>
      ) : (
        <FlatList
          style={styles.flatList}
          data={actas.data?.ok ? actas.data.value : []}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.vacio}>No hay actas para corregir todavía.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <MesaLabel mesaId={item.mesaId} />
              <Text style={styles.cardDetalle}>{item.dignidad === 'ALCALDIA' ? 'Alcaldía' : 'Prefectura'}</Text>
              <StatusBadge estado={item.estado} />
              <Button label="Corregir" variant="outline" onPress={() => setActaSeleccionada(item)} />
            </View>
          )}
          contentContainerStyle={styles.lista}
        />
      )}
    </Screen>
  );
}

function MesaLabel({ mesaId }: { mesaId: string }) {
  const mesa = useMesa(mesaId);
  const numero = mesa.data?.ok ? mesa.data.value.numeroJrv : '…';
  return <Text style={styles.cardTitulo}>Mesa {numero}</Text>;
}

function FormularioCorreccion({ acta, onVolver }: { acta: Acta; onVolver: () => void }) {
  const organizaciones = useOrganizacionesConCandidatos();
  const corregirActa = useCorregirActa();

  // Se guarda la acta "tal como la conoce el cliente" por separado del prop
  // original: si llega un conflicto de versión (S-05) y el usuario carga la
  // versión del servidor, el PRÓXIMO intento de guardar debe partir de esa
  // versión nueva — si se siguiera usando `acta` (el prop, nunca cambia),
  // cada reintento volvería a chocar con la misma versión vieja para
  // siempre, sin poder guardar jamás.
  const [actaActual, setActaActual] = useState(acta);

  const [votos, setVotos] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(acta.votosPorOrganizacion).map(([id, v]) => [id, String(v)]))
  );
  const [votosNulos, setVotosNulos] = useState(String(acta.votosNulos));
  const [votosBlancos, setVotosBlancos] = useState(String(acta.votosBlancos));
  const [totalSufragantes, setTotalSufragantes] = useState(String(acta.totalSufragantes));

  const organizacionesDignidad = useMemo(() => {
    if (!organizaciones.data?.ok) return [];
    return organizaciones.data.value
      .map(({ organizacion, candidatos }) => ({
        organizacion,
        candidato: candidatos.find((c) => c.dignidad === acta.dignidad),
      }))
      .filter((o): o is { organizacion: typeof o.organizacion; candidato: NonNullable<typeof o.candidato> } =>
        Boolean(o.candidato)
      );
  }, [organizaciones.data, acta.dignidad]);

  function guardar() {
    const votosPorOrganizacion: Record<string, number> = {};
    for (const { organizacion } of organizacionesDignidad) {
      votosPorOrganizacion[organizacion.id] = Number(votos[organizacion.id] ?? '0') || 0;
    }

    corregirActa.mutate(
      {
        actaId: acta.id,
        cambios: {
          votosPorOrganizacion,
          votosNulos: Number(votosNulos) || 0,
          votosBlancos: Number(votosBlancos) || 0,
          totalSufragantes: Number(totalSufragantes) || 0,
        },
        actaActual,
      },
      { onSuccess: (r) => r.ok && onVolver() }
    );
  }

  const conflicto =
    corregirActa.data && !corregirActa.data.ok && corregirActa.data.error.code === 'CONFLICTO_VERSION'
      ? (corregirActa.data.error as ConflictoVersion)
      : null;
  const otroError =
    corregirActa.data && !corregirActa.data.ok && corregirActa.data.error.code !== 'CONFLICTO_VERSION'
      ? corregirActa.data.error.message
      : null;

  return (
    <Screen scrollable>
      <Text style={styles.titulo}>Corregir acta</Text>
      <Text style={styles.cardDetalle}>{acta.dignidad === 'ALCALDIA' ? 'Alcaldía' : 'Prefectura'}</Text>

      {organizacionesDignidad.map(({ organizacion, candidato }) => (
        <TextField
          key={organizacion.id}
          label={`${organizacion.siglas} — ${candidato.nombres}`}
          value={votos[organizacion.id] ?? ''}
          onChangeText={(texto) => setVotos((prev) => ({ ...prev, [organizacion.id]: texto }))}
          keyboardType="number-pad"
        />
      ))}
      <TextField label="Votos nulos" value={votosNulos} onChangeText={setVotosNulos} keyboardType="number-pad" />
      <TextField label="Votos en blanco" value={votosBlancos} onChangeText={setVotosBlancos} keyboardType="number-pad" />
      <TextField
        label="Total de sufragantes"
        value={totalSufragantes}
        onChangeText={setTotalSufragantes}
        keyboardType="number-pad"
      />

      {otroError ? <Text style={styles.error}>{otroError}</Text> : null}

      {conflicto ? (
        <View style={styles.conflicto}>
          <Text style={styles.conflictoTitulo}>{conflicto.message}</Text>
          <Text style={styles.cardDetalle}>Versión actual en el servidor (versión {conflicto.versionServidor.version}):</Text>
          <Text style={styles.cardDetalle}>Nulos: {conflicto.versionServidor.votosNulos}</Text>
          <Text style={styles.cardDetalle}>Blancos: {conflicto.versionServidor.votosBlancos}</Text>
          <Text style={styles.cardDetalle}>Total sufragantes: {conflicto.versionServidor.totalSufragantes}</Text>
          <Button
            label="Volver a cargar esta versión"
            variant="outline"
            onPress={() => {
              setActaActual(conflicto.versionServidor);
              setVotos(
                Object.fromEntries(
                  Object.entries(conflicto.versionServidor.votosPorOrganizacion).map(([id, v]) => [id, String(v)])
                )
              );
              setVotosNulos(String(conflicto.versionServidor.votosNulos));
              setVotosBlancos(String(conflicto.versionServidor.votosBlancos));
              setTotalSufragantes(String(conflicto.versionServidor.totalSufragantes));
            }}
          />
        </View>
      ) : null}

      <Button label="Guardar corrección" onPress={guardar} loading={corregirActa.isPending} />
      <Button label="Cancelar" variant="outline" onPress={onVolver} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: { ...typography.h1, color: colors.primary, marginBottom: spacing.md },
  flatList: { flex: 1 },
  lista: { gap: spacing.sm, paddingBottom: spacing.lg },
  vacio: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, gap: spacing.xs },
  cardTitulo: { ...typography.bodyBold, color: colors.textPrimary },
  cardDetalle: { ...typography.caption, color: colors.textSecondary },
  error: { ...typography.body, color: colors.error, textAlign: 'center', marginVertical: spacing.sm },
  conflicto: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.xs,
    marginVertical: spacing.md,
  },
  conflictoTitulo: { ...typography.bodyBold, color: colors.error },
});
