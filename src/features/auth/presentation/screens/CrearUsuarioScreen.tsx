import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { animaciones, Button, FeedbackState, haptics, Screen, TextField } from '@core/ui';
import { colors, radius, spacing, typography } from '@core/theme';
import { esFormatoCedulaValido } from '@core/validation/cedula';
import { useRecintos } from '@features/territorio/presentation/hooks/useTerritorio';
import { RolUsuario } from '../../domain/entities/Usuario';
import { useCrearUsuario } from '../hooks/useAuth';

const esquema = z.object({
  cedula: z.string().refine(esFormatoCedulaValido, 'Cédula no válida'),
  nombres: z.string().min(2, 'Ingresa los nombres completos'),
  apellidos: z.string().min(2, 'Ingresa los apellidos completos'),
  telefono: z.string().min(7, 'Ingresa un teléfono válido'),
  correo: z.string().email('Correo no válido'),
  recintoId: z.string().optional(),
});

type FormValues = z.infer<typeof esquema>;

type Props = {
  /** Rol de quien está creando la cuenta (determina el rol del subordinado, RF-01). */
  rolDeQuienCrea: RolUsuario;
  rolACrear: RolUsuario;
};

/**
 * RF-01/RF-03/RF-04: el superior registra al subordinado. El caso de uso
 * (`CrearUsuarioUseCase`) valida formato, existencia real de cédula y
 * correo antes de llegar al servidor.
 */
export function CrearUsuarioScreen({ rolDeQuienCrea, rolACrear }: Props) {
  const { control, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(
      esquema.refine((datos) => rolACrear !== RolUsuario.COORDINADOR_RECINTO || !!datos.recintoId, {
        message: 'Selecciona el recinto que va a coordinar',
        path: ['recintoId'],
      })
    ),
    defaultValues: { cedula: '', nombres: '', apellidos: '', telefono: '', correo: '', recintoId: undefined },
  });
  const recintos = useRecintos();
  const crearUsuario = useCrearUsuario(rolDeQuienCrea);
  const [claveTemporal, setClaveTemporal] = useState<string | null>(null);
  const recintoIdSeleccionado = useWatch({ control, name: 'recintoId' });

  const onSubmit = handleSubmit(
    (datos) =>
      crearUsuario.mutate(
        { ...datos, rol: rolACrear },
        {
          onSuccess: (resultado) => {
            if (resultado.ok) {
              haptics.exito();
              setClaveTemporal(resultado.value.claveTemporal);
              reset();
            } else {
              haptics.error();
            }
          },
        }
      ),
    () => haptics.error()
  );

  const errorDelServidor =
    crearUsuario.data && !crearUsuario.data.ok ? crearUsuario.data.error.message : null;

  if (claveTemporal) {
    return (
      <Screen scrollable>
        <FeedbackState source={animaciones.exito} size={120} />
        <Text style={styles.titulo}>Cuenta creada</Text>
        <Text style={styles.ayuda}>
          Entrega esta clave temporal a la persona. Solo se mostrará esta vez (S-11):
        </Text>
        <Text style={styles.claveTemporal}>{claveTemporal}</Text>
        <Button label="Registrar otra persona" onPress={() => setClaveTemporal(null)} />
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Text style={styles.titulo}>
        {rolACrear === RolUsuario.VEEDOR ? 'Nuevo veedor' : 'Nuevo coordinador de recinto'}
      </Text>

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
          <TextField label="Apellidos" value={field.value} onChangeText={field.onChange} errorMessage={formState.errors.apellidos?.message} />
        )}
      />
      <Controller
        control={control}
        name="telefono"
        render={({ field }) => (
          <TextField label="Teléfono" value={field.value} onChangeText={field.onChange} errorMessage={formState.errors.telefono?.message} keyboardType="phone-pad" />
        )}
      />
      <Controller
        control={control}
        name="correo"
        render={({ field }) => (
          <TextField label="Correo electrónico" value={field.value} onChangeText={field.onChange} errorMessage={formState.errors.correo?.message} autoCapitalize="none" keyboardType="email-address" />
        )}
      />

      {rolACrear === RolUsuario.COORDINADOR_RECINTO ? (
        <Controller
          control={control}
          name="recintoId"
          render={({ field }) => (
            <View style={styles.wrapper}>
              <Text style={styles.label}>Recinto a coordinar</Text>
              {(recintos.data?.ok ? recintos.data.value : []).map((recinto) => (
                <Pressable
                  key={recinto.id}
                  onPress={() => field.onChange(recinto.id)}
                  style={[styles.opcion, recintoIdSeleccionado === recinto.id && styles.opcionSeleccionada]}
                >
                  <Text style={styles.opcionTexto}>{recinto.nombre}</Text>
                </Pressable>
              ))}
              {formState.errors.recintoId ? (
                <Text style={styles.error}>{formState.errors.recintoId.message}</Text>
              ) : null}
            </View>
          )}
        />
      ) : null}

      {errorDelServidor ? <Text style={styles.errorServidor}>{errorDelServidor}</Text> : null}

      <Button label="Crear cuenta" onPress={onSubmit} loading={crearUsuario.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: { ...typography.h2, marginTop: spacing.lg, marginBottom: spacing.md },
  ayuda: { ...typography.body, marginBottom: spacing.md },
  claveTemporal: { ...typography.h1, textAlign: 'center', marginBottom: spacing.lg },
  errorServidor: { ...typography.body, color: colors.error, textAlign: 'center', marginBottom: spacing.sm },
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.xs },
  opcion: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  opcionSeleccionada: { borderColor: colors.primary, backgroundColor: colors.primary + '1A' },
  opcionTexto: { ...typography.body, color: colors.textPrimary },
  error: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
});
