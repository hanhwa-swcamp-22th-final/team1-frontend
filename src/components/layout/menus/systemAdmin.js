import { ROUTE_NAMES } from '@/constants'

export const SYSTEM_ADMIN_MENU_GROUPS = [
  {
    label: '플랫폼 관리',
    items: [
      { name: ROUTE_NAMES.SYS_COMPANY_LIST, label: '업체 목록', icon: '◎' },
      { name: ROUTE_NAMES.SYS_COMPANY_REGISTER, label: '업체 등록', icon: '＋' },
    ],
  },
  {
    label: '사용자 관리',
    items: [{ name: ROUTE_NAMES.SYS_USER_ACCOUNT_LIST, label: '전체 사용자 목록', icon: '◈' }],
  },
  {
    label: '단가 관리',
    items: [
      { name: ROUTE_NAMES.SYS_FEE_SETTING, label: '채널 수수료율', icon: '◌' },
    ],
  },
]
