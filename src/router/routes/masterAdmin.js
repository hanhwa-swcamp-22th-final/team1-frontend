import { ROLES } from '@/constants/roles'
import { ROUTE_NAMES } from '@/constants/routes'

export default [
  {
    path: '/master/dashboard',
    name: ROUTE_NAMES.MASTER_DASHBOARD,
    component: () => import('@/views/masterAdmin/Dashboard.vue'),
    meta: { role: ROLES.MASTER_ADMIN },
  },
]
