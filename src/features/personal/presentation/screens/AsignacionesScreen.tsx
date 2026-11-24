import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated from 'react-native-reanimated';
import {
  animaciones,
  Button,
  Card,
  entradaDeBloque,
  entradaEnLista,
  FeedbackState,
  haptics,
  Screen,
  toast,
  EmptyState,
  ESPACIO_ENTRE_BOTONES,
  AgregarPersonaIcon,
  ButtonGroup,
} from '@core/ui';
import { colors, spacing, typography } from '@core/theme';
import { useSessionStore } from '@features/auth/presentation/store/useSessionStore';
import { useSubordinados } from '@features/auth/presentation/hooks/useAuth';
import { RolUsuario, Usuario } from '@features/auth/domain/entities/Usuario';
import {
  CamposPersona,
  DatosPersona,
  esquemaDatosPersona,
  VALORES_INICIALES_PERSONA,
} from '@features/auth/presentation/components/CamposPersona';
import { ClaveTemporalEntregada } from '@features/auth/presentation/components/ClaveTemporalEntregada';
import { useMesasDeRecinto } from '@features/territorio/presentation/hooks/useTerritorio';
import { Mesa } from '@features/territorio/domain/entities/Territorio';
import { useAsignacionesDeRecinto, useAsignarVeedor, useReemplazarVeedor } from '../hooks/usePersonal';
import { AsignacionVeedor } from '../../domain/entities/AsignacionVeedor';


/**
 * RF-07/RF-08/S-03: el coordinador de recinto asigna un veedor a cada mesa
 * de su recinto, o reemplaza al veedor actual (con uno existente o con una
 * persona nueva que se da de alta en el momento).
 */
export function AsignacionesScreen() {
  const usuario = useSessionStore((s) => s.usuario);
  const recintoId = usuario?.recintoId ?? null;

  const mesas = useMesasDeRecinto(recintoId);
  const asignaciones = useAsignacionesDeRecinto(recintoId);
  const subordinados = useSubordinados();

  if (!usuario) return null;

  if (!recintoId) {
    return (
      <Screen>
        <EmptyState
          titulo="Aún no tienes un recinto"
          mensaje="Pídele al coordinador provincial que configure el recinto que vas a coordinar."
        />
      </Screen>
    );
  }

  const veedores = subordinados.data?.ok ? subordinados.data.value.filter((u) => u.rol === RolUsuario.VEEDOR) : [];
  const asignacionesActivas = asignaciones.data?.ok ? asignaciones.data.value.filter((a) => a.activa) : [];

  return (
    <Screen>
      <Text style={styles.intro}>Asigna un veedor a cada mesa de tu recinto.</Text>

      {mesas.isLoading || asignaciones.isLoading ? (
        <FeedbackState
          source={animaciones.cargando}
          message="Cargando mesas…"
          loop
        />
      ) : (
        <FlatList
          style={styles.flatList}
          data={mesas.data?.ok ? mesas.data.value : []}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <MesaRow
              indice={index}
              mesa={item}
              asignacionActiva={asignacionesActivas.find((a) => a.mesaId === item.id) ?? null}
              veedores={veedores}
            />
          )}
          ListEmptyComponent={
            <EmptyState titulo="Tu recinto no tiene mesas" mensaje="Las mesas precargadas aparecerán aquí." />
          }
          contentContainerStyle={styles.lista}
        />
      )}
    </Screen>
  );
}

