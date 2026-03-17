/**
 * WH Worker 사이드바 메뉴 구성
 *
 * TODO: WH Worker 담당 팀원이 작성
 * ⚠️  WH Worker 화면은 태블릿 터치 UI 기준으로 개발할 것
 *
 * item 형태:
 *   { name: ROUTE_NAMES.WH_WORKER_XXX, label: '메뉴 이름', icon: '아이콘' }
 *
 * 사용 가능한 ROUTE_NAMES (constants/routes.js 참고):
 *   WH_WORKER_TASK_LIST, WH_WORKER_INSPECTION, WH_WORKER_PICKING, WH_WORKER_PACKING
 */
import { ROUTE_NAMES } from '@/constants'

export const WH_WORKER_MENU_GROUPS = [
  // TODO: 아래 주석을 참고하여 메뉴 그룹을 작성하세요
  // {
  //   label: '그룹명',
  //   items: [
  //     { name: ROUTE_NAMES.WH_WORKER_TASK_LIST, label: '작업 목록', icon: '≡' },
  //   ],
  // },
  {
    label: 'Overview',
    items: [{ name: ROUTE_NAMES.WH_WORKER_TASK_LIST, label: '통합 대시보드', icon: '⊞' }],
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
      { name: 'master-asn-list', label: 'ASN 목록', icon: '↓' }, // TODO: ROUTE_NAMES 추가 및 라우트 등록 필요
      { name: 'master-order-list', label: '주문 목록', icon: '≡' }, // TODO: ROUTE_NAMES 추가 및 라우트 등록 필요
    ],
  },
  {
    label: '요금 설정',
    items: [
      { name: ROUTE_NAMES.MASTER_FEE_SETTING, label: '현재 설정 요금 조회', icon: '$' },
      { name: 'master-fee-settings', label: '3PL 사용료 설정', icon: '⚙' }, // TODO: ROUTE_NAMES 추가 및 라우트 등록 필요
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
      { name: 'master-account-manager', label: '창고 관리자 계정 발급', icon: '✓' }, // TODO: ROUTE_NAMES 추가 및 라우트 등록 필요
      { name: 'master-account-worker', label: '창고 작업자 계정 발급', icon: '≡' }, // TODO: ROUTE_NAMES 추가 및 라우트 등록 필요
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
