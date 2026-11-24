import React, { useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { Button, FeedbackState, Screen, StatusBadge, TextField } from '@core/ui';
import { colors, radius, spacing, typography } from '@core/theme';
import { useSessionStore } from '@features/auth/presentation/store/useSessionStore';
import { useMisAsignaciones } from '@features/personal/presentation/hooks/usePersonal';
import { AsignacionVeedor } from '@features/personal/domain/entities/AsignacionVeedor';
import { useMesa, useOrganizacionesConCandidatos } from '@features/territorio/presentation/hooks/useTerritorio';
import { Dignidad } from '@features/territorio/domain/entities/Territorio';
import {
  useActasPendientes,
  useAlertaDemoraRegistro,
  useCapturarFotoActa,
  useRegistrarActa,
  useSincronizarActasAlVolverOnline,
} from '../hooks/useActas';
import { Ubicacion } from '../../domain/entities/Acta';

const DIGNIDADES: { valor: Dignidad; etiqueta: string }[] = [
  { valor: 'ALCALDIA', etiqueta: 'Alcaldía' },
  { valor: 'PREFECTURA', etiqueta: 'Prefectura' },
];

/**
 * RF-09 a RF-14: el veedor elige una de sus mesas asignadas, la dignidad,
 * registra los votos, toma la foto (rechaza las borrosas, ADR-06) y la
 * ubicación, y guarda — todo esto en local de inmediato (RNF-05); el envío
 * real lo hace `useSincronizarActasAlVolverOnline` en cuanto hay señal.
 */
export function RegistrarActaScreen() {
  const usuario = useSessionStore((s) => s.usuario);
  const misAsignaciones = useMisAsignaciones(usuario?.id ?? null);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState<AsignacionVeedor | null>(null);
  const alertaDemora = useAlertaDemoraRegistro(usuario?.id ?? null);

  useSincronizarActasAlVolverOnline();

  if (!usuario) return null;

  if (!asignacionSeleccionada) {
    return (
      <Screen>
        <Text style={styles.titulo}>Mis mesas</Text>
        <AlertaDemoraBanner alerta={alertaDemora} />
        {misAsignaciones.isLoading ? (
          <FeedbackState
            source={require('../../../../../assets/lottie/cargando.json')}
            message="Cargando tus mesas…"
            loop
          />
        ) : (
          <FlatList
            style={styles.flatList}
            data={misAsignaciones.data?.ok ? misAsignaciones.data.value : []}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.vacio}>Todavía no tienes mesas asignadas.</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <MesaLabel mesaId={item.mesaId} />
                <Button label="Registrar acta" onPress={() => setAsignacionSeleccionada(item)} />
              </View>
            )}
            ListFooterComponent={<ListaPendientes />}
            contentContainerStyle={styles.lista}
          />
        )}
      </Screen>
    );
  }

  return (
    <FormularioActa
      asignacion={asignacionSeleccionada}
      registradoPorId={usuario.id}
      onVolver={() => setAsignacionSeleccionada(null)}
    />
  );
}

/** S-06: oculta el banner si no hace falta (nivel 'ninguna' — ya registró todo o aún no pasó el margen). */
function AlertaDemoraBanner({ alerta }: { alerta: ReturnType<typeof useAlertaDemoraRegistro> }) {
  if (alerta.nivel === 'ninguna') return null;

  const plural = alerta.actasFaltantes === 1 ? 'acta' : 'actas';
  const mensaje =
    alerta.nivel === 'critica'
      ? `Han pasado ${alerta.minutosDesdeCierre} minutos desde el cierre y todavía te faltan ${alerta.actasFaltantes} ${plural} por registrar. Si tuviste un problema, avisa al coordinador de tu recinto en cuanto tengas señal.`
      : `Ya cerró la votación y todavía te faltan ${alerta.actasFaltantes} ${plural} por registrar. Hazlo cuanto antes.`;

  return (
    <View style={[styles.alerta, alerta.nivel === 'critica' ? styles.alertaCritica : styles.alertaAdvertencia]}>
      <Text style={styles.alertaTexto}>{mensaje}</Text>
    </View>
  );
}

function MesaLabel({ mesaId }: { mesaId: string }) {
  const mesa = useMesa(mesaId);
  const numero = mesa.data?.ok ? mesa.data.value.numeroJrv : '…';
  return <Text style={styles.cardTitulo}>Mesa {numero}</Text>;
}

function ListaPendientes() {
  const pendientes = useActasPendientes();
  const actas = pendientes.data?.ok ? pendientes.data.value : [];

  if (actas.length === 0) return null;

  return (
    <View style={styles.pendientes}>
      <Text style={styles.subtitulo}>Actas pendientes de envío</Text>
      {actas.map((acta) => (
        <View key={acta.id} style={styles.filaPendiente}>
          <Text style={styles.cardDetalle}>{acta.dignidad === 'ALCALDIA' ? 'Alcaldía' : 'Prefectura'}</Text>
          <StatusBadge estado={acta.estado} />
        </View>
      ))}
    </View>
  );
}

