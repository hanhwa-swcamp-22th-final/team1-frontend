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
  // Vite dev server(:5173)가 API 요청을 Nginx(:80)로 대신 전달
  // → 브라우저 입장에서 같은 출처(5173)에 요청하므로 CORS 미발생
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