function MesaRow({
  indice,
  mesa,
  asignacionActiva,
  veedores,
}: {
  indice: number;
  mesa: Mesa;
  asignacionActiva: AsignacionVeedor | null;
  veedores: Usuario[];
}) {
  const usuario = useSessionStore((s) => s.usuario)!;
  const [modoEdicion, setModoEdicion] = useState<'ninguno' | 'existente' | 'nuevo'>('ninguno');
  const asignarVeedor = useAsignarVeedor(usuario.rol, usuario.recintoId);
  const reemplazarVeedor = useReemplazarVeedor(usuario.rol, usuario.recintoId);

  const veedorAsignado = asignacionActiva ? veedores.find((v) => v.id === asignacionActiva.veedorId) : null;

  function elegirExistente(veedorId: string) {
    const veedor = veedores.find((v) => v.id === veedorId);
    const nombre = veedor ? `${veedor.nombres} ${veedor.apellidos}` : 'El veedor';
    const alTerminar = (ok: boolean, mensajeExito: string) => {
      if (ok) {
        toast.exito(mensajeExito);
        setModoEdicion('ninguno');
      } else {
        haptics.error();
      }
    };

    if (asignacionActiva) {
      reemplazarVeedor.mutate(
        { asignacionActualId: asignacionActiva.id, reemplazo: { tipo: 'existente', veedorId } },
        { onSuccess: (r) => alTerminar(r.ok, `${nombre} reemplaza al veedor de la mesa ${mesa.numeroJrv}`) }
      );
    } else {
      asignarVeedor.mutate(
        { mesaId: mesa.id, veedorId },
        { onSuccess: (r) => alTerminar(r.ok, `${nombre} quedó asignado a la mesa ${mesa.numeroJrv}`) }
      );
    }
  }

  return (
    <Card entering={entradaEnLista(indice)}>
      <Text style={styles.cardTitulo}>Mesa {mesa.numeroJrv}</Text>
      <Text style={styles.cardDetalle}>
        {veedorAsignado ? `Veedor: ${veedorAsignado.nombres} ${veedorAsignado.apellidos}` : 'Sin veedor asignado'}
      </Text>

      {modoEdicion === 'ninguno' ? (
        <Animated.View key="ninguno" entering={entradaDeBloque} style={styles.acciones}>
          <Button
            label={asignacionActiva ? 'Reemplazar (existente)' : 'Asignar (existente)'}
            variant="outline"
            onPress={() => setModoEdicion('existente')}
          />
          {asignacionActiva ? (
            <Button label="Reemplazar (persona nueva)" variant="outline" onPress={() => setModoEdicion('nuevo')} />
          ) : null}
        </Animated.View>
      ) : modoEdicion === 'existente' ? (
        <Animated.View key="existente" entering={entradaDeBloque} style={styles.acciones}>
          {veedores.length === 0 ? (
            <Text style={styles.vacio}>Aún no has creado ningún veedor.</Text>
          ) : (
            veedores.map((v) => (
              <Card
                key={v.id}
                compacta
                onPress={() => elegirExistente(v.id)}
                accessibilityLabel={`Elegir a ${v.nombres} ${v.apellidos}`}
              >
                <Text style={styles.opcionTexto}>
                  {v.nombres} {v.apellidos}
                </Text>
              </Card>
            ))
          )}
          <Button label="Cancelar" variant="outline" onPress={() => setModoEdicion('ninguno')} />
        </Animated.View>
      ) : (
        <Animated.View key="nuevo" entering={entradaDeBloque}>
          <FormularioVeedorNuevo
            numeroMesa={mesa.numeroJrv}
            asignacionActualId={asignacionActiva!.id}
            reemplazarVeedor={reemplazarVeedor}
            onCancelar={() => setModoEdicion('ninguno')}
            onExito={() => setModoEdicion('ninguno')}
          />
        </Animated.View>
      )}

      {asignarVeedor.data && !asignarVeedor.data.ok ? (
        <Animated.Text entering={entradaDeBloque} style={styles.error}>
          {asignarVeedor.data.error.message}
        </Animated.Text>
      ) : null}
      {reemplazarVeedor.data && !reemplazarVeedor.data.ok ? (
        <Animated.Text entering={entradaDeBloque} style={styles.error}>
          {reemplazarVeedor.data.error.message}
        </Animated.Text>
      ) : null}
    </Card>
  );
}

/**
 * S-03: reemplazar al veedor con una persona nueva. Usa los mismos campos,
 * validaciones y pantalla de éxito que "Crear veedor" (CrearUsuarioScreen),
 * para que crear un usuario se vea igual en toda la app.
 */
