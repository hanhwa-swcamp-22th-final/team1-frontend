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
 *   localStorage 'conk-auth' 읽기
 *     → token   있으면: Authorization: Bearer {token}
 *     → tenantCode 있으면: X-Tenant-Code: {tenantCode}
 *        ↓
 *   [백엔드 API 서버]  baseURL = VITE_API_BASE_URL
 *        ↓
 *   ── 응답 인터셉터 ──────────────────────────────────────
 *   200~299: response 그대로 반환
 *   401:     localStorage 'conk-auth' 삭제 → /login 리다이렉트
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
 * localStorage 직접 읽는 이유:
 *   useAuthStore를 동적으로 import하면 Pinia 초기화 전 순환 참조 가능성.
 *   localStorage에서 직접 읽어 의존성을 제거함.
 *   persist key 이름: 'conk-auth' (auth.js의 persist.key와 동일해야 함)
 */
import axios from 'axios'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,  /* .env의 VITE_API_BASE_URL */
  timeout: 10000,  /* 10초 초과 시 AxiosError(timeout) 발생 */
})

// ── 요청 인터셉터 ────────────────────────────────────────
instance.interceptors.request.use((config) => {
  // pinia-plugin-persistedstate가 저장한 JSON 직접 파싱
  // 키 이름: 'conk-auth' (stores/auth.js persist.key와 동일)
  const raw = localStorage.getItem('conk-auth')
  if (raw) {
    try {
      const { token, tenantCode } = JSON.parse(raw)
      if (token)      config.headers['Authorization']  = `Bearer ${token}`
      if (tenantCode) config.headers['X-Tenant-Code']  = tenantCode
    } catch {
      // JSON.parse 실패(손상된 데이터) 시 무시하고 헤더 미설정
    }
  }
  return config
})

// ── 응답 인터셉터 ────────────────────────────────────────
instance.interceptors.response.use(
  // 2xx 응답은 그대로 통과
  (response) => response,

  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료/인증 실패: 세션 완전 초기화 후 로그인 페이지로 강제 이동
      // useAuthStore를 동적 import하여 순환 참조 방지
      // (auth.clearAuth() 대신 직접 삭제하는 이유: store 초기화 전 호출 가능성)
      localStorage.removeItem('conk-auth')
      const { default: router } = await import('@/router')
      router.replace('/login')
    }
    // 그 외 오류(4xx, 5xx, network error)는 호출 측 catch에서 처리
    return Promise.reject(error)
  }
)

export default instance
