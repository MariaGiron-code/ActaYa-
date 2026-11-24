import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  animaciones,
  Button,
  ButtonGroup,
  DireccionTransicion,
  EncabezadoIlustrado,
  entradaDeBloque,
  haptics,
  Screen,
  TextField,
} from '@core/ui';
import { colors, spacing, typography } from '@core/theme';
import { useRecuperarClave } from '../hooks/useAuth';

const esquema = z.object({ correo: z.string().email('Correo no válido') });
type FormValues = z.infer<typeof esquema>;

/** "maria.giron@gmail.com" -> "m•••••••••@gmail.com": confirma el destino sin exponerlo entero. */
function enmascararCorreo(correo: string) {
  const [usuario, dominio] = correo.split('@');
  if (!usuario || !dominio) return correo;
  return `${usuario[0]}${'•'.repeat(Math.max(usuario.length - 1, 2))}@${dominio}`;
}

/** RF-05: nadie depende del coordinador para recuperar su acceso. */
export function RecuperarClaveScreen({
  onVolver,
  transicion,
}: {
  onVolver: () => void;
  transicion?: DireccionTransicion;
}) {
  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(esquema),
    defaultValues: { correo: '' },
  });
  const recuperarClave = useRecuperarClave();
  const [correoEnviado, setCorreoEnviado] = useState<string | null>(null);

  const onSubmit = handleSubmit(
    ({ correo }) =>
      recuperarClave.mutate(correo, {
        onSuccess: (r) => {
          if (r.ok) {
            haptics.exito();
            setCorreoEnviado(correo);
          } else {
            haptics.error();
          }
        },
      }),
    () => haptics.error()
  );

  const errorDelServidor =
    recuperarClave.data && !recuperarClave.data.ok ? recuperarClave.data.error.message : null;

  if (correoEnviado) {
    return (
      <Screen scrollable transicion="aparecer" fondoMarca>
        <EncabezadoIlustrado
          animacion={animaciones.correo}
          titulo="Revisa tu correo"
          descripcion={`Enviamos un enlace a ${enmascararCorreo(correoEnviado)} para que crees una clave nueva. Si no lo ves en unos minutos, revisa la carpeta de spam.`}
        />
        <ButtonGroup>
          <Button label="Volver al inicio" variant="outline" onPress={onVolver} />
        </ButtonGroup>
      </Screen>
    );
  }

  return (
    <Screen scrollable transicion={transicion} fondoMarca>
      <EncabezadoIlustrado
        animacion={animaciones.llave}
        titulo="Recuperar acceso"
        descripcion="Escribe el correo de tu cuenta y te enviaremos un enlace para crear una clave nueva."
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
            autoComplete="email"
          />
        )}
      />
      {errorDelServidor ? (
        <Animated.Text entering={entradaDeBloque} style={styles.errorServidor}>
          {errorDelServidor}
        </Animated.Text>
      ) : null}

      <ButtonGroup>
        <Button label="Enviar enlace de recuperación" onPress={onSubmit} loading={recuperarClave.isPending} />
        <Button label="Volver" variant="outline" onPress={onVolver} />
      </ButtonGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorServidor: { ...typography.body, color: colors.error, textAlign: 'center', marginBottom: spacing.sm },
});