function FormularioVeedorNuevo({
  numeroMesa,
  asignacionActualId,
  reemplazarVeedor,
  onCancelar,
  onExito,
}: {
  numeroMesa: string;
  asignacionActualId: string;
  reemplazarVeedor: ReturnType<typeof useReemplazarVeedor>;
  onCancelar: () => void;
  onExito: () => void;
}) {
  const { control, handleSubmit, formState } = useForm<DatosPersona>({
    resolver: zodResolver(esquemaDatosPersona),
    defaultValues: VALORES_INICIALES_PERSONA,
  });
  const [reemplazo, setReemplazo] = useState<{ nombre: string; claveTemporal: string } | null>(null);

  const onSubmit = handleSubmit(
    (datos) =>
      reemplazarVeedor.mutate(
        { asignacionActualId, reemplazo: { tipo: 'nuevo', datos } },
        {
          onSuccess: (r) => {
            if (!r.ok) {
              haptics.error();
              return;
            }
            // S-11: si por algo no viniera la clave, no hay nada que mostrar —
            // se cierra el formulario igual que antes en vez de dejarlo colgado.
            if (r.value.claveTemporal) {
              haptics.exito();
              setReemplazo({ nombre: `${datos.nombres} ${datos.apellidos}`, claveTemporal: r.value.claveTemporal });
            } else {
              toast.exito('Veedor reemplazado');
              onExito();
            }
          },
        }
      ),
    () => haptics.error()
  );

  if (reemplazo) {
    return (
      <ClaveTemporalEntregada
        compacto
        titulo="Veedor reemplazado"
        descripcion={`${reemplazo.nombre} es ahora el veedor de la mesa ${numeroMesa}.`}
        claveTemporal={reemplazo.claveTemporal}
      >
        <ButtonGroup>
          <Button label="Listo" onPress={onExito} />
        </ButtonGroup>
      </ClaveTemporalEntregada>
    );
  }

  return (
    <View style={styles.formularioNuevo}>
      <View style={styles.encabezadoNuevo}>
        <View style={styles.iconoNuevo}>
          <AgregarPersonaIcon />
        </View>
        <View style={styles.textosNuevo}>
          <Text style={styles.tituloNuevo}>Persona nueva</Text>
          <Text style={styles.cardDetalle}>Verificaremos que la cédula y el correo existan.</Text>
        </View>
      </View>

      <CamposPersona
        control={control}
        errores={{
          cedula: formState.errors.cedula?.message,
          nombres: formState.errors.nombres?.message,
          apellidos: formState.errors.apellidos?.message,
          telefono: formState.errors.telefono?.message,
          correo: formState.errors.correo?.message,
        }}
      />

      {reemplazarVeedor.data && !reemplazarVeedor.data.ok ? (
        <Animated.Text entering={entradaDeBloque} style={styles.error}>
          {reemplazarVeedor.data.error.message}
        </Animated.Text>
      ) : null}

      <ButtonGroup>
        <Button label="Crear y reemplazar" onPress={onSubmit} loading={reemplazarVeedor.isPending} />
        <Button label="Cancelar" variant="outline" onPress={onCancelar} />
      </ButtonGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  flatList: { flex: 1 },
  lista: { gap: spacing.sm, paddingBottom: spacing.lg },
  vacio: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
  cardTitulo: { ...typography.bodyBold, color: colors.textPrimary },
  cardDetalle: { ...typography.caption, color: colors.textSecondary },
  acciones: { gap: ESPACIO_ENTRE_BOTONES, marginTop: spacing.sm },
  opcionTexto: { ...typography.body, color: colors.textPrimary },
  error: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
  formularioNuevo: { marginTop: spacing.sm },
  encabezadoNuevo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  iconoNuevo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent + '33',
  },
  textosNuevo: { flex: 1 },
  tituloNuevo: { ...typography.bodyBold, color: colors.primary },
});
