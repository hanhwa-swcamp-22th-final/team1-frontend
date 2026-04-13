import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // npm run dev 전용 프록시 설정 — 빌드(dist/)에는 영향 없음
  // VITE_API_BASE_URL=http://localhost (절대 URL) 사용으로 실제로는 경유하지 않음
  // 브라우저가 http://localhost(Nginx:80)으로 직접 요청
  server: {
    proxy: {
      '/member':        { target: 'http://localhost', changeOrigin: true },
      '/orders':        { target: 'http://localhost', changeOrigin: true },
      '/wms':           { target: 'http://localhost', changeOrigin: true },
      '/integrations':  { target: 'http://localhost', changeOrigin: true },
      '/notifications': { target: 'http://localhost', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
