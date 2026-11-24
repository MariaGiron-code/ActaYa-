import { RolUsuario } from '@features/auth/domain/entities/Usuario';

export type AuthStackParamList = {
  Login: undefined;
  RecuperarClave: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  EstablecerClaveInicial: undefined;
  Inicio: undefined;
  Recintos: undefined;
  Asignaciones: undefined;
  RegistrarActa: undefined;
  Seguimiento: undefined;
  CrearUsuario: { rolDeQuienCrea: RolUsuario; rolACrear: RolUsuario };
};
