const expoConfig = require('eslint-config-expo/flat');
const boundaries = require('eslint-plugin-boundaries');

/**
 * Regla de dependencia hacia el interior (ADR-12): `domain/` no puede
 * importar nada de `data/`, `presentation/` ni `di/`; `data/` no puede
 * importar de `presentation/` ni `di/`. Rómpela y el lint falla.
 */
module.exports = [
  {
    ignores: ['supabase/functions/**', 'node_modules/**', '.expo/**'],
  },
  ...expoConfig,
  {
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'domain', pattern: 'src/features/*/domain/**' },
        { type: 'data', pattern: 'src/features/*/data/**' },
        { type: 'presentation', pattern: 'src/features/*/presentation/**' },
        { type: 'di', pattern: 'src/features/*/di/**' },
        { type: 'core', pattern: 'src/core/**' },
        { type: 'app', pattern: 'src/app/**' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            {
              from: [{ element: { type: 'domain' } }],
              disallow: [
                { to: { element: { type: 'data' } } },
                { to: { element: { type: 'presentation' } } },
                { to: { element: { type: 'di' } } },
              ],
              message:
                'domain/ no puede depender de data/, presentation/ ni di/ (regla de dependencia hacia el interior, ADR-12).',
            },
            {
              from: [{ element: { type: 'data' } }],
              disallow: [{ to: { element: { type: 'presentation' } } }, { to: { element: { type: 'di' } } }],
              message: 'data/ no puede depender de presentation/ ni di/.',
            },
          ],
        },
      ],
    },
  },
];
