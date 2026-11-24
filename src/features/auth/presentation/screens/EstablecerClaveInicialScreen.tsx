import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  animaciones,
  Button,
  ButtonGroup,
  EncabezadoIlustrado,
  entradaDeBloque,
  haptics,
  Screen,
  TextField,
  toast,
} from '@core/ui';
import { colors, spacing, typography } from '@core/theme';
import { useCerrarSesion, useEstablecerClaveInicial } from '../hooks/useAuth';
import { useSessionStore } from '../store/useSessionStore';
import { LARGO_MINIMO_CLAVE, RequisitosClave } from '../components/RequisitosClave';

const esquema = z
  .object({
    nuevaClave: z.string().min(LARGO_MINIMO_CLAVE, `Usa al menos ${LARGO_MINIMO_CLAVE} caracteres`),
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
 * También se usa al volver del enlace de "olvidé mi clave" (RF-05/S-08).
 */
export function EstablecerClaveInicialScreen() {
  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(esquema),
    defaultValues: { nuevaClave: '', confirmacion: '' },
  });
  const establecerClave = useEstablecerClaveInicial();
  const cerrarSesion = useCerrarSesion();
  const enRecuperacion = useSessionStore((s) => s.enRecuperacion);
  const nuevaClave = useWatch({ control, name: 'nuevaClave' });
  const confirmacion = useWatch({ control, name: 'confirmacion' });

  const onSubmit = handleSubmit(
    ({ nuevaClave: clave, confirmacion: confirmada }) =>
      establecerClave.mutate(
        { nuevaClave: clave, confirmacion: confirmada },
        { onSuccess: (r) => (r.ok ? toast.exito('Tu clave personal quedó guardada') : haptics.error()) }
      ),
    () => haptics.error()
  );

  const errorDelServidor =
    establecerClave.data && !establecerClave.data.ok ? establecerClave.data.error.message : null;

  return (
    <Screen scrollable fondoMarca>
      <EncabezadoIlustrado
        animacion={animaciones.candado}
        titulo={enRecuperacion ? 'Crea una clave nueva' : 'Crea tu clave personal'}
        descripcion={
          enRecuperacion
            ? 'Elige una clave nueva para tu cuenta. La anterior dejará de funcionar.'
            : 'A partir de ahora, nadie más que tú conocerá esta clave.'
        }
      />

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
            autoComplete="new-password"
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
            autoComplete="new-password"
          />
        )}
      />

      <RequisitosClave clave={nuevaClave} confirmacion={confirmacion} />

      {errorDelServidor ? (
        <Animated.Text entering={entradaDeBloque} style={styles.errorServidor}>
          {errorDelServidor}
        </Animated.Text>
      ) : null}

      <ButtonGroup>
        <Button label="Guardar clave" onPress={onSubmit} loading={establecerClave.isPending} />
        <Button
          label="Cancelar e iniciar sesión más tarde"
          variant="outline"
          onPress={() => cerrarSesion.mutate()}
          loading={cerrarSesion.isPending}
        />
      </ButtonGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorServidor: { ...typography.body, color: colors.error, textAlign: 'center', marginBottom: spacing.sm },
});
