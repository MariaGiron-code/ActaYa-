import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ActinMascot, AppIcon, Button, Screen, TextField } from '@core/ui';
import { colors, spacing, typography } from '@core/theme';
import { useIniciarSesion } from '../hooks/useAuth';

const esquema = z.object({
  correo: z.string().min(1, 'Ingresa tu correo').email('Correo no válido'),
  clave: z.string().min(1, 'Ingresa tu clave'),
});

type FormValues = z.infer<typeof esquema>;

/**
 * Pantalla de acceso. No hay registro propio (RF-01): solo inicio de
 * sesión y recuperación de clave.
 */
export function LoginScreen({ onIrARecuperar }: { onIrARecuperar: () => void }) {
  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(esquema),
    defaultValues: { correo: '', clave: '' },
  });
  const iniciarSesion = useIniciarSesion();

  const onSubmit = handleSubmit(({ correo, clave }) => iniciarSesion.mutate({ correo, clave }));

  const errorDelServidor = iniciarSesion.data && !iniciarSesion.data.ok ? iniciarSesion.data.error.message : null;

  return (
    <Screen scrollable>
      <View style={styles.marca}>
        <AppIcon size={28} />
        <Text style={styles.titulo}>ActaYa</Text>
      </View>

      <View style={styles.mascota}>
        <ActinMascot size={110} swayBody={false} tapPencil />
      </View>

      <Text style={styles.subtitulo}>Control electoral en tiempo real</Text>

      <View style={styles.formulario}>
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
        <Controller
          control={control}
          name="clave"
          render={({ field }) => (
            <TextField
              label="Clave"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={formState.errors.clave?.message}
              secureTextEntry
            />
          )}
        />

        {errorDelServidor ? <Text style={styles.errorServidor}>{errorDelServidor}</Text> : null}

        <Button label="Ingresar" onPress={onSubmit} loading={iniciarSesion.isPending} />
        <Button label="Olvidé mi clave" variant="outline" onPress={onIrARecuperar} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxl,
  },
  titulo: { ...typography.h1, color: colors.primary },
  mascota: { alignItems: 'center', marginTop: spacing.md },
  subtitulo: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  formulario: { gap: spacing.sm },
  errorServidor: { ...typography.body, color: colors.error, textAlign: 'center', marginBottom: spacing.sm },
});
