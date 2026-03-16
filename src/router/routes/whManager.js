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
]
