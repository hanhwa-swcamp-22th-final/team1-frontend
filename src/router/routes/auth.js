/**
 * routes/auth.js — 인증 관련 라우트 (로그인, 비밀번호 설정/변경)
 *
 * 모든 라우트에 meta: { public: true } 설정.
 * → router/index.js 가드 #2에서 비로그인 접근 허용.
 *
 * AppLayout 미사용 이유:
 *   이 화면들은 로그인 전 상태이므로 사이드바·헤더 레이아웃 불필요.
 *   각 View 컴포넌트가 자체 레이아웃을 구성함.
 *
 * 접근 조건:
 *   /login          — 누구나 (로그인 사용자는 가드 #1에 의해 대시보드로 리다이렉트)
 *   /set-password   — 신규 계정 최초 비밀번호 설정 (초대 링크 경유)
 *   /change-password — TEMP_PASSWORD 상태 사용자만 (가드 #3에 의해 강제 이동)
 */
import { ROUTE_NAMES } from '@/constants'

export default [
  {
    path:      '/login',
    name:      ROUTE_NAMES.LOGIN,
    component: () => import('@/views/auth/LoginView.vue'),
    meta:      { public: true },
  },
  {
    path:      '/set-password',
    name:      ROUTE_NAMES.SET_PASSWORD,
    component: () => import('@/views/auth/SetPasswordView.vue'),
    meta:      { public: true },  // 초대 링크로 접근 (토큰 미필요)
  },
  {
    path:      '/change-password',
    name:      ROUTE_NAMES.CHANGE_PASSWORD,
    component: () => import('@/views/auth/ChangePasswordView.vue'),
    meta:      { public: true },  // TEMP_PASSWORD 상태 사용자는 token 있지만 public 처리
  },
]
