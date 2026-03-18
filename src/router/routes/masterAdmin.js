import { ROLES } from '@/constants/roles'
import { ROUTE_NAMES } from '@/constants/routes'

/**
 * masterAdmin 라우트
 *
 *   MASTER_DASHBOARD                — Dashboard.vue
 *   MASTER_WAREHOUSE_LIST           — WarehouseList.vue
 *   MASTER_WAREHOUSE_REGISTER       — WarehouseRegister.vue
 *   MASTER_WAREHOUSE_DETAIL         — WarehouseDetail.vue
 *   MASTER_ASN_LIST                 — AsnList.vue
 *   MASTER_ORDER_LIST               — OrderList.vue
 *   MASTER_FEE_SETTING              — FeeView.vue
 *   MASTER_FEE_SETTINGS             — FeeSettings.vue
 *   MASTER_SELLER_COMPANY_LIST      — SellerList.vue
 *   MASTER_SELLER_COMPANY_REGISTER  — SellerRegister.vue
 *   MASTER_ACCOUNT_INVITE           — AccountInvite.vue (셀러 담당자)
 *   MASTER_ACCOUNT_MANAGER          — AccountInvite.vue (창고 관리자)
 *   MASTER_ACCOUNT_WORKER           — AccountInvite.vue (창고 작업자)
 *   MASTER_ACCOUNT_LIST             — UserList.vue
 *   MASTER_RBAC_SETTING             — RbacSettings.vue
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
    component: () => import('@/views/masterAdmin/WarehouseRegister.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
  {
    path: '/master/warehouses/detail/:id',
    name: ROUTE_NAMES.MASTER_WAREHOUSE_DETAIL,
    component: () => import('@/views/masterAdmin/WarehouseDetail.vue'),
    meta: { role: ROLES.MASTER_ADMIN, activeMenu: ROUTE_NAMES.MASTER_WAREHOUSE_LIST },
  },

  // ── 입출고 ────────────────────────────────────────────────────────────────
  {
    path: '/master/asn',
    name: ROUTE_NAMES.MASTER_ASN_LIST,
    component: () => import('@/views/masterAdmin/AsnList.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
  {
    path: '/master/orders',
    name: ROUTE_NAMES.MASTER_ORDER_LIST,
    component: () => import('@/views/masterAdmin/OrderList.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },

  // ── 요금 설정 ─────────────────────────────────────────────────────────────
  {
    path: '/master/fee',
    name: ROUTE_NAMES.MASTER_FEE_SETTING,
    component: () => import('@/views/masterAdmin/FeeView.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
  {
    path: '/master/fee/settings',
    name: ROUTE_NAMES.MASTER_FEE_SETTINGS,
    component: () => import('@/views/masterAdmin/FeeSettings.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },

  // ── 셀러 관리 ─────────────────────────────────────────────────────────────
  {
    path: '/master/sellers',
    name: ROUTE_NAMES.MASTER_SELLER_COMPANY_LIST,
    component: () => import('@/views/masterAdmin/SellerList.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
  {
    path: '/master/sellers/register',
    name: ROUTE_NAMES.MASTER_SELLER_COMPANY_REGISTER,
    component: () => import('@/views/masterAdmin/SellerRegister.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },

  // ── 계정 발급 ─────────────────────────────────────────────────────────────
  {
    path: '/master/accounts/invite',
    name: ROUTE_NAMES.MASTER_ACCOUNT_INVITE,
    component: () => import('@/views/masterAdmin/AccountInvite.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
  {
    path: '/master/accounts/manager',
    name: ROUTE_NAMES.MASTER_ACCOUNT_MANAGER,
    component: () => import('@/views/masterAdmin/AccountInvite.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
  {
    path: '/master/accounts/worker',
    name: ROUTE_NAMES.MASTER_ACCOUNT_WORKER,
    component: () => import('@/views/masterAdmin/AccountInvite.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },

  // ── 사용자 관리 ───────────────────────────────────────────────────────────
  {
    path: '/master/accounts',
    name: ROUTE_NAMES.MASTER_ACCOUNT_LIST,
    component: () => import('@/views/masterAdmin/UserList.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
  {
    path: '/master/rbac',
    name: ROUTE_NAMES.MASTER_RBAC_SETTING,
    component: () => import('@/views/masterAdmin/RbacSettings.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
]
