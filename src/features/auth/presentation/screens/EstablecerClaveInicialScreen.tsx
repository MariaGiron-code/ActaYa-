import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, haptics, Screen, TextField, toast } from '@core/ui';
import { colors, spacing, typography } from '@core/theme';
import { useCerrarSesion, useEstablecerClaveInicial } from '../hooks/useAuth';

const esquema = z
  .object({
    nuevaClave: z.string().min(8, 'Usa al menos 8 caracteres'),
    confirmacion: z.string(),
  })
  .refine((datos) => datos.nuevaClave === datos.confirmacion, {
    message: 'Las claves no coinciden',
    path: ['confirmacion'],
  });

type FormValues = z.infer<typeof esquema>;

/**
 * RF-02 / S-11: se muestra una sola vez, en el primer ingreso con la clave
 * temporal. Al terminar, quien la creó deja de tener forma de conocerla.
 */
export function EstablecerClaveInicialScreen() {
  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(esquema),
    defaultValues: { nuevaClave: '', confirmacion: '' },
  });
  const establecerClave = useEstablecerClaveInicial();
  const cerrarSesion = useCerrarSesion();

  const onSubmit = handleSubmit(
    ({ nuevaClave, confirmacion }) =>
      establecerClave.mutate(
        { nuevaClave, confirmacion },
        { onSuccess: (r) => (r.ok ? toast.exito('Tu clave personal quedó guardada') : haptics.error()) }
      ),
    () => haptics.error()
  );

  const errorDelServidor =
    establecerClave.data && !establecerClave.data.ok ? establecerClave.data.error.message : null;

  return (
    <Screen scrollable fondoMarca>
      <Text style={styles.titulo}>Crea tu clave personal</Text>
      <Text style={styles.ayuda}>
        A partir de ahora, nadie más que tú conocerá esta clave.
      </Text>

      <Controller
        control={control}
        name="nuevaClave"
        render={({ field }) => (
          <TextField
            label="Nueva clave"
            value={field.value}
            onChangeText={field.onChange}
            errorMessage={formState.errors.nuevaClave?.message}
            secureTextEntry
          />
        )}
      />
      <Controller
        control={control}
        name="confirmacion"
        render={({ field }) => (
          <TextField
            label="Confirma tu clave"
            value={field.value}
            onChangeText={field.onChange}
            errorMessage={formState.errors.confirmacion?.message}
            secureTextEntry
          />
        )}
      />

      {errorDelServidor ? <Text style={styles.errorServidor}>{errorDelServidor}</Text> : null}

      <Button label="Guardar clave" onPress={onSubmit} loading={establecerClave.isPending} />
      <Button
        label="Cancelar e iniciar sesión más tarde"
        variant="outline"
        onPress={() => cerrarSesion.mutate()}
        loading={cerrarSesion.isPending}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: { ...typography.h2, marginTop: spacing.lg },
  ayuda: { ...typography.body, marginBottom: spacing.lg },
  errorServidor: { ...typography.body, color: colors.error, textAlign: 'center', marginBottom: spacing.sm },
});
