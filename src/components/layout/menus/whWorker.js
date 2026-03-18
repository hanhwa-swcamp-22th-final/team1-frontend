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
  {
    label: '통합 대시보드',
    items: [
      {
        name: ROUTE_NAMES.WH_WORKER_DASHBOARD,
        label: '대시보드',
        icon: '⊞',
      },
      {
        name: ROUTE_NAMES.WH_WORKER_TASKS,
        label: '내 작업',
        icon: '☰',
      },
      {
        name: ROUTE_NAMES.WH_WORKER_INBOUND,
        label: '입고 관리',
        icon: '▣',
      },
      {
        name: ROUTE_NAMES.WH_WORKER_OUTBOUND,
        label: '출고 관리',
        icon: '▷',
      },
      {
        name: ROUTE_NAMES.WH_WORKER_INVENTORY,
        label: '재고 관리',
        icon: '◈',
      },
    ],
  },
]
