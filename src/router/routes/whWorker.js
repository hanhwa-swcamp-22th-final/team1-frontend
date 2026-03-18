import { ROLES, ROUTE_NAMES } from '@/constants'

export default [
  /*{
    path: '/worker/dashboard',
    name: ROUTE_NAMES.WH_WORKER_DASHBOARD,
    component: () => import('@/views/whWorker/DashboardView.vue'),
    meta: { title: '대시보드', role: ROLES.WH_WORKER },
  },
  {
    path: '/worker/tasks',
    name: ROUTE_NAMES.WH_WORKER_TASK_LIST,
    component: () => import('@/views/whWorker/TasksView.vue'),
    meta: { title: '내 작업', role: ROLES.WH_WORKER },
  },
  {
    path: '/worker/inspection',
    name: ROUTE_NAMES.WH_WORKER_INSPECTION,
    component: () => import('@/views/whWorker/InboundView.vue'),
    meta: { title: '입고 관리', role: ROLES.WH_WORKER },
  },
  {
    path: '/worker/picking',
    name: ROUTE_NAMES.WH_WORKER_PICKING,
    component: () => import('@/views/whWorker/OutboundView.vue'),
    meta: { title: '출고 관리', role: ROLES.WH_WORKER },
  },
  {
    path: '/worker/packing',
    name: ROUTE_NAMES.WH_WORKER_PACKING,
    component: () => import('@/views/whWorker/OutboundView.vue'),
    meta: { title: '재고 관리', role: ROLES.WH_WORKER },
  },*/

  {
    path: '/worker/dashboard',
    name: ROUTE_NAMES.WH_WORKER_DASHBOARD,
    component: () => import('@/views/whWorker/DashboardView.vue'),
    meta: { title: '통합 대시보드', role: ROLES.WH_WORKER },
  },
  {
    path: '/worker/tasks',
    name: ROUTE_NAMES.WH_WORKER_TASKS,
    component: () => import('@/views/whWorker/TasksView.vue'),
    meta: { title: '내 작업', role: ROLES.WH_WORKER },
  },
  {
    path: '/worker/inbound',
    name: ROUTE_NAMES.WH_WORKER_INBOUND,
    component: () => import('@/views/whWorker/InboundView.vue'),
    meta: { title: '입고 관리', role: ROLES.WH_WORKER },
  },
  {
    path: '/worker/outbound',
    name: ROUTE_NAMES.WH_WORKER_OUTBOUND,
    component: () => import('@/views/whWorker/OutboundView.vue'),
    meta: { title: '출고 관리', role: ROLES.WH_WORKER },
  },
  {
    path: '/worker/inventory',
    name: ROUTE_NAMES.WH_WORKER_INVENTORY,
    component: () => import('@/views/whWorker/InventoryView.vue'),
    meta: { title: '재고 관리', role: ROLES.WH_WORKER },
  },
]