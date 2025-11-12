import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended
});

export default [
  // Ignore patterns (replaces .eslintignore)
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'node_modules/**',
      '.git/**',
      'public/**',
      '*.config.js',
      '*.config.mjs',
      'next-env.d.ts'
    ]
  },

  // Base configs from Next.js
  ...compat.extends('next/core-web-vitals', 'prettier'),

  // Global configuration for all files
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier: prettier
    },

    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true
        }
      }
    },

    settings: {
      'import/resolver': {
        node: {
          moduleDirectory: ['node_modules', 'src/']
        },
        typescript: {
          alwaysTryTypes: true
        }
      }
    },

    rules: {
      // React rules
      'react/jsx-filename-extension': 'off',
      'react/prop-types': 'off',
      'react/require-default-props': 'off',
      'react/no-array-index-key': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/display-name': 'off',

      // Import rules
      'import/order': 'off',
      'import/no-cycle': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/no-unresolved': ['off', { caseSensitive: false }],

      // General rules
      'no-param-reassign': 'off',
      'no-console': 'off',
      'no-shadow': 'off',
      'prefer-destructuring': 'off',

      // TypeScript rules
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'none'
        }
      ],

      // Material-UI import restriction
      'no-restricted-imports': [
        'error',
        {
          patterns: ['@mui/*/*/*', '!@mui/material/test-utils/*']
        }
      ],

      // Prettier integration
      'prettier/prettier': [
        'warn',
        {
          bracketSpacing: true,
          printWidth: 140,
          singleQuote: true,
          trailingComma: 'none',
          tabWidth: 2,
          useTabs: false,
          endOfLine: 'auto'
        }
      ]
    }
  }
];
