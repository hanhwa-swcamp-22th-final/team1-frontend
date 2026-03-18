import { ROLES, ROUTE_NAMES } from '@/constants'

export default [
  {
    path: '/whm/asn-list',
    name: ROUTE_NAMES.WH_MANAGER_ASN_LIST,
    component: () => import('@/views/whManager/AsnListView.vue'),
    meta: { role: ROLES.WH_MANAGER },
  },
  {
    path: '/whm/dashboard',
    name: ROUTE_NAMES.WH_MANAGER_DASHBOARD,
    component: () => import('@/views/whManager/DashboardView.vue'),
    meta: { role: ROLES.WH_MANAGER },
  },
  {
    path: '/whm/inventory',
    name: ROUTE_NAMES.WH_MANAGER_INVENTORY,
    component: () => import('@/views/whManager/InventoryView.vue'),
    meta: { role: ROLES.WH_MANAGER },
  },
  {
    path: '/whm/outbound/dispatch',
    name: ROUTE_NAMES.WH_MANAGER_OUTBOUND_DISPATCH,
    component: () => import('@/views/whManager/OutboundDispatchView.vue'),
    path: '/whm/order-list',
    name: ROUTE_NAMES.WH_MANAGER_ORDER_LIST,
    component: () => import('@/views/whManager/OrderListView.vue'),
    meta: { role: ROLES.WH_MANAGER },
  },
]
