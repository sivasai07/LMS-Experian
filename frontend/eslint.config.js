import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Context files export both the context object and the provider component — this is standard.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Initialising form state from props / firing async fetches inside effects is a common
      // and accepted pattern in this codebase. The strict set-state-in-effect rule produces
      // many false positives here, so we downgrade it to a warning.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
