import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, FeedbackState, Screen, TextField } from '@core/ui';
import { colors, radius, spacing, typography } from '@core/theme';
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
        <Text style={styles.vacio}>
          Tu cuenta todavía no tiene un recinto asignado. Pídele al coordinador provincial que lo configure.
        </Text>
      </Screen>
    );
  }

  const veedores = subordinados.data?.ok ? subordinados.data.value.filter((u) => u.rol === RolUsuario.VEEDOR) : [];
  const asignacionesActivas = asignaciones.data?.ok ? asignaciones.data.value.filter((a) => a.activa) : [];

  return (
    <Screen>
      <Text style={styles.titulo}>Mis veedores</Text>

      {mesas.isLoading || asignaciones.isLoading ? (
        <FeedbackState
          source={require('../../../../../assets/lottie/cargando.json')}
          message="Cargando mesas…"
          loop
        />
      ) : (
        <FlatList
          style={styles.flatList}
          data={mesas.data?.ok ? mesas.data.value : []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MesaRow
              mesa={item}
              asignacionActiva={asignacionesActivas.find((a) => a.mesaId === item.id) ?? null}
              veedores={veedores}
            />
          )}
          ListEmptyComponent={<Text style={styles.vacio}>No hay mesas precargadas para tu recinto.</Text>}
          contentContainerStyle={styles.lista}
        />
      )}
    </Screen>
  );
}

function MesaRow({
  mesa,
  asignacionActiva,
  veedores,
}: {
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
    if (asignacionActiva) {
      reemplazarVeedor.mutate(
        { asignacionActualId: asignacionActiva.id, reemplazo: { tipo: 'existente', veedorId } },
        { onSuccess: (r) => r.ok && setModoEdicion('ninguno') }
      );
    } else {
      asignarVeedor.mutate({ mesaId: mesa.id, veedorId }, { onSuccess: (r) => r.ok && setModoEdicion('ninguno') });
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitulo}>Mesa {mesa.numeroJrv}</Text>
      <Text style={styles.cardDetalle}>
        {veedorAsignado ? `Veedor: ${veedorAsignado.nombres} ${veedorAsignado.apellidos}` : 'Sin veedor asignado'}
      </Text>

      {modoEdicion === 'ninguno' ? (
        <View style={styles.acciones}>
          <Button
            label={asignacionActiva ? 'Reemplazar (existente)' : 'Asignar (existente)'}
            variant="outline"
            onPress={() => setModoEdicion('existente')}
          />
          {asignacionActiva ? (
            <Button label="Reemplazar (persona nueva)" variant="outline" onPress={() => setModoEdicion('nuevo')} />
          ) : null}
        </View>
      ) : modoEdicion === 'existente' ? (
        <View style={styles.acciones}>
          {veedores.length === 0 ? (
            <Text style={styles.vacio}>Aún no has creado ningún veedor.</Text>
          ) : (
            veedores.map((v) => (
              <Pressable key={v.id} style={styles.opcion} onPress={() => elegirExistente(v.id)}>
                <Text style={styles.opcionTexto}>
                  {v.nombres} {v.apellidos}
                </Text>
              </Pressable>
            ))
          )}
          <Button label="Cancelar" variant="outline" onPress={() => setModoEdicion('ninguno')} />
        </View>
      ) : (
        <FormularioVeedorNuevo
          asignacionActualId={asignacionActiva!.id}
          reemplazarVeedor={reemplazarVeedor}
          onCancelar={() => setModoEdicion('ninguno')}
          onExito={() => setModoEdicion('ninguno')}
        />
      )}

      {asignarVeedor.data && !asignarVeedor.data.ok ? (
        <Text style={styles.error}>{asignarVeedor.data.error.message}</Text>
      ) : null}
      {reemplazarVeedor.data && !reemplazarVeedor.data.ok ? (
        <Text style={styles.error}>{reemplazarVeedor.data.error.message}</Text>
      ) : null}
    </View>
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

  const onSubmit = handleSubmit((datos) =>
    reemplazarVeedor.mutate(
      { asignacionActualId, reemplazo: { tipo: 'nuevo', datos } },
      { onSuccess: (r) => r.ok && onExito() }
    )
  );

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
  titulo: { ...typography.h1, color: colors.primary, marginBottom: spacing.md },
  flatList: { flex: 1 },
  lista: { gap: spacing.sm, paddingBottom: spacing.lg },
  vacio: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, gap: spacing.xs },
  cardTitulo: { ...typography.bodyBold, color: colors.textPrimary },
  cardDetalle: { ...typography.caption, color: colors.textSecondary },
  acciones: { gap: spacing.xs, marginTop: spacing.sm },
  opcion: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm },
  opcionTexto: { ...typography.body, color: colors.textPrimary },
  error: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
});
