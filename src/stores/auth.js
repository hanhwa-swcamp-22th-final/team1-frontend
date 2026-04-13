/**
 * stores/auth.js — 인증 상태 전역 스토어
 *
 * 저장 전략:
 *   - access token: Pinia 메모리 상태에만 저장
 *   - refresh token: 브라우저 HttpOnly 쿠키에 저장 (JS 직접 접근 불가)
 *   - 새로고침 후 복구: app 부팅 시 /member/auth/refresh 호출로 access token 재발급
 *
 * 저장되는 user 객체 예시:
 *   {
 *     id:           "ACC-001",
 *     name:         "홍길동",
 *     email:        "hong@conk.io",
 *     role:         "MASTER_ADMIN",
 *     status:       "ACTIVE" | "TEMP_PASSWORD" | "INACTIVE",
 *     organization: "CONK 물류",
 *     tenantId:     "TENANT-001",
 *     sellerId:     "SELLER-001",
 *     warehouseId:  "WH-001"
 *   }
 *
 * token 만료 처리:
 *   토큰 만료 시 api/instance.js의 응답 인터셉터(401)에서
 *   refresh 쿠키로 access token 재발급을 먼저 시도한다.
 *   재발급 실패 시 clearAuth() 후 /login으로 리다이렉트한다.
 *
 * initialized 플래그:
 *   앱 시작 시 refresh 복구 시도가 끝났는지 나타낸다.
 *   - false: 아직 세션 복구 시도 전/중
 *   - true:  복구 성공 또는 실패가 확정됨
 *
 * 사용 예:
 *   import { useAuthStore } from '@/stores/auth'
 *   const auth = useAuthStore()
 *   auth.applyLoginResponse(loginResponse.data)
 *   if (auth.isLoggedIn) { ... }
  *   auth.clearAuth()  // 로그아웃
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * 백엔드 LoginResponse.user 형태를 프런트 공통 user shape로 정규화한다.
 * 누락 필드는 null로 맞춰서 뷰/가드에서 optional chaining 부담을 줄인다.
 *
 * @param {object|null|undefined} rawUser
 * @returns {object|null}
 */
function normalizeUser(rawUser) {
  if (!rawUser) return null

  return {
    id: rawUser.id ?? null,
    name: rawUser.name ?? null,
    email: rawUser.email ?? null,
    role: rawUser.role ?? null,
    status: rawUser.status ?? null,
    organization: rawUser.organization ?? null,
    tenantId: rawUser.tenantId ?? null,
    sellerId: rawUser.sellerId ?? null,
    warehouseId: rawUser.warehouseId ?? null,
  }
}

export const useAuthStore = defineStore('auth', () => {
  // 로그인 유저 정보 객체 (위 user 예시 참조)
  const user = ref(null)

  // JWT 액세스 토큰 — Authorization: Bearer {token}
  const token = ref(null)

  // 현재 유저의 역할 — constants/roles.js의 ROLES 값 중 하나
  const role = ref(null)

  // 앱 시작 시 refresh 기반 세션 복구가 끝났는지 표시
  const initialized = ref(false)

  /** token이 있으면 로그인 상태로 판단 */
  const isLoggedIn = computed(() => !!token.value)

  /**
   * 로그인/재발급 성공 후 호출. 이미 정규화된 payload를 직접 세팅한다.
   *
   * @param {{ user?: object|null, token?: string|null, role?: string|null }} payload
   */
  function setAuth(payload = {}) {
    user.value = normalizeUser(payload.user)
    token.value = payload.token ?? null
    role.value = payload.role ?? payload.user?.role ?? null
  }

  /**
   * 백엔드 LoginResponse 전체를 그대로 받아 store shape로 반영한다.
   * login 응답과 refresh 응답을 같은 방식으로 저장하기 위한 helper다.
   *
   * @param {{ user?: object, token?: string }} responseData
   */
  function applyLoginResponse(responseData = {}) {
    setAuth({
      user: responseData.user,
      token: responseData.token,
      role: responseData.user?.role,
    })
  }

  /**
   * 로그아웃 또는 refresh 실패 시 호출. 메모리 인증 상태를 모두 비운다.
   * refresh token 쿠키 삭제는 서버 /member/auth/logout 응답이 담당한다.
   */
  function clearAuth() {
    user.value = null
    token.value = null
    role.value = null
  }

  /**
   * 앱 시작 세션 복구 완료 여부를 갱신한다.
   *
   * @param {boolean} value
   */
  function markInitialized(value = true) {
    initialized.value = value
  }

  return {
    user,
    token,
    role,
    initialized,
    isLoggedIn,
    setAuth,
    applyLoginResponse,
    clearAuth,
    markInitialized,
  }
})
