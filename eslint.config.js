import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import configPrettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  configPrettier,

  {
    files: ['**/*.vue', '**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // ────────────────────────────────────────
      // 5장. 기타 규칙
      // ────────────────────────────────────────

      // var 금지 — const / let만 사용
      'no-var': 'error',

      // 재할당 없으면 const 강제
      'prefer-const': 'error',

      // == 금지, === 강제
      eqeqeq: ['error', 'always'],

      // console.log 경고, warn/error만 허용
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // 사용하지 않는 변수 에러 (_로 시작하면 허용)
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // axios 직접 import 금지 (api/ 폴더 함수만 사용)
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['axios'],
              message: '[CONK 규칙] axios 직접 import 금지. @/api/instance.js를 사용하세요.',
            },
          ],
        },
      ],

      // ────────────────────────────────────────
      // 1장. 네이밍 규칙
      // ────────────────────────────────────────

      // 컴포넌트는 PascalCase
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],

      // ────────────────────────────────────────
      // 3장. Vue 블록 순서 — script → template → style
      // ────────────────────────────────────────
      'vue/block-order': [
        'error',
        {
          order: ['script', 'template', 'style'],
        },
      ],

      // ────────────────────────────────────────
      // 기타 Vue 규칙
      // ────────────────────────────────────────

      // v-for에 :key 필수
      'vue/require-v-for-key': 'error',

      // v-if + v-for 동시 사용 금지
      'vue/no-use-v-if-with-v-for': 'error',

      // import 안 한 컴포넌트 사용 금지
      'vue/no-undef-components': 'error',

      // Vue 3 다중 루트 허용
      'vue/no-multiple-template-root': 'off',
    },
  },

  // api/instance.js는 axios import 허용
  {
    files: ['src/api/instance.js'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },

  {
    ignores: ['dist/**', 'node_modules/**'],
  },
]
