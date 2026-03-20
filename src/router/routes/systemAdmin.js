import { ROLES } from '@/constants/roles'
import { ROUTE_NAMES } from '@/constants/routes'

export default [
  {
    path: '/system/companies',
    name: ROUTE_NAMES.SYS_COMPANY_LIST,
    component: () => import('@/views/systemAdmin/CompanyListView.vue'),
    meta: { role: ROLES.SYSTEM_ADMIN },
  },
  {
    path: '/system/companies/register',
    name: ROUTE_NAMES.SYS_COMPANY_REGISTER,
    component: () => import('@/views/systemAdmin/CompanyRegisterView.vue'),
    meta: { role: ROLES.SYSTEM_ADMIN },
  },
  {
    path: '/system/companies/:id',
    name: ROUTE_NAMES.SYS_COMPANY_DETAIL,
    component: () => import('@/views/systemAdmin/CompanyDetailView.vue'),
    meta: { role: ROLES.SYSTEM_ADMIN },
  },
  {
    path: '/system/fees',
    name: ROUTE_NAMES.SYS_FEE_SETTING,
    component: () => import('@/views/systemAdmin/FeeSettingView.vue'),
    meta: { role: ROLES.SYSTEM_ADMIN },
  },
  {
    path: '/system/users',
    name: ROUTE_NAMES.SYS_USER_ACCOUNT_LIST,
    component: () => import('@/views/systemAdmin/UserAccountListView.vue'),
    meta: { role: ROLES.SYSTEM_ADMIN },
  },
]