import { ROLES, ROUTE_NAMES } from '@/constants'

export default [
  {
    path: '/worker',
    redirect: { name: ROUTE_NAMES.WH_WORKER_TASKS },
  },
  {
    path: '/worker/dashboard',
    name: ROUTE_NAMES.WH_WORKER_DASHBOARD,
    redirect: { name: ROUTE_NAMES.WH_WORKER_TASKS },
    meta: { title: '내 작업', role: ROLES.WH_WORKER },
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
    meta: { title: '입고관리', role: ROLES.WH_WORKER },
  },
  {
    path: '/worker/outbound',
    name: ROUTE_NAMES.WH_WORKER_OUTBOUND,
    component: () => import('@/views/whWorker/OutboundView.vue'),
    meta: { title: '출고관리', role: ROLES.WH_WORKER },
  },
  {
    path: '/worker/inventory',
    name: ROUTE_NAMES.WH_WORKER_INVENTORY,
    redirect: { name: ROUTE_NAMES.WH_WORKER_TASKS },
    meta: { title: '내 작업', role: ROLES.WH_WORKER },
  },
]
