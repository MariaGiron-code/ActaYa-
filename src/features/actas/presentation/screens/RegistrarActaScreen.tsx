import React, { useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import {
  AlertBanner,
  animaciones,
  Button,
  Card,
  ChevronRightIcon,
  DireccionTransicion,
  entradaDeBloque,
  entradaDeVista,
  entradaEnLista,
  FeedbackState,
  haptics,
  Screen,
  StatusBadge,
  TextField,
  toast,
  transicionDeLayout,
  EmptyState,
  UrnaIcon,
} from '@core/ui';
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
  const [transicion, setTransicion] = useState<DireccionTransicion>();
  const alertaDemora = useAlertaDemoraRegistro(usuario?.id ?? null);

  useSincronizarActasAlVolverOnline();

  if (!usuario) return null;

  if (!asignacionSeleccionada) {
    return (
      <Screen transicion={transicion}>
        <Text style={styles.titulo}>Mis mesas</Text>
        <AlertaDemoraBanner alerta={alertaDemora} />
        {misAsignaciones.isLoading ? (
          <FeedbackState
            source={animaciones.cargando}
            message="Cargando tus mesas…"
            loop
          />
        ) : (
          <FlatList
            style={styles.flatList}
            data={misAsignaciones.data?.ok ? misAsignaciones.data.value : []}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <EmptyState
                titulo="Todavía no tienes mesas"
                mensaje="Tu coordinador de recinto te asignará una mesa. Aparecerá aquí."
              />
            }
            renderItem={({ item, index }) => (
              <Card
                entering={entradaEnLista(index)}
                icono={<UrnaIcon />}
                onPress={() => setAsignacionSeleccionada(item)}
                accessibilityLabel="Registrar acta de esta mesa"
                style={styles.cardFila}
              >
                <MesaLabel mesaId={item.mesaId} />
                <View style={styles.accionFila}>
                  <Text style={styles.accionTexto}>Registrar acta</Text>
                  <ChevronRightIcon />
                </View>
              </Card>
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
      onVolver={() => {
        setTransicion('atras');
        setAsignacionSeleccionada(null);
      }}
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
    <AlertBanner
      nivel={alerta.nivel}
      titulo={alerta.nivel === 'critica' ? 'Registro atrasado' : 'Te faltan actas'}
      mensaje={mensaje}
      pulso={alerta.nivel === 'critica'}
    />
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
        <Animated.View key={acta.id} entering={entradaDeBloque} layout={transicionDeLayout} style={styles.filaPendiente}>
          <Text style={styles.cardDetalle}>{acta.dignidad === 'ALCALDIA' ? 'Alcaldía' : 'Prefectura'}</Text>
          <StatusBadge estado={acta.estado} />
        </Animated.View>
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
  const [nitidez, setNitidez] = useState<number | null>(null);
  // Dirección del cambio entre "elegir dignidad" y el formulario de votos.
  const [transicionInterna, setTransicionInterna] = useState<DireccionTransicion>();

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
    setNitidez(null);
    setTransicionInterna('adelante');
    setDignidad(nueva);
  }

  async function capturarEvidencia() {
    const resultado = await capturarFoto.mutateAsync();
    if (resultado.ok) {
      haptics.exito();
      setFotoUri(resultado.value.fotoUri);
      setUbicacion(resultado.value.ubicacion);
      setNitidez(resultado.value.nitidez);
    } else {
      haptics.error();
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
          if (resultado.ok) {
            // RNF-05: se guarda en local primero; el envío se intenta ya y,
            // si no hay señal, se reintenta solo — el badge muestra el estado.
            toast.exito('Acta guardada en el teléfono. Revisa abajo su estado de envío.');
            onVolver();
          } else {
            haptics.error();
          }
        },
      }
    );
  }

  const errorCaptura = capturarFoto.data && !capturarFoto.data.ok ? capturarFoto.data.error.message : null;
  const errorRegistro = registrarActa.data && !registrarActa.data.ok ? registrarActa.data.error.message : null;

  return (
    <Screen scrollable transicion="adelante">
      <Text style={styles.titulo}>{mesa.data?.ok ? `Mesa ${mesa.data.value.numeroJrv}` : 'Registrar acta'}</Text>

      {!dignidad ? (
        <Animated.View
          key="elegir"
          entering={transicionInterna ? entradaDeVista(transicionInterna) : undefined}
          style={styles.acciones}
        >
          <Text style={styles.subtitulo}>¿Qué acta vas a registrar?</Text>
          {DIGNIDADES.map((d) => (
            <Button key={d.valor} label={d.etiqueta} onPress={() => elegirDignidad(d.valor)} />
          ))}
          <Button label="Volver" variant="outline" onPress={onVolver} />
        </Animated.View>
      ) : (
        <Animated.View key={dignidad} entering={transicionInterna ? entradaDeVista(transicionInterna) : undefined}>
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
              <Animated.View key={fotoUri} entering={ZoomIn.duration(260)}>
                <Image source={{ uri: fotoUri }} style={styles.foto} />
                {/* S-12: ayuda a calibrar UMBRAL_NITIDEZ_MINIMO con fotos reales — nunca en el build de entrega. */}
                {__DEV__ && nitidez !== null ? (
                  <Text style={styles.nitidezDebug}>nitidez: {nitidez.toFixed(1)}</Text>
                ) : null}
              </Animated.View>
            ) : (
              <Text style={styles.vacio}>Todavía no has tomado la foto del acta.</Text>
            )}
            <Button
              label={fotoUri ? 'Repetir foto' : 'Tomar foto del acta'}
              variant="outline"
              onPress={capturarEvidencia}
              loading={capturarFoto.isPending}
            />
            {errorCaptura ? (
              <Animated.Text entering={entradaDeBloque} style={styles.error}>
                {errorCaptura}
              </Animated.Text>
            ) : null}

            {errorRegistro ? (
              <Animated.Text entering={entradaDeBloque} style={styles.error}>
                {errorRegistro}
              </Animated.Text>
            ) : null}

            <Button label="Guardar acta" onPress={enviar} loading={registrarActa.isPending} />
            <Button
              label="Cancelar"
              variant="outline"
              onPress={() => {
                setTransicionInterna('atras');
                setDignidad(null);
              }}
            />
          </View>
        </Animated.View>
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
  cardFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accionFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  accionTexto: { ...typography.bodyBold, color: colors.primary },
  cardTitulo: { ...typography.bodyBold, color: colors.textPrimary },
  cardDetalle: { ...typography.body, color: colors.textPrimary },
  acciones: { gap: spacing.sm, marginTop: spacing.sm },
  foto: { width: '100%', height: 220, borderRadius: radius.sm, marginBottom: spacing.xs },
  nitidezDebug: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xs },
  error: { ...typography.caption, color: colors.error, textAlign: 'center' },
  pendientes: { marginTop: spacing.lg, gap: spacing.xs },
  filaPendiente: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
