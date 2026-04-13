import './assets/main.css'
import { createApp } from 'vue'
import router from '@/router'
import pinia from '@/pinia'
import { refreshSession } from '@/api/member'
import { useAuthStore } from '@/stores/auth'
import App from './App.vue'

/**
 * 앱 시작 시 인증 상태 복구:
 *   - access token은 메모리에만 있으므로 새로고침 시 사라진다.
 *   - 대신 브라우저가 HttpOnly refresh cookie를 자동 전송하므로
 *     /member/auth/refresh 호출로 access token과 user 정보를 다시 받는다.
 *   - 복구 실패(쿠키 없음/만료/로그아웃 상태)면 비로그인 상태로 시작한다.
 */
async function bootstrapAuth() {
  const auth = useAuthStore(pinia)

  try {
    const response = await refreshSession()
    auth.applyLoginResponse(response.data?.data)
  } catch {
    auth.clearAuth()
  } finally {
    auth.markInitialized(true)
  }
}

await bootstrapAuth()

createApp(App).use(pinia).use(router).mount('#app')
