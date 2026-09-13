import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  { ignores: ['./src/launcher/**', './src/modules/**'] },
  {
    files: [
      './src/pages/**',
      './src/widgets/**',
      './src/features/**',
      './src/entities/**',
    ],
    rules: { 'fsd/insignificant-slice': 'off' },
  },
])