function FormularioActa({
  asignacion,
  registradoPorId,
  onVolver,
}: {
  asignacion: AsignacionVeedor;
  registradoPorId: string;
  onVolver: () => void;
}) {
  const mesa = useMesa(asignacion.mesaId);
  const organizaciones = useOrganizacionesConCandidatos();
  const capturarFoto = useCapturarFotoActa();
  const registrarActa = useRegistrarActa();

  const [dignidad, setDignidad] = useState<Dignidad | null>(null);
  const [votos, setVotos] = useState<Record<string, string>>({});
  const [votosNulos, setVotosNulos] = useState('0');
  const [votosBlancos, setVotosBlancos] = useState('0');
  const [totalSufragantes, setTotalSufragantes] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);

  const organizacionesDignidad = useMemo(() => {
    if (!dignidad || !organizaciones.data?.ok) return [];
    return organizaciones.data.value
      .map(({ organizacion, candidatos }) => ({
        organizacion,
        candidato: candidatos.find((c) => c.dignidad === dignidad),
      }))
      .filter((o): o is { organizacion: typeof o.organizacion; candidato: NonNullable<typeof o.candidato> } =>
        Boolean(o.candidato)
      );
  }, [dignidad, organizaciones.data]);

  function elegirDignidad(nueva: Dignidad) {
    // Cada dignidad es un acta distinta con su propia foto física: si no se
    // limpia esto, al cancelar una y elegir la otra quedaban los votos y la
    // foto de la primera precargados en el formulario de la segunda.
    setVotos({});
    setVotosNulos('0');
    setVotosBlancos('0');
    setTotalSufragantes('');
    setFotoUri(null);
    setUbicacion(null);
    setDignidad(nueva);
  }

  async function capturarEvidencia() {
    const resultado = await capturarFoto.mutateAsync();
    if (resultado.ok) {
      setFotoUri(resultado.value.fotoUri);
      setUbicacion(resultado.value.ubicacion);
    }
  }

  function enviar() {
    if (!dignidad) return;
    const votosPorOrganizacion: Record<string, number> = {};
    for (const { organizacion } of organizacionesDignidad) {
      votosPorOrganizacion[organizacion.id] = Number(votos[organizacion.id] ?? '0') || 0;
    }

    registrarActa.mutate(
      {
        mesaId: asignacion.mesaId,
        dignidad,
        votosPorOrganizacion,
        votosNulos: Number(votosNulos) || 0,
        votosBlancos: Number(votosBlancos) || 0,
        totalSufragantes: Number(totalSufragantes) || 0,
        fotoUri,
        ubicacion,
        registradoPorId,
      },
      {
        onSuccess: (resultado) => {
          if (resultado.ok) onVolver();
        },
      }
    );
  }

  const errorCaptura = capturarFoto.data && !capturarFoto.data.ok ? capturarFoto.data.error.message : null;
  const errorRegistro = registrarActa.data && !registrarActa.data.ok ? registrarActa.data.error.message : null;

  return (
    <Screen scrollable>
      <Text style={styles.titulo}>{mesa.data?.ok ? `Mesa ${mesa.data.value.numeroJrv}` : 'Registrar acta'}</Text>

      {!dignidad ? (
        <View style={styles.acciones}>
          <Text style={styles.subtitulo}>¿Qué acta vas a registrar?</Text>
          {DIGNIDADES.map((d) => (
            <Button key={d.valor} label={d.etiqueta} onPress={() => elegirDignidad(d.valor)} />
          ))}
          <Button label="Volver" variant="outline" onPress={onVolver} />
        </View>
      ) : (
        <>
          <Text style={styles.subtitulo}>Votos por organización — {dignidad === 'ALCALDIA' ? 'Alcaldía' : 'Prefectura'}</Text>
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

          <View style={styles.acciones}>
            {fotoUri ? (
              <Image source={{ uri: fotoUri }} style={styles.foto} />
            ) : (
              <Text style={styles.vacio}>Todavía no has tomado la foto del acta.</Text>
            )}
            <Button
              label={fotoUri ? 'Repetir foto' : 'Tomar foto del acta'}
              variant="outline"
              onPress={capturarEvidencia}
              loading={capturarFoto.isPending}
            />
            {errorCaptura ? <Text style={styles.error}>{errorCaptura}</Text> : null}

            {errorRegistro ? <Text style={styles.error}>{errorRegistro}</Text> : null}

            <Button label="Guardar acta" onPress={enviar} loading={registrarActa.isPending} />
            <Button label="Cancelar" variant="outline" onPress={() => setDignidad(null)} />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: { ...typography.h1, color: colors.primary, marginBottom: spacing.md },
  subtitulo: { ...typography.h3, marginBottom: spacing.sm },
  flatList: { flex: 1 },
  lista: { gap: spacing.sm, paddingBottom: spacing.lg },
  vacio: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.sm },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, gap: spacing.xs },
  cardTitulo: { ...typography.bodyBold, color: colors.textPrimary },
  cardDetalle: { ...typography.body, color: colors.textPrimary },
  acciones: { gap: spacing.sm, marginTop: spacing.sm },
  foto: { width: '100%', height: 220, borderRadius: radius.sm, marginBottom: spacing.xs },
  error: { ...typography.caption, color: colors.error, textAlign: 'center' },
  pendientes: { marginTop: spacing.lg, gap: spacing.xs },
  filaPendiente: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alerta: { borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1 },
  alertaAdvertencia: { backgroundColor: colors.warning + '26', borderColor: colors.warning },
  alertaCritica: { backgroundColor: colors.error + '26', borderColor: colors.error },
  alertaTexto: { ...typography.body, color: colors.textPrimary },
});
