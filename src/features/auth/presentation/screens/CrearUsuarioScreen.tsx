import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Screen, TextField } from '@core/ui';
import { spacing, typography } from '@core/theme';
import { esFormatoCedulaValido } from '@core/validation/cedula';
import { RolUsuario } from '../../domain/entities/Usuario';
import { useCrearUsuario } from '../hooks/useAuth';

const esquema = z.object({
  cedula: z.string().refine(esFormatoCedulaValido, 'Cédula no válida'),
  nombres: z.string().min(2, 'Ingresa los nombres completos'),
  apellidos: z.string().min(2, 'Ingresa los apellidos completos'),
  telefono: z.string().min(7, 'Ingresa un teléfono válido'),
  correo: z.string().email('Correo no válido'),
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
    resolver: zodResolver(esquema),
    defaultValues: { cedula: '', nombres: '', apellidos: '', telefono: '', correo: '' },
  });
  const crearUsuario = useCrearUsuario(rolDeQuienCrea);
  const [claveTemporal, setClaveTemporal] = useState<string | null>(null);

  const onSubmit = handleSubmit((datos) =>
    crearUsuario.mutate(
      { ...datos, rol: rolACrear },
      {
        onSuccess: (resultado) => {
          if (resultado.ok) {
            setClaveTemporal(resultado.value.claveTemporal);
            reset();
          }
        },
      }
    )
  );

  const errorDelServidor =
    crearUsuario.data && !crearUsuario.data.ok ? crearUsuario.data.error.message : null;

  if (claveTemporal) {
    return (
      <Screen>
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
    <Screen>
      <Text style={styles.titulo}>Registrar persona</Text>

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

      {errorDelServidor ? <Text style={styles.errorServidor}>{errorDelServidor}</Text> : null}

      <Button label="Crear cuenta" onPress={onSubmit} loading={crearUsuario.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: { ...typography.h2, marginTop: spacing.lg, marginBottom: spacing.md },
  ayuda: { ...typography.body, marginBottom: spacing.md },
  claveTemporal: { ...typography.h1, textAlign: 'center', marginBottom: spacing.lg },
  errorServidor: { ...typography.body, color: '#D90B1C', textAlign: 'center', marginBottom: spacing.sm },
});
