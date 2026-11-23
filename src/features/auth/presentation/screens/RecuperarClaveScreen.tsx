import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Screen, TextField } from '@core/ui';
import { spacing, typography } from '@core/theme';
import { useRecuperarClave } from '../hooks/useAuth';

const esquema = z.object({ correo: z.string().email('Correo no válido') });
type FormValues = z.infer<typeof esquema>;

/** RF-05: nadie depende del coordinador para recuperar su acceso. */
export function RecuperarClaveScreen({ onVolver }: { onVolver: () => void }) {
  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(esquema),
    defaultValues: { correo: '' },
  });
  const recuperarClave = useRecuperarClave();
  const [enviado, setEnviado] = useState(false);

  const onSubmit = handleSubmit(({ correo }) =>
    recuperarClave.mutate(correo, { onSuccess: (r) => r.ok && setEnviado(true) })
  );

  if (enviado) {
    return (
      <Screen>
        <Text style={styles.titulo}>Revisa tu correo</Text>
        <Text style={styles.ayuda}>Te enviamos un enlace para crear una nueva clave.</Text>
        <Button label="Volver al inicio" variant="outline" onPress={onVolver} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.titulo}>Recuperar acceso</Text>
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
      <Button label="Enviar enlace de recuperación" onPress={onSubmit} loading={recuperarClave.isPending} />
      <Button label="Volver" variant="outline" onPress={onVolver} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: { ...typography.h2, marginTop: spacing.lg, marginBottom: spacing.md },
  ayuda: { ...typography.body, marginBottom: spacing.lg },
});
