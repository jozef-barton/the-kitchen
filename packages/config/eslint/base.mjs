import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export function createHermesEslintConfig() {
  return [
    {
      ignores: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.turbo/**',
        '**/coverage/**',
        '**/playwright-report/**',
        '**/test-results/**'
      ]
    },
    js.configs.recommended,
    {
      files: ['**/*.{ts,tsx,mts,cts}'],
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          ecmaFeatures: {
            jsx: true
          }
        },
        globals: {
          ...globals.browser,
          ...globals.node
        }
      },
      plugins: {
        '@typescript-eslint': tsPlugin,
        react: reactPlugin,
        'react-hooks': reactHooksPlugin,
        'react-refresh': reactRefreshPlugin,
        'jsx-a11y': jsxA11yPlugin
      },
      settings: {
        react: {
          version: 'detect'
        }
      },
      rules: {
        ...tsPlugin.configs.recommended.rules,
        ...reactPlugin.configs.recommended.rules,
        ...reactHooksPlugin.configs.recommended.rules,
        ...jsxA11yPlugin.configs.recommended.rules,
        'no-console': ['error', { allow: ['warn', 'error'] }],
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_'
          }
        ]
      }
    },
    {
      files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      languageOptions: {
        globals: {
          ...globals.browser,
          ...globals.node,
          ...globals.jest
        }
      },
      rules: {
        'no-console': 'off'
      }
    },
    {
      files: ['scripts/**/*.mjs', '.github/**/*.js', '**/e2e/**/*.mjs'],
      languageOptions: {
        globals: {
          ...globals.node
        }
      },
      rules: {
        'no-console': 'off'
      }
    }
  ];
}
