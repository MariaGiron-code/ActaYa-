import { supabase } from '@core/supabase/client';
import { SupabaseSeguimientoDatasource } from '../data/datasources/SupabaseSeguimientoDatasource';
import { SeguimientoRepositoryImpl } from '../data/repositories/SeguimientoRepositoryImpl';

/** Composition root del feature `seguimiento` (mismo patrón que `authContainer` — ADR-12). */
const seguimientoDatasource = new SupabaseSeguimientoDatasource(supabase);

export const seguimientoContainer = {
  seguimientoRepository: new SeguimientoRepositoryImpl(seguimientoDatasource),
};
