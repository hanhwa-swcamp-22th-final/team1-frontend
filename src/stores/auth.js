/**
 * stores/auth.js — 인증 상태 전역 스토어
 *
 * persist 설정:
 *   key:     'conk-auth'     ← api/instance.js의 localStorage 읽기 키와 동일해야 함
 *   storage: localStorage    ← 브라우저 새로고침/탭 유지
 *
 * 저장되는 user 객체 예시:
 *   {
 *     name:         "홍길동",
 *     email:        "hong@conk.io",
 *     status:       "ACTIVE" | "TEMP_PASSWORD" | "INACTIVE",
 *     organization: "CONK 물류",    // 선택적
 *     avatar:       "https://..."   // 선택적
 *   }
 *
 * token 만료 처리:
 *   토큰 만료 시 api/instance.js의 응답 인터셉터(401)에서
 *   localStorage.removeItem('conk-auth') 후 /login으로 리다이렉트.
 *   이 스토어의 clearAuth()는 로그아웃 버튼 클릭 시 직접 호출.
 *
 * 사용 예:
 *   import { useAuthStore } from '@/stores/auth'
 *   const auth = useAuthStore()
 *   auth.setAuth({ user, token, role, tenantCode, customerCode })
 *   if (auth.isLoggedIn) { ... }
 *   auth.clearAuth()  // 로그아웃
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAuthStore = defineStore(
  'auth',
  () => {
    // 로그인 유저 정보 객체 (위 user 예시 참조)
    const user = ref(null)

    // JWT 액세스 토큰 — Authorization: Bearer {token}
    const token = ref(null)

    // 현재 유저의 역할 — constants/roles.js의 ROLES 값 중 하나
    const role = ref(null)

    // 창고사(테넌트) 코드 — X-Tenant-Code 헤더에 사용
    const tenantCode = ref(null)

    // 셀러 고객사 코드 (SELLER Role 전용, 나머지 Role은 null)
    const customerCode = ref(null)

    /** token이 있으면 로그인 상태로 판단 */
    const isLoggedIn = computed(() => !!token.value)

    /**
     * 로그인 성공 후 호출. 백엔드 응답 데이터를 그대로 전달.
     * @param {{ user, token, role, tenantCode, customerCode }} payload
     */
    function setAuth(payload) {
      user.value = payload.user ?? null
      token.value = payload.token ?? null
      role.value = payload.role ?? null
      tenantCode.value = payload.tenantCode ?? null
      customerCode.value = payload.customerCode ?? null
    }

    /**
     * 로그아웃 시 호출. 모든 인증 상태 초기화.
     * persist에 의해 localStorage도 자동으로 업데이트됨.
     */
    function clearAuth() {
      user.value = token.value = role.value = tenantCode.value = customerCode.value = null
    }

    return { user, token, role, tenantCode, customerCode, isLoggedIn, setAuth, clearAuth }
  },
  {
    // pinia-plugin-persistedstate: 브라우저 새로고침 후에도 상태 유지
    // key 이름을 변경하면 api/instance.js의 localStorage.getItem 키도 함께 변경할 것
    persist: {
      key: 'conk-auth',
      storage: localStorage,
    },
  }
)
