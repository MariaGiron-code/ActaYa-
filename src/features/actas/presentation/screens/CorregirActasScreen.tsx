import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  AlertBanner,
  animaciones,
  Button,
  Card,
  ChevronRightIcon,
  DireccionTransicion,
  entradaDeBloque,
  entradaEnLista,
  FeedbackState,
  haptics,
  Screen,
  StatusBadge,
  TextField,
  toast,
  ActaIcon,
  EmptyState,
} from '@core/ui';
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
  const [transicion, setTransicion] = useState<DireccionTransicion>();

  if (actaSeleccionada) {
    return (
      <FormularioCorreccion
        acta={actaSeleccionada}
        onVolver={() => {
          setTransicion('atras');
          setActaSeleccionada(null);
        }}
      />
    );
  }

  return (
    <Screen transicion={transicion}>
      <Text style={styles.intro}>Toca un acta para corregir sus votos.</Text>

      {actas.isLoading ? (
        <FeedbackState
          source={animaciones.cargando}
          message="Cargando actas…"
          loop
        />
      ) : actas.data && !actas.data.ok ? (
        <FeedbackState source={animaciones.error} message={actas.data.error.message} />
      ) : (
        <FlatList
          style={styles.flatList}
          data={actas.data?.ok ? actas.data.value : []}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              titulo="No hay actas para corregir"
              mensaje="Cuando se registren actas de tus mesas, aparecerán aquí."
            />
          }
          renderItem={({ item, index }) => (
            <Card
              entering={entradaEnLista(index)}
              icono={<ActaIcon />}
              onPress={() => setActaSeleccionada(item)}
              accessibilityLabel="Corregir esta acta"
            >
              <View style={styles.filaTarjeta}>
                <View style={styles.datosTarjeta}>
                  <MesaLabel mesaId={item.mesaId} />
                  <Text style={styles.cardDetalle}>{item.dignidad === 'ALCALDIA' ? 'Alcaldía' : 'Prefectura'}</Text>
                </View>
                <ChevronRightIcon />
              </View>
              <StatusBadge estado={item.estado} />
            </Card>
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
      {
        onSuccess: (r) => {
          if (r.ok) {
            toast.exito('Corrección guardada');
            onVolver();
          } else if (r.error.code !== 'CONFLICTO_VERSION') {
            // El conflicto ya vibra al mostrarse su AlertBanner.
            haptics.error();
          }
        },
      }
    );
  }

  function cargarVersionDelServidor(versionServidor: Acta) {
    setActaActual(versionServidor);
    setVotos(
      Object.fromEntries(Object.entries(versionServidor.votosPorOrganizacion).map(([id, v]) => [id, String(v)]))
    );
    setVotosNulos(String(versionServidor.votosNulos));
    setVotosBlancos(String(versionServidor.votosBlancos));
    setTotalSufragantes(String(versionServidor.totalSufragantes));
    corregirActa.reset();
    toast.info(`Se cargó la versión ${versionServidor.version} del servidor. Revisa y vuelve a guardar.`);
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
    <Screen scrollable transicion="adelante">
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

      {otroError ? (
        <Animated.Text entering={entradaDeBloque} style={styles.error}>
          {otroError}
        </Animated.Text>
      ) : null}

      {conflicto ? (
        <AlertBanner
          nivel="critica"
          titulo="Alguien guardó otra versión de esta acta"
          mensaje={conflicto.message}
        >
          <View style={styles.tabla}>
            <View style={styles.fila}>
              <Text style={[styles.celda, styles.celdaCampo, styles.encabezado]}>Campo</Text>
              <Text style={[styles.celda, styles.encabezado]}>Tu valor</Text>
              <Text style={[styles.celda, styles.encabezado]}>Servidor (v{conflicto.versionServidor.version})</Text>
            </View>
            {[
              ...organizacionesDignidad.map(({ organizacion }) => ({
                campo: organizacion.siglas,
                tuyo: Number(votos[organizacion.id] ?? '0') || 0,
                servidor: conflicto.versionServidor.votosPorOrganizacion[organizacion.id] ?? 0,
              })),
              { campo: 'Nulos', tuyo: Number(votosNulos) || 0, servidor: conflicto.versionServidor.votosNulos },
              { campo: 'Blancos', tuyo: Number(votosBlancos) || 0, servidor: conflicto.versionServidor.votosBlancos },
              {
                campo: 'Sufragantes',
                tuyo: Number(totalSufragantes) || 0,
                servidor: conflicto.versionServidor.totalSufragantes,
              },
            ].map(({ campo, tuyo, servidor }) => {
              const difiere = tuyo !== servidor;
              return (
                <View key={campo} style={[styles.fila, difiere && styles.filaDifiere]}>
                  <Text style={[styles.celda, styles.celdaCampo]}>{campo}</Text>
                  <Text style={[styles.celda, difiere && styles.celdaDifiere]}>{tuyo}</Text>
                  <Text style={[styles.celda, difiere && styles.celdaDifiere]}>{servidor}</Text>
                </View>
              );
            })}
          </View>
          <Button
            label="Usar la versión del servidor"
            variant="outline"
            onPress={() => cargarVersionDelServidor(conflicto.versionServidor)}
          />
        </AlertBanner>
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
  intro: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  filaTarjeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  datosTarjeta: { gap: spacing.xs },
  cardTitulo: { ...typography.bodyBold, color: colors.textPrimary },
  cardDetalle: { ...typography.caption, color: colors.textSecondary },
  error: { ...typography.body, color: colors.error, textAlign: 'center', marginVertical: spacing.sm },
  tabla: { borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.background, marginVertical: spacing.xs },
  fila: { flexDirection: 'row', paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  filaDifiere: { backgroundColor: colors.error + '14' },
  encabezado: { fontWeight: '700', color: colors.textSecondary },
  celda: { ...typography.caption, flex: 1, color: colors.textPrimary, textAlign: 'right' },
  celdaCampo: { textAlign: 'left' },
  celdaDifiere: { fontWeight: '700', color: colors.error },
});
