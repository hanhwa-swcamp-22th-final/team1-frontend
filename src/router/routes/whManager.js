import { ROLES, ROUTE_NAMES } from '@/constants'

export default [
  {
    path: '/whm/dashboard',
    name: ROUTE_NAMES.WH_MANAGER_DASHBOARD,
    component: () => import('@/views/whManager/DashboardView.vue'),
    meta: { role: ROLES.WH_MANAGER },
  },
]