/**
 * System Admin 사이드바 메뉴 구성
 *
 * TODO: System Admin 담당 팀원이 작성
 *
 * item 형태:
 *   { name: ROUTE_NAMES.SYS_XXX, label: '메뉴 이름', icon: '아이콘' }
 *
 * 사용 가능한 ROUTE_NAMES (constants/routes.js 참고):
 *   SYS_COMPANY_LIST, SYS_COMPANY_REGISTER, SYS_FEE_SETTING
 */
import { ROUTE_NAMES } from '@/constants'

export const SYSTEM_ADMIN_MENU_GROUPS = [
  {
    label: '플랫폼 관리',
    items: [
      { name: ROUTE_NAMES.SYS_COMPANY_LIST, label: '업체 목록', icon: '🏢' },
      { name: ROUTE_NAMES.SYS_COMPANY_REGISTER, label: '업체 등록', icon: '✚' },
    ],
  },
  {
    label: '단가 관리',
    items: [{ name: ROUTE_NAMES.SYS_FEE_SETTING, label: '채널 수수료율', icon: '💲' }],
  },
]