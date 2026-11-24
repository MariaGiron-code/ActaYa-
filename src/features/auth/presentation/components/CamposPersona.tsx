import React from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { z } from 'zod';
import { CorreoIcon, IdentidadIcon, SeccionFormulario, TextField } from '@core/ui';
import { esFormatoCedulaValido } from '@core/validation/cedula';

/**
 * Datos de una persona nueva (RF-03/RF-04). Mismo esquema en todos los
 * lugares donde se crea un usuario, para que validen igual.
 */
export const esquemaDatosPersona = z.object({
  cedula: z.string().refine(esFormatoCedulaValido, 'Cédula no válida'),
  nombres: z.string().min(2, 'Ingresa los nombres completos'),
  apellidos: z.string().min(2, 'Ingresa los apellidos completos'),
  telefono: z.string().min(7, 'Ingresa un teléfono válido'),
  correo: z.string().email('Correo no válido'),
});

export type DatosPersona = z.infer<typeof esquemaDatosPersona>;

export const VALORES_INICIALES_PERSONA: DatosPersona = {
  cedula: '',
  nombres: '',
  apellidos: '',
  telefono: '',
  correo: '',
};

type CamposPersonaProps<T extends FieldValues & DatosPersona> = {
  control: Control<T>;
  errores: Partial<Record<keyof DatosPersona, string>>;
};

/** Campos de una persona agrupados en "Identidad" y "Contacto". */
export function CamposPersona<T extends FieldValues & DatosPersona>({ control, errores }: CamposPersonaProps<T>) {
  const campo = (nombre: keyof DatosPersona) => nombre as Path<T>;

  return (
    <>
      <SeccionFormulario titulo="Identidad" icono={<IdentidadIcon />}>
        <Controller
          control={control}
          name={campo('cedula')}
          render={({ field }) => (
            <TextField
              label="Cédula"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={errores.cedula}
              keyboardType="number-pad"
              maxLength={10}
            />
          )}
        />
        <Controller
          control={control}
          name={campo('nombres')}
          render={({ field }) => (
            <TextField
              label="Nombres"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={errores.nombres}
              autoCapitalize="words"
            />
          )}
        />
        <Controller
          control={control}
          name={campo('apellidos')}
          render={({ field }) => (
            <TextField
              label="Apellidos"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={errores.apellidos}
              autoCapitalize="words"
            />
          )}
        />
      </SeccionFormulario>

      <SeccionFormulario titulo="Contacto" icono={<CorreoIcon />}>
        <Controller
          control={control}
          name={campo('telefono')}
          render={({ field }) => (
            <TextField
              label="Teléfono"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={errores.telefono}
              keyboardType="phone-pad"
            />
          )}
        />
        <Controller
          control={control}
          name={campo('correo')}
          render={({ field }) => (
            <TextField
              label="Correo electrónico"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={errores.correo}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          )}
        />
      </SeccionFormulario>
    </>
  );
}
