/**
 * Escala tipográfica única. RNF-03 pide una interfaz sencilla y legible para
 * personas mayores o con poca experiencia en tecnología: tamaños generosos,
 * jerarquía clara, sin texto diminuto.
 */
export const typography = {
  fontFamily: undefined, // usar la fuente nativa del sistema por ahora
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 16, fontWeight: '700' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  button: { fontSize: 16, fontWeight: '700' as const, lineHeight: 20 },
};
