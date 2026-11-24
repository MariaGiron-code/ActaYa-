import { supabase } from '@core/supabase/client';
import { authContainer } from '@features/auth/di/authContainer';
import { SupabasePersonalDatasource } from '../data/datasources/SupabasePersonalDatasource';
import { PersonalRepositoryImpl } from '../data/repositories/PersonalRepositoryImpl';
import { AsignarVeedorUseCase } from '../domain/use-cases/AsignarVeedorUseCase';
import { ReemplazarVeedorUseCase } from '../domain/use-cases/ReemplazarVeedorUseCase';

/**
 * Composition root del feature `personal` (mismo patrón que
 * `authContainer`/`territorioContainer`, ver su comentario de cabecera —
 * ADR-12). Reutiliza `authContainer.crearUsuarioUseCase` en vez de
 * instanciarlo de nuevo, para no duplicar su cableado de verificación.
 */
const personalDatasource = new SupabasePersonalDatasource(supabase);
const personalRepository = new PersonalRepositoryImpl(personalDatasource);

export const personalContainer = {
  personalRepository,
  asignarVeedorUseCase: new AsignarVeedorUseCase(personalRepository),
  reemplazarVeedorUseCase: new ReemplazarVeedorUseCase(personalRepository, authContainer.crearUsuarioUseCase),
};
