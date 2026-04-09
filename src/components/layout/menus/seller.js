/**
 * Seller 사이드바 메뉴 구성
 *
 * TODO: Seller 담당 팀원이 작성
 *
 * item 형태:
 *   { name: ROUTE_NAMES.SELLER_XXX, label: '메뉴 이름', icon: '아이콘' }
 *
 * 사용 가능한 ROUTE_NAMES (constants/routes.js 참고):
 *   SELLER_DASHBOARD, SELLER_PRODUCT_LIST, SELLER_PRODUCT_REGISTER,
 *   SELLER_ASN_LIST, SELLER_ASN_CREATE, SELLER_ASN_DETAIL,
 *   SELLER_INVENTORY, SELLER_ORDER_LIST, SELLER_ORDER_DETAIL,
 *   SELLER_ORDER_REGISTER, SELLER_CHANNEL_ORDERS, SELLER_MARGIN_SIMULATOR
 */
import { ROUTE_NAMES } from '@/constants'

export const SELLER_MENU_GROUPS = [
  // Seller 메인 진입 메뉴
  {
    label: 'Overview',
    items: [
      { name: ROUTE_NAMES.SELLER_DASHBOARD, label: '대시보드', icon: '⊞' },
    ],
  },

  // Seller 등록 기능 메뉴
  {
    label: '등록',
    items: [
      { name: ROUTE_NAMES.SELLER_ORDER_REGISTER, label: '주문 등록', icon: '+' },
      { name: ROUTE_NAMES.SELLER_PRODUCT_REGISTER, label: '상품 등록', icon: '□' },
      { name: ROUTE_NAMES.SELLER_ASN_CREATE, label: 'ASN 등록', icon: '↓' },
    ],
  },

  // Seller 조회 기능 메뉴
  {
    label: '조회',
    items: [
      { name: ROUTE_NAMES.SELLER_ORDER_LIST, label: '주문 목록', icon: '≣' },
      { name: ROUTE_NAMES.SELLER_PRODUCT_LIST, label: '상품 목록', icon: '▤' },
      { name: ROUTE_NAMES.SELLER_INVENTORY, label: '재고 목록', icon: '▥' },
      { name: ROUTE_NAMES.SELLER_ASN_LIST, label: 'ASN 목록', icon: '⋯' },
    ],
  },

  // Seller 부가 기능 메뉴
  {
    label: '도구',
    items: [
      { name: ROUTE_NAMES.SELLER_CHANNEL_ORDERS, label: '주문 연동 및 조회', icon: '⇄' },
      { name: ROUTE_NAMES.SELLER_MARGIN_SIMULATOR, label: '마진 시뮬레이터', icon: '◔' },
    ],
  },
]

// TODO(frontend): Seller 추가 화면 구현 시 메뉴 그룹 확장
