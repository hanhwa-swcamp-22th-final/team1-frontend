import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // VITE_API_PREFIX (.env에서 로드) — 미설정 시 /api/v1 기본값
  const prefix = env.VITE_API_PREFIX ?? '/api/v1'
  // npm run dev 프록시 타겟 — Nginx 게이트웨이(로컬 :80)로 전달
  const target = env.VITE_API_BASE_URL ?? 'http://localhost'

  return {
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            apexcharts: ['apexcharts', 'vue3-apexcharts'],
            excel: ['xlsx'],
          },
        },
      },
    },
    // npm run dev 전용 프록시 설정 — 빌드(dist/)에는 영향 없음
    // prefix 포함 경로를 그대로 Nginx(:80)로 전달 → Nginx가 prefix 제거 후 라우팅
    server: {
      proxy: {
        [`${prefix}/member`]:        { target, changeOrigin: true },
        [`${prefix}/orders`]:        { target, changeOrigin: true },
        [`${prefix}/wms`]:           { target, changeOrigin: true },
        [`${prefix}/integrations`]:  { target, changeOrigin: true },
        [`${prefix}/notifications`]: { target, changeOrigin: true },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
    },
  }
})
