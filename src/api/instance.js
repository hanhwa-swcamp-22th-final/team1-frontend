/**
 * instance.js — Axios 인스턴스 (전체 API 레이어의 기반)
 *
 * 인터셉터 흐름:
 *
 *   [컴포넌트/스토어]
 *        ↓ import { getXxx } from '@/api/xxx.js'
 *   [api/xxx.js] — instance.get/post/put/delete 호출
 *        ↓
 *   ── 요청 인터셉터 ──────────────────────────────────────
 *   Pinia 메모리 auth.token 읽기
 *     → token 있으면: Authorization: Bearer {token}
 *        ↓
 *   [백엔드 API 서버]  baseURL = VITE_API_BASE_URL
 *        ↓
 *   ── 응답 인터셉터 ──────────────────────────────────────
 *   200~299: response 그대로 반환
 *   401:     HttpOnly refresh cookie로 /member/auth/refresh 재시도
 *            → 성공: 새 access token 저장 후 원요청 1회 재실행
 *            → 실패: auth.clearAuth() 후 /login 리다이렉트
 *   기타 4xx/5xx: Promise.reject(error) → 호출 측에서 catch 처리
 *
 * 팀원이 API 파일 추가 시 작성 방법:
 *   1. src/api/{기능명}.js 파일 생성
 *   2. 이 파일에서 instance import
 *   3. 함수 단위로 export (export async function getXxx() { ... })
 *   4. View/Store에서는 api 함수만 import (instance 직접 import 금지)
 *
 *   예시:
 *   // src/api/member.js
 *   import instance from './instance.js'
 *   export async function login(payload) {
 *     return instance.post('/auth/login', payload)
 *   }
 *
 * 중요한 제약:
 *   - refresh token은 HttpOnly cookie이므로 JS에서 읽지 않는다.
 *   - 백엔드는 여전히 Authorization 헤더의 access token을 기대하므로
 *     프런트는 메모리에 보관 중인 token을 모든 요청에 붙여준다.
 *   - refresh 요청은 같은 인터셉터를 다시 타면 무한루프가 되므로
 *     별도 axios 호출 + refreshPromise 공유로 한 번만 수행한다.
 */
import axios from 'axios'
import pinia from '@/pinia'
import { useAuthStore } from '@/stores/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const REQUEST_TIMEOUT_MS = 10000

/**
 * 동시에 여러 요청이 401을 맞았을 때 refresh API를 한 번만 호출하기 위한 공유 Promise.
 * 진행 중인 refresh가 있으면 뒤 요청들은 그 결과를 기다렸다가 같은 토큰으로 재시도한다.
 */
let refreshPromise = null

const instance = axios.create({
  baseURL: API_BASE_URL /* .env의 VITE_API_BASE_URL */,
  timeout: REQUEST_TIMEOUT_MS /* 10초 초과 시 AxiosError(timeout) 발생 */,
  withCredentials: true /* HttpOnly refresh cookie 자동 포함 */,
})

/**
 * refresh 재시도를 건너뛰어야 하는 요청인지 판단한다.
 *
 * 건너뛰는 경우:
 *   - 로그인 실패(401)를 refresh로 오해하면 안 되는 /login
 *   - refresh 자체 실패 시 자기 자신을 다시 refresh하면 무한루프가 되는 /refresh
 *   - 비밀번호 초기 설정/변경 등의 인증 특수 흐름
 *   - 호출부가 명시적으로 _skipAuthRefresh 플래그를 준 경우
 */
function shouldSkipAuthRefresh(config = {}) {
  const requestUrl = config.url ?? ''

  return Boolean(
    config._skipAuthRefresh ||
      requestUrl.includes('/member/auth/login') ||
      requestUrl.includes('/member/auth/refresh') ||
      requestUrl.includes('/member/auth/setup-password'),
  )
}

/**
 * refresh cookie를 이용해 새 access token을 발급받는다.
 *
 * 주의:
 *   instance를 재사용하면 이 인터셉터를 다시 타므로
 *   순수 axios.post로 별도 호출한다.
 */
async function refreshAccessToken() {
  const auth = useAuthStore(pinia)

  if (!refreshPromise) {
    refreshPromise = axios
      .post('/member/auth/refresh', null, {
        baseURL: API_BASE_URL,
        timeout: REQUEST_TIMEOUT_MS,
        withCredentials: true,
      })
      .then((response) => {
        const responseData = response.data?.data ?? {}

        if (!responseData.token) {
          throw new Error('Refresh response does not contain an access token.')
        }

        auth.applyLoginResponse(responseData)
        return responseData.token
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

// ── 요청 인터셉터 ────────────────────────────────────────
instance.interceptors.request.use((config) => {
  const auth = useAuthStore(pinia)

  if (auth.token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${auth.token}`
  }

  return config
})

// ── 응답 인터셉터 ────────────────────────────────────────
instance.interceptors.response.use(
  // 2xx 응답은 그대로 통과
  (response) => response,

  async (error) => {
    const originalRequest = error.config ?? {}

    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }

    if (originalRequest._retry || shouldSkipAuthRefresh(originalRequest)) {
      return Promise.reject(error)
    }

    try {
      const nextToken = await refreshAccessToken()

      originalRequest._retry = true
      originalRequest.headers = originalRequest.headers ?? {}
      originalRequest.headers.Authorization = `Bearer ${nextToken}`

      return instance(originalRequest)
    } catch (refreshError) {
      const auth = useAuthStore(pinia)
      const { default: router } = await import('@/router')

      auth.clearAuth()

      if (router.currentRoute.value.path !== '/login') {
        await router.replace('/login')
      }

      return Promise.reject(refreshError)
    }
  }
)

export default instance
