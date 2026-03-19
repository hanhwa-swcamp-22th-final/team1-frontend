/**
 * router/index.js — Vue Router 설정 및 전역 네비게이션 가드
 *
 * 라우트 파일 구조:
 *   routes/auth.js          — 로그인, 비밀번호 설정/변경
 *   routes/seller.js        — 셀러 화면 (팀원 작업)
 *   routes/masterAdmin.js   — 마스터 어드민 화면 (팀원 작업)
 *   routes/whManager.js     — 창고 매니저 화면 (팀원 작업)
 *   routes/whWorker.js      — 창고 작업자 화면 (팀원 작업)
 *   routes/systemAdmin.js   — 시스템 어드민 화면 (팀원 작업)
 *
 * meta 필드 규칙:
 *   meta.public: true  — 비로그인 접근 허용 (로그인/비밀번호 페이지)
 *   meta.role: ROLES.X — 특정 Role만 접근 허용 (없으면 로그인만 필요)
 *
 * 팀원 라우트 추가 가이드:
 *   1. 해당 Role의 routes/{role}.js 파일 열기
 *   2. ROUTE_NAMES에서 name 상수 import
 *   3. meta: { role: ROLES.{ROLE} } 반드시 설정
 *   4. component는 동적 import: () => import('@/views/{role}/XxxView.vue')
 *   5. 새 라우트 name은 반드시 constants/routes.js에 먼저 추가
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ACCOUNT_STATUS, ROLES, ROUTE_NAMES } from '@/constants'

import authRoutes from './routes/auth.js'
import sellerRoutes from './routes/seller.js'
import masterAdminRoutes from './routes/masterAdmin.js'
import whManagerRoutes from './routes/whManager.js'
import whWorkerRoutes from './routes/whWorker.js'
import systemAdminRoutes from './routes/systemAdmin.js'

/**
 * Role별 로그인 후 기본 진입 화면 (로그인 → 대시보드 리다이렉트용)
 * Role이 추가되면 여기도 업데이트 필요
 */
const DASHBOARD_BY_ROLE = {
  [ROLES.SELLER]: ROUTE_NAMES.SELLER_DASHBOARD,
  [ROLES.MASTER_ADMIN]: ROUTE_NAMES.MASTER_DASHBOARD,
  [ROLES.WH_MANAGER]: ROUTE_NAMES.WH_MANAGER_DASHBOARD,
  [ROLES.WH_WORKER]: ROUTE_NAMES.WH_WORKER_DASHBOARD,
  [ROLES.SYSTEM_ADMIN]: ROUTE_NAMES.SYS_COMPANY_LIST,
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...authRoutes,
    ...sellerRoutes,
    ...masterAdminRoutes,
    ...whManagerRoutes,
    ...whWorkerRoutes,
    ...systemAdminRoutes,
    // [DEV ONLY] 공통 컴포넌트 데모 페이지 — 개발 확인용, 배포 전 제거
    {
      path: '/dev/components',
      name: 'dev-components',
      component: () => import('@/views/common/ComponentDemoView.vue'),
      meta: { public: true },
    },
    // 403 Forbidden
    {
      path: '/403',
      name: ROUTE_NAMES.FORBIDDEN,
      component: () => import('@/views/common/ForbiddenView.vue'),
    },
    // 404 Not Found — 반드시 마지막에 위치
    {
      path: '/:pathMatch(.*)*',
      name: ROUTE_NAMES.NOT_FOUND,
      component: () => import('@/views/common/NotFoundView.vue'),
    },
  ],
})

/**
 * 전역 네비게이션 가드 — 우선순위 순서대로 처리
 *
 * 가드 #1: 로그인 상태에서 로그인 페이지 재접근 → 대시보드로 리다이렉트
 * 가드 #2: 비공개 라우트 + 비로그인 → 로그인으로 리다이렉트 (redirect 쿼리 포함)
 * 가드 #3: TEMP_PASSWORD 상태 → 비밀번호 변경 페이지 강제 이동
 * 가드 #4: meta.role 불일치 → 403 페이지
 *
 * 우선순위 주의: 가드는 위에서 아래 순서로 평가됨.
 *   가드 #1을 먼저 처리하지 않으면 로그인 사용자가 /login 진입 시
 *   가드 #2가 아닌 정상 진입으로 처리됨.
 */
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  // ─ 가드 #1: 로그인 상태에서 /login 재접근 시 대시보드로 이동 ─────────
  if (auth.isLoggedIn && to.name === ROUTE_NAMES.LOGIN) {
    const dashboard = DASHBOARD_BY_ROLE[auth.role]
    return next(dashboard ? { name: dashboard } : '/')
  }

  // ─ 가드 #2: 비공개 페이지 + 미로그인 → /login?redirect=현재경로 ────────
  // meta.public: true 인 라우트(로그인, 비밀번호 설정)는 통과
  if (!to.meta.public && !auth.isLoggedIn) {
    return next({ name: ROUTE_NAMES.LOGIN, query: { redirect: to.fullPath } })
  }

  // ─ 가드 #3: 임시 비밀번호 상태 강제 변경 ──────────────────────────────
  // TEMP_PASSWORD 상태인 사용자는 change-password 외 모든 페이지 접근 차단
  if (
    auth.isLoggedIn &&
    auth.user?.status === ACCOUNT_STATUS.TEMP_PASSWORD &&
    to.name !== ROUTE_NAMES.CHANGE_PASSWORD
  ) {
    return next({ name: ROUTE_NAMES.CHANGE_PASSWORD })
  }

  // ─ 가드 #4: Role 불일치 → 403 ─────────────────────────────────────────
  // meta.role 이 없는 라우트는 모든 로그인 사용자 접근 허용
  if (to.meta.role && to.meta.role !== auth.role) {
    return next({ name: ROUTE_NAMES.FORBIDDEN })
  }

  next()
})

export default router
