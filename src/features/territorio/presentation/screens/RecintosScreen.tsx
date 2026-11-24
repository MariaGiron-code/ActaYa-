import React, { useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
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
  RecintoIcon,
  ButtonGroup,
} from '@core/ui';
import { colors, spacing, typography } from '@core/theme';
import { useSessionStore, selectRol } from '@features/auth/presentation/store/useSessionStore';
import { RolUsuario } from '@features/auth/domain/entities/Usuario';
import { useAgregarRecinto, useRecintos } from '../hooks/useTerritorio';
import { Recinto } from '../../domain/entities/Territorio';

const esquema = z.object({
  provincia: z.string().min(1, 'Ingresa la provincia'),
  canton: z.string().min(1, 'Ingresa el cantón'),
  parroquia: z.string().min(1, 'Ingresa la parroquia'),
  nombre: z.string().min(1, 'Ingresa el nombre del recinto'),
});

type FormValues = z.infer<typeof esquema>;

/**
 * RF-06: lista de recintos precargados, con formulario para agregar uno
 * nuevo visible solo para el coordinador provincial.
 */
export function RecintosScreen() {
  const rol = useSessionStore(selectRol);
  const recintos = useRecintos();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  return (
    <Screen>
      <Text style={styles.intro}>Recintos electorales habilitados para la jornada.</Text>

      {recintos.isLoading ? (
        <FeedbackState source={animaciones.cargando} message="Cargando recintos…" loop />
      ) : recintos.data && !recintos.data.ok ? (
        <FeedbackState
          source={animaciones.error}
          message={recintos.data.error.message}
        />
      ) : (
        <FlatList
          style={styles.flatList}
          data={recintos.data?.value ?? []}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState titulo="Aún no hay recintos" mensaje="Los recintos precargados aparecerán aquí." />
          }
          renderItem={({ item, index }) => <RecintoCard recinto={item} indice={index} />}
          contentContainerStyle={styles.lista}
        />
      )}

      {rol === RolUsuario.COORDINADOR_PROVINCIAL ? (
        mostrarFormulario ? (
          <FormularioAgregarRecinto onCerrar={() => setMostrarFormulario(false)} />
        ) : (
          <Button label="Agregar recinto" onPress={() => setMostrarFormulario(true)} />
        )
      ) : null}
    </Screen>
  );
}

function RecintoCard({ recinto, indice }: { recinto: Recinto; indice: number }) {
  return (
    <Card entering={entradaEnLista(indice)} icono={<RecintoIcon />}>
      <Text style={styles.cardNombre}>{recinto.nombre}</Text>
      <Text style={styles.cardDetalle}>
        {recinto.parroquia}, {recinto.canton} — {recinto.provincia}
      </Text>
    </Card>
  );
}

function FormularioAgregarRecinto({ onCerrar }: { onCerrar: () => void }) {
  const rol = useSessionStore(selectRol) ?? RolUsuario.COORDINADOR_PROVINCIAL;
  const { control, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(esquema),
    defaultValues: { provincia: '', canton: '', parroquia: '', nombre: '' },
  });
  const agregarRecinto = useAgregarRecinto(rol);

  const onSubmit = handleSubmit(
    (datos) => {
      agregarRecinto.mutate(datos, {
        onSuccess: (resultado) => {
          if (resultado.ok) {
            toast.exito(`Recinto «${datos.nombre}» agregado`);
            reset();
            onCerrar();
          } else {
            haptics.error();
          }
        },
      });
    },
    () => haptics.error()
  );

  const errorDelServidor =
    agregarRecinto.data && !agregarRecinto.data.ok ? agregarRecinto.data.error.message : null;

  return (
    <Animated.View entering={entradaDeBloque} style={styles.formulario}>
      <Controller
        control={control}
        name="provincia"
        render={({ field }) => (
          <TextField
            label="Provincia"
            value={field.value}
            onChangeText={field.onChange}
            errorMessage={formState.errors.provincia?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="canton"
        render={({ field }) => (
          <TextField
            label="Cantón"
            value={field.value}
            onChangeText={field.onChange}
            errorMessage={formState.errors.canton?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="parroquia"
        render={({ field }) => (
          <TextField
            label="Parroquia"
            value={field.value}
            onChangeText={field.onChange}
            errorMessage={formState.errors.parroquia?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="nombre"
        render={({ field }) => (
          <TextField
            label="Nombre del recinto"
            value={field.value}
            onChangeText={field.onChange}
            errorMessage={formState.errors.nombre?.message}
          />
        )}
      />

      {errorDelServidor ? <Text style={styles.errorServidor}>{errorDelServidor}</Text> : null}

      <ButtonGroup>
        <Button label="Guardar" onPress={onSubmit} loading={agregarRecinto.isPending} />
        <Button label="Cancelar" variant="outline" onPress={onCerrar} />
      </ButtonGroup>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  titulo: { ...typography.h1, color: colors.primary, marginBottom: spacing.md },
  flatList: { flex: 1 },
  lista: { gap: spacing.sm, paddingBottom: spacing.lg },
  intro: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  cardNombre: { ...typography.bodyBold, color: colors.textPrimary },
  cardDetalle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  formulario: { gap: spacing.sm, marginTop: spacing.md },
  errorServidor: { ...typography.body, color: colors.error, textAlign: 'center', marginBottom: spacing.sm },
});
