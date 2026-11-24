import { supabase } from '@core/supabase/client';
import { SupabaseTerritorioDatasource } from '../data/datasources/SupabaseTerritorioDatasource';
import { TerritorioRepositoryImpl } from '../data/repositories/TerritorioRepositoryImpl';
import { AgregarRecintoUseCase } from '../domain/use-cases/AgregarRecintoUseCase';

/**
 * Composition root del feature `territorio` (mismo patrón que `authContainer`,
 * ver su comentario de cabecera — ADR-12).
 */
const territorioDatasource = new SupabaseTerritorioDatasource(supabase);
const territorioRepository = new TerritorioRepositoryImpl(territorioDatasource);

export const territorioContainer = {
  territorioRepository,
  agregarRecintoUseCase: new AgregarRecintoUseCase(territorioRepository),
};
