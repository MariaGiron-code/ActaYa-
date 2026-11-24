import { supabase } from '@core/supabase/client';
import { LocalActasDatasource } from '../data/datasources/LocalActasDatasource';
import { SupabaseActasDatasource } from '../data/datasources/SupabaseActasDatasource';
import { DeviceCapturaDatasource } from '../data/datasources/DeviceCapturaDatasource';
import { ActasRepositoryImpl } from '../data/repositories/ActasRepositoryImpl';
import { CapturaRepositoryImpl } from '../data/repositories/CapturaRepositoryImpl';
import { RegistrarActaUseCase } from '../domain/use-cases/RegistrarActaUseCase';
import { CorregirActaUseCase } from '../domain/use-cases/CorregirActaUseCase';
import { SincronizarActasPendientesUseCase } from '../domain/use-cases/SincronizarActasPendientesUseCase';
import { CapturarFotoActaUseCase } from '../domain/use-cases/CapturarFotoActaUseCase';

/**
 * Composition root del feature `actas` (mismo patrón que `authContainer` —
 * ADR-12).
 */
const localDatasource = new LocalActasDatasource();
const remoteDatasource = new SupabaseActasDatasource(supabase);
const capturaDatasource = new DeviceCapturaDatasource();

const actasRepository = new ActasRepositoryImpl(localDatasource, remoteDatasource);
const capturaRepository = new CapturaRepositoryImpl(capturaDatasource);

export const actasContainer = {
  actasRepository,
  capturaRepository,
  registrarActaUseCase: new RegistrarActaUseCase(actasRepository),
  corregirActaUseCase: new CorregirActaUseCase(actasRepository),
  sincronizarActasPendientesUseCase: new SincronizarActasPendientesUseCase(actasRepository),
  capturarFotoActaUseCase: new CapturarFotoActaUseCase(capturaRepository),
};
