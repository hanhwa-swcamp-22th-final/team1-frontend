import { ROUTE_NAMES } from '@/constants'

export const WH_WORKER_MENU_GROUPS = [
  {
    label: 'WH Worker',
    items: [
      {
        name: ROUTE_NAMES.WH_WORKER_TASKS,
        label: '내 작업',
        icon: '☰',
      },
      {
        name: ROUTE_NAMES.WH_WORKER_INBOUND,
        label: '입고관리',
        icon: '▣',
      },
      {
        name: ROUTE_NAMES.WH_WORKER_OUTBOUND,
        label: '출고관리',
        icon: '▷',
      },
    ],
  },
]
