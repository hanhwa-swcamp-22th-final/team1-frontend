/**
 * WH Manager 사이드바 메뉴 구성
 *
 * TODO: WH Manager 담당 팀원이 작성
 *
 * item 형태:
 *   { name: ROUTE_NAMES.WH_MANAGER_XXX, label: '메뉴 이름', icon: '아이콘' }
 *
 * 사용 가능한 ROUTE_NAMES (constants/routes.js 참고):
 *   WH_MANAGER_DASHBOARD, WH_MANAGER_ASN_LIST, WH_MANAGER_ASN_DETAIL,
 *   WH_MANAGER_INSPECTION, WH_MANAGER_LOCATION, WH_MANAGER_INVENTORY,
 *   WH_MANAGER_ORDER_LIST, WH_MANAGER_ORDER_DETAIL, WH_MANAGER_OUTBOUND,
 *   WH_MANAGER_LABEL_PRINT, WH_MANAGER_OUTBOUND_CONFIRM,
 *   WH_MANAGER_WORKER_ACCOUNT, WH_MANAGER_BIN_ASSIGN
 */
import { ROUTE_NAMES } from '@/constants'

export const WH_MANAGER_MENU_GROUPS = [
  {
    label: '개요',
    items: [
      { name: ROUTE_NAMES.WH_MANAGER_DASHBOARD, label: '대시보드', icon: '⊞' },
    ],
  },
  {
    label: '입고 관리',
    items: [
      { name: ROUTE_NAMES.WH_MANAGER_ASN_LIST, label: 'ASN 목록', icon: '📥' },
    ],
  },
]
