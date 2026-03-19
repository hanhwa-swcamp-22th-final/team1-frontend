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
    path: '/whm/order-list',
    name: ROUTE_NAMES.WH_MANAGER_ORDER_LIST,
    component: () => import('@/views/whManager/OrderListView.vue'),
    meta: { role: ROLES.WH_MANAGER },
  },
  {
    path: '/whm/outbound/dispatch',
    name: ROUTE_NAMES.WH_MANAGER_OUTBOUND_DISPATCH,
    component: () => import('@/views/whManager/OutboundDispatchView.vue'),
    meta: { role: ROLES.WH_MANAGER },
  },
  {
    path: '/whm/picking-list',
    name: ROUTE_NAMES.WH_MANAGER_PICKING_LIST,
    component: () => import('@/views/whManager/PickingListView.vue'),
    meta: { role: ROLES.WH_MANAGER },
  },
  {
    path: '/whm/label-print',
    name: ROUTE_NAMES.WH_MANAGER_LABEL_PRINT,
    component: () => import('@/views/whManager/InvoiceView.vue'),
    meta: { role: ROLES.WH_MANAGER },
  },
  {
    path: '/whm/outbound/confirm',
    name: ROUTE_NAMES.WH_MANAGER_OUTBOUND_CONFIRM,
    component: () => import('@/views/whManager/OutboundConfirmView.vue'),
    meta: { role: ROLES.WH_MANAGER },
  },
  {
    path: '/whm/worker-account',
    name: ROUTE_NAMES.WH_MANAGER_WORKER_ACCOUNT,
    component: () => import('@/views/whManager/WorkerAccountView.vue'),
    meta: { role: ROLES.WH_MANAGER },
  },
  {
    path: '/whm/worker-task',
    name: ROUTE_NAMES.WH_MANAGER_WORKER_TASK,
    component: () => import('@/views/whManager/WorkerTaskView.vue'),
    meta: { role: ROLES.WH_MANAGER },
  },
]
