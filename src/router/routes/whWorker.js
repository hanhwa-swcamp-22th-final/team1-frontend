// TODO: 팀원 담당 라우트
import { ROLES, ROUTE_NAMES } from '@/constants'

export default [
  {
    path: '/worker/dashboard',
    name: ROUTE_NAMES.WH_WORKER_DASHBOARD,
    component: () => import('@/views/whWorker/DashboardView.vue'),
    meta: { title: '통합 대시보드', role: ROLES.WH_WORKER },
  },
  /*{
    path: '/worker/dashboard',
    name: 'WorkerDashboard',
    component: () => import('@/views/whWorker/DashboardView.vue'),
    meta: { /!*title: '통합 대시보드', *!/ public: true },
  },*/
  {
    path: '/worker/tasks',
    name: 'WorkerTasks',
    component: () => import('@/views/whWorker/TasksView.vue'),
    meta: { /*title: '내작업'*/ public: true },
  },
  {
    path: '/worker/inbound',
    name: 'WorkerInbound',
    component: () => import('@/views/whWorker/InboundView.vue'),
    meta: { /*title: '입고 관리'*/ public: true },
  },
  {
    path: '/worker/outbound',
    name: 'WorkerOutbound',
    component: () => import('@/views/whWorker/OutboundView.vue'),
    meta: { /*title: '출고 관리'*/ public: true },
  },
  {
    path: '/worker/inventory',
    name: 'WorkerInventory',
    component: () => import('@/views/whWorker/InventoryView.vue'),
    meta: { /*title: '재고 관리'*/ public: true },
  },
]
