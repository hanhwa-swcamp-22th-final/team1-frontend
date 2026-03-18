/**
 * Master Admin 사이드바 메뉴 구성
 *
 * item.name 규칙:
 *   - 반드시 ROUTE_NAMES 상수를 사용할 것 (raw 문자열 직접 입력 금지)
 *   - item.name 은 Vue Router named route 의 name 과 정확히 일치해야 함
 *     → RouterLink :to="{ name: item.name }" 으로 페이지 이동
 *     → isActive(item.name) 으로 활성 메뉴 스타일 적용
 *
 * TODO 표시된 항목: ROUTE_NAMES 상수 추가 및 routes/masterAdmin.js 에 라우트 등록 필요
 */
import { ROUTE_NAMES } from '@/constants'

export const MASTER_ADMIN_MENU_GROUPS = [
  {
    label: 'Overview',
    items: [
      { name: ROUTE_NAMES.MASTER_DASHBOARD, label: '통합 대시보드', icon: '⊞' },
    ],
  },
  {
    label: '창고 관리',
    items: [
      { name: ROUTE_NAMES.MASTER_WAREHOUSE_LIST, label: '창고 목록', icon: '⌂' },
      { name: ROUTE_NAMES.MASTER_WAREHOUSE_REGISTER, label: '창고 등록', icon: '+' },
    ],
  },
  {
    label: '입출고',
    items: [
      { name: ROUTE_NAMES.MASTER_ASN_LIST, label: 'ASN 목록', icon: '↓' },
      { name: ROUTE_NAMES.MASTER_ORDER_LIST, label: '주문 목록', icon: '≡' },
    ],
  },
  {
    label: '요금 설정',
    items: [
      { name: ROUTE_NAMES.MASTER_FEE_SETTING, label: '현재 설정 요금 조회', icon: '$' },
      { name: ROUTE_NAMES.MASTER_FEE_SETTINGS, label: '3PL 사용료 설정', icon: '⚙' },
    ],
  },
  {
    label: '셀러 관리',
    items: [
      { name: ROUTE_NAMES.MASTER_SELLER_COMPANY_LIST, label: '셀러 목록', icon: '◉' },
      { name: ROUTE_NAMES.MASTER_SELLER_COMPANY_REGISTER, label: '셀러 등록', icon: '+' },
    ],
  },
  {
    label: '계정 발급',
    items: [
      { name: ROUTE_NAMES.MASTER_ACCOUNT_INVITE, label: '셀러 담당자 계정 발급', icon: '↗' },
      { name: ROUTE_NAMES.MASTER_ACCOUNT_MANAGER, label: '창고 관리자 계정 발급', icon: '✓' },
      { name: ROUTE_NAMES.MASTER_ACCOUNT_WORKER, label: '창고 작업자 계정 발급', icon: '≡' },
    ],
  },
  {
    label: '사용자 관리',
    items: [
      { name: ROUTE_NAMES.MASTER_ACCOUNT_LIST, label: '소속 사용자 목록', icon: '◎' },
      { name: ROUTE_NAMES.MASTER_RBAC_SETTING, label: '권한 설정 (RBAC)', icon: '⊟' },
    ],
  },
]
