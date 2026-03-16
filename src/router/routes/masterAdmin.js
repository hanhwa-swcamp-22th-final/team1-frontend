import { ROLES } from '@/constants/roles'
import { ROUTE_NAMES } from '@/constants/routes'

/**
 * masterAdmin 라우트
 *
 * ✅ 구현 완료:
 *   master-dashboard      — Dashboard.vue
 *   master-warehouse-list — WarehouseList.vue
 *
 * 🚧 스텁 (UI 미구현 — Dashboard.vue 임시 사용):
 *   나머지 12개 라우트는 Sidebar.vue의 RouterLink 오류 방지를 위해
 *   named route만 등록해 두었음. 각 담당자가 Vue 파일 생성 후 교체할 것.
 */
export default [
  // ── 대시보드 ──────────────────────────────────────────────────────────────
  {
    path: '/master/dashboard',
    name: ROUTE_NAMES.MASTER_DASHBOARD,
    component: () => import('@/views/masterAdmin/Dashboard.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },

  // ── 창고 관리 ─────────────────────────────────────────────────────────────
  {
    path: '/master/warehouses',
    name: ROUTE_NAMES.MASTER_WAREHOUSE_LIST,
    component: () => import('@/views/masterAdmin/WarehouseList.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
  {
    path: '/master/warehouses/register',
    name: ROUTE_NAMES.MASTER_WAREHOUSE_REGISTER,
    component: () => import('@/views/masterAdmin/Dashboard.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
  {
    path: '/master/warehouses/detail/:id',
    name: ROUTE_NAMES.MASTER_WAREHOUSE_DETAIL,
    component: () => import('@/views/masterAdmin/WarehouseDetail.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },

  // ── 입출고 (스텁) ──────────────────────────────────────────────────────────
  {
    path: '/master/asn',
    name: 'master-asn-list',
    component: () => import('@/views/masterAdmin/Dashboard.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
  {
    path: '/master/orders',
    name: 'master-order-list',
    component: () => import('@/views/masterAdmin/Dashboard.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },

  // ── 요금 설정 (스텁) ───────────────────────────────────────────────────────
  {
    path: '/master/fee',
    name: ROUTE_NAMES.MASTER_FEE_SETTING,
    component: () => import('@/views/masterAdmin/Dashboard.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
  {
    path: '/master/fee/settings',
    name: 'master-fee-settings',
    component: () => import('@/views/masterAdmin/Dashboard.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },

  // ── 셀러 관리 (스텁) ───────────────────────────────────────────────────────
  {
    path: '/master/sellers',
    name: ROUTE_NAMES.MASTER_SELLER_COMPANY_LIST,
    component: () => import('@/views/masterAdmin/Dashboard.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
  {
    path: '/master/sellers/register',
    name: ROUTE_NAMES.MASTER_SELLER_COMPANY_REGISTER,
    component: () => import('@/views/masterAdmin/Dashboard.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },

  // ── 계정 발급 (스텁) ───────────────────────────────────────────────────────
  {
    path: '/master/accounts/invite',
    name: ROUTE_NAMES.MASTER_ACCOUNT_INVITE,
    component: () => import('@/views/masterAdmin/Dashboard.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
  {
    path: '/master/accounts/manager',
    name: 'master-account-manager',
    component: () => import('@/views/masterAdmin/Dashboard.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
  {
    path: '/master/accounts/worker',
    name: 'master-account-worker',
    component: () => import('@/views/masterAdmin/Dashboard.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },

  // ── 사용자 관리 (스텁) ─────────────────────────────────────────────────────
  {
    path: '/master/accounts',
    name: ROUTE_NAMES.MASTER_ACCOUNT_LIST,
    component: () => import('@/views/masterAdmin/Dashboard.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
  {
    path: '/master/rbac',
    name: ROUTE_NAMES.MASTER_RBAC_SETTING,
    component: () => import('@/views/masterAdmin/Dashboard.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
]
