import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  animaciones,
  Button,
  ButtonGroup,
  Card,
  CheckIcon,
  EncabezadoIlustrado,
  entradaDeBloque,
  haptics,
  RecintoIcon,
  Screen,
  SeccionFormulario,
} from '@core/ui';
import { colors, spacing, typography } from '@core/theme';
import { useRecintos } from '@features/territorio/presentation/hooks/useTerritorio';
import { RolUsuario } from '../../domain/entities/Usuario';
import { useCrearUsuario } from '../hooks/useAuth';
import { CamposPersona, esquemaDatosPersona, VALORES_INICIALES_PERSONA } from '../components/CamposPersona';
import { ClaveTemporalEntregada } from '../components/ClaveTemporalEntregada';

const esquema = esquemaDatosPersona.extend({ recintoId: z.string().optional() });

type FormValues = z.infer<typeof esquema>;

type Props = {
  /** Rol de quien está creando la cuenta (determina el rol del subordinado, RF-01). */
  rolDeQuienCrea: RolUsuario;
  rolACrear: RolUsuario;
  onVolver: () => void;
};

const NOMBRE_ROL: Record<RolUsuario, string> = {
  [RolUsuario.COORDINADOR_PROVINCIAL]: 'coordinador provincial',
  [RolUsuario.COORDINADOR_RECINTO]: 'coordinador de recinto',
  [RolUsuario.VEEDOR]: 'veedor',
};

/**
 * RF-01/RF-03/RF-04: el superior registra al subordinado. El caso de uso
 * (`CrearUsuarioUseCase`) valida formato, existencia real de cédula y
 * correo antes de llegar al servidor.
 */
export function CrearUsuarioScreen({ rolDeQuienCrea, rolACrear, onVolver }: Props) {
  const { control, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(
      esquema.refine((datos) => rolACrear !== RolUsuario.COORDINADOR_RECINTO || !!datos.recintoId, {
        message: 'Selecciona el recinto que va a coordinar',
        path: ['recintoId'],
      })
    ),
    defaultValues: { ...VALORES_INICIALES_PERSONA, recintoId: undefined },
  });
  const recintos = useRecintos();
  const crearUsuario = useCrearUsuario(rolDeQuienCrea);
  const [cuentaCreada, setCuentaCreada] = useState<{ nombre: string; claveTemporal: string } | null>(null);
  const recintoIdSeleccionado = useWatch({ control, name: 'recintoId' });
  const nombreRol = NOMBRE_ROL[rolACrear];

  const onSubmit = handleSubmit(
    (datos) =>
      crearUsuario.mutate(
        { ...datos, rol: rolACrear },
        {
          onSuccess: (resultado) => {
            if (resultado.ok) {
              haptics.exito();
              setCuentaCreada({
                nombre: `${datos.nombres} ${datos.apellidos}`,
                claveTemporal: resultado.value.claveTemporal,
              });
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

  if (cuentaCreada) {
    return (
      <Screen scrollable transicion="aparecer">
        <ClaveTemporalEntregada
          titulo="Cuenta creada"
          descripcion={`${cuentaCreada.nombre} ya puede ingresar como ${nombreRol}.`}
          claveTemporal={cuentaCreada.claveTemporal}
        >
          <ButtonGroup>
            <Button label="Registrar otra persona" onPress={() => setCuentaCreada(null)} />
            <Button label="Volver al inicio" variant="outline" onPress={onVolver} />
          </ButtonGroup>
        </ClaveTemporalEntregada>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <EncabezadoIlustrado
        animacion={animaciones.persona}
        titulo={`Nuevo ${nombreRol}`}
        descripcion="Verificaremos que la cédula y el correo existan antes de crear la cuenta."
        tamano={104}
      />

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

      {rolACrear === RolUsuario.COORDINADOR_RECINTO ? (
        <SeccionFormulario titulo="Recinto a coordinar" icono={<RecintoIcon size={18} />}>
          <Controller
            control={control}
            name="recintoId"
            render={({ field }) => (
              <View style={styles.opciones}>
                {(recintos.data?.ok ? recintos.data.value : []).map((recinto) => {
                  const elegido = recintoIdSeleccionado === recinto.id;
                  return (
                    <Card
                      key={recinto.id}
                      compacta
                      seleccionada={elegido}
                      onPress={() => field.onChange(recinto.id)}
                      accessibilityLabel={`Recinto ${recinto.nombre}`}
                      style={styles.opcion}
                    >
                      <Text style={[styles.opcionTexto, elegido && styles.opcionElegida]}>{recinto.nombre}</Text>
                      {elegido ? (
                        <View style={styles.marca}>
                          <CheckIcon size={11} />
                        </View>
                      ) : null}
                    </Card>
                  );
                })}
                {formState.errors.recintoId ? (
                  <Animated.Text entering={entradaDeBloque} style={styles.error}>
                    {formState.errors.recintoId.message}
                  </Animated.Text>
                ) : null}
              </View>
            )}
          />
        </SeccionFormulario>
      ) : null}

      {errorDelServidor ? (
        <Animated.Text entering={entradaDeBloque} style={styles.errorServidor}>
          {errorDelServidor}
        </Animated.Text>
      ) : null}

      <ButtonGroup>
        <Button label="Crear cuenta" onPress={onSubmit} loading={crearUsuario.isPending} />
      </ButtonGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorServidor: { ...typography.body, color: colors.error, textAlign: 'center', marginBottom: spacing.sm },
  opciones: { gap: spacing.sm, marginBottom: spacing.md },
  opcion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  opcionTexto: { ...typography.body, color: colors.textPrimary, flex: 1 },
  opcionElegida: { color: colors.primary, fontWeight: '700' },
  marca: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { ...typography.caption, color: colors.error },
});
