import { Directory, File, Paths } from 'expo-file-system';

const actasDirectory = new Directory(Paths.document, 'actas');

function ensureDir(): void {
  if (!actasDirectory.exists) {
    actasDirectory.create();
  }
}

/**
 * Copia la foto tomada (uri temporal de expo-image-picker) a un archivo
 * propio de la app para que sobreviva reinicios (ADR-02: AsyncStorage guarda
 * solo la ruta; el archivo pesado vive en el sistema de archivos).
 *
 * expo-file-system@57 (API nueva, basada en clases File/Directory) hace
 * estas operaciones de forma síncrona para el sistema de archivos local.
 */
export function guardarFotoActa(uriTemporal: string, nombreArchivo: string): string {
  ensureDir();
  const origen = new File(uriTemporal);
  const destino = new File(actasDirectory, nombreArchivo);
  origen.copy(destino);
  return destino.uri;
}

export function eliminarFotoActa(uri: string): void {
  const archivo = new File(uri);
  if (archivo.exists) {
    archivo.delete();
  }
}
