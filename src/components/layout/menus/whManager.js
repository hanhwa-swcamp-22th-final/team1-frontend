/**
 * WH Manager 사이드바 메뉴 구성
 *
 * item.name 규칙:
 *   - 반드시 ROUTE_NAMES 상수를 사용할 것 (raw 문자열 직접 입력 금지)
 *   - item.name 은 Vue Router named route 의 name 과 정확히 일치해야 함
 *     → RouterLink :to="{ name: item.name }" 으로 페이지 이동
 *     → isActive(item.name) 으로 활성 메뉴 스타일 적용
 *
 */
import { ROUTE_NAMES } from '@/constants'

export const WH_MANAGER_MENU_GROUPS = [
  {
    label: 'Overview',
    items: [
      { name: ROUTE_NAMES.WH_MANAGER_DASHBOARD, label: '대시보드', icon: '⊞' },
    ],
  }
  // {
  //   label: '입고 관리',
  //   items: [
  //     { name: ROUTE_NAMES.WH_MANAGER_ASN_LIST,    label: 'ASN 목록',  icon: '⎙' }
  //   ],
  // },
  // {
  //   label: '재고 관리',
  //   items: [
  //     { name: ROUTE_NAMES.WH_MANAGER_INVENTORY, label: '재고 현황', icon: '⊞' },
  //   ],
  // },
  // {
  //   label: '주문 관리',
  //   items: [
  //     { name: ROUTE_NAMES.WH_MANAGER_ORDER_LIST,   label: '주문 목록', icon: '≡' }
  //   ],
  // },
  // {
  //   label: '출고 관리',
  //   items: [
  //     { name: ROUTE_NAMES.WH_MANAGER_OUTBOUND,         label: '출고 지시',  icon: '→' },
  //     { name: ROUTE_NAMES.WH_MANAGER_PICKING_LIST,     label: '피킹 리스트', icon: '⊟'},
  //     { name: ROUTE_NAMES.WH_MANAGER_LABEL_PRINT,      label: '송장 발행',  icon: '⎙' },
  //     { name: ROUTE_NAMES.WH_MANAGER_OUTBOUND_CONFIRM, label: '출고 확정',  icon: '✓' },
  //   ],
  // },
  // {
  //   label: '작업자 관리',
  //   items: [
  //     { name: ROUTE_NAMES.WH_MANAGER_WORKER_ACCOUNT, label: '작업자 계정 관리', icon: '⊞' },
  //     { name: ROUTE_NAMES.WH_MANAGER_BIN_ASSIGN,     label: '작업자 업무 관리',  icon: '⊟' },
  //   ],
  // },
]
