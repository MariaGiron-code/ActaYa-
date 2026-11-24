import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  TextField,
  toast,
  EmptyState,
} from '@core/ui';
import { colors, spacing, typography } from '@core/theme';
import { esFormatoCedulaValido } from '@core/validation/cedula';
import { useSessionStore } from '@features/auth/presentation/store/useSessionStore';
import { useSubordinados } from '@features/auth/presentation/hooks/useAuth';
import { RolUsuario, Usuario } from '@features/auth/domain/entities/Usuario';
import { useMesasDeRecinto } from '@features/territorio/presentation/hooks/useTerritorio';
import { Mesa } from '@features/territorio/domain/entities/Territorio';
import { useAsignacionesDeRecinto, useAsignarVeedor, useReemplazarVeedor } from '../hooks/usePersonal';
import { AsignacionVeedor } from '../../domain/entities/AsignacionVeedor';

const esquemaNuevo = z.object({
  cedula: z.string().refine(esFormatoCedulaValido, 'Cédula no válida'),
  nombres: z.string().min(2, 'Ingresa los nombres completos'),
  apellidos: z.string().min(2, 'Ingresa los apellidos completos'),
  telefono: z.string().min(7, 'Ingresa un teléfono válido'),
  correo: z.string().email('Correo no válido'),
});

type FormNuevo = z.infer<typeof esquemaNuevo>;

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

function FormularioVeedorNuevo({
  asignacionActualId,
  reemplazarVeedor,
  onCancelar,
  onExito,
}: {
  asignacionActualId: string;
  reemplazarVeedor: ReturnType<typeof useReemplazarVeedor>;
  onCancelar: () => void;
  onExito: () => void;
}) {
  const { control, handleSubmit, formState } = useForm<FormNuevo>({
    resolver: zodResolver(esquemaNuevo),
    defaultValues: { cedula: '', nombres: '', apellidos: '', telefono: '', correo: '' },
  });
  const [claveTemporal, setClaveTemporal] = useState<string | null>(null);

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
              setClaveTemporal(r.value.claveTemporal);
            } else {
              toast.exito('Veedor reemplazado');
              onExito();
            }
          },
        }
      ),
    () => haptics.error()
  );

  if (claveTemporal) {
    return (
      <View style={styles.acciones}>
        <Text style={styles.cardDetalle}>
          Entrega esta clave temporal a la persona para que pueda ingresar y reemplazar al veedor anterior. Solo se
          mostrará esta vez (S-11):
        </Text>
        <Text style={styles.claveTemporal}>{claveTemporal}</Text>
        <Button label="Listo" onPress={onExito} />
      </View>
    );
  }

  return (
    <View style={styles.acciones}>
      <Controller
        control={control}
        name="cedula"
        render={({ field }) => (
          <TextField
            label="Cédula"
            value={field.value}
            onChangeText={field.onChange}
            errorMessage={formState.errors.cedula?.message}
            keyboardType="number-pad"
            maxLength={10}
          />
        )}
      />
      <Controller
        control={control}
        name="nombres"
        render={({ field }) => (
          <TextField label="Nombres" value={field.value} onChangeText={field.onChange} errorMessage={formState.errors.nombres?.message} />
        )}
      />
      <Controller
        control={control}
        name="apellidos"
        render={({ field }) => (
          <TextField
            label="Apellidos"
            value={field.value}
            onChangeText={field.onChange}
            errorMessage={formState.errors.apellidos?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="telefono"
        render={({ field }) => (
          <TextField
            label="Teléfono"
            value={field.value}
            onChangeText={field.onChange}
            errorMessage={formState.errors.telefono?.message}
            keyboardType="phone-pad"
          />
        )}
      />
      <Controller
        control={control}
        name="correo"
        render={({ field }) => (
          <TextField
            label="Correo electrónico"
            value={field.value}
            onChangeText={field.onChange}
            errorMessage={formState.errors.correo?.message}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        )}
      />
      {reemplazarVeedor.data && !reemplazarVeedor.data.ok ? (
        <Text style={styles.error}>{reemplazarVeedor.data.error.message}</Text>
      ) : null}

      <Button label="Crear y reemplazar" onPress={onSubmit} loading={reemplazarVeedor.isPending} />
      <Button label="Cancelar" variant="outline" onPress={onCancelar} />
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
  acciones: { gap: spacing.xs, marginTop: spacing.sm },
  opcionTexto: { ...typography.body, color: colors.textPrimary },
  error: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
  claveTemporal: { ...typography.h2, color: colors.primary, textAlign: 'center', marginVertical: spacing.sm },
});
