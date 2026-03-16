/**
 * 역할별 사이드바 메뉴 집계
 *
 * Sidebar.vue 는 이 파일만 import 한다:
 *   import { MENU_BY_ROLE } from '@/components/layout/menus'
 *
 * 각 팀원은 자신의 역할 파일에서만 메뉴를 작성하면 됨:
 *   - menus/masterAdmin.js  → MASTER_ADMIN_MENU_GROUPS
 *   - menus/seller.js       → SELLER_MENU_GROUPS
 *   - menus/systemAdmin.js  → SYSTEM_ADMIN_MENU_GROUPS
 *   - menus/whManager.js    → WH_MANAGER_MENU_GROUPS
 *   - menus/whWorker.js     → WH_WORKER_MENU_GROUPS
 */
import { ROLES } from '@/constants'
import { MASTER_ADMIN_MENU_GROUPS } from './masterAdmin'
import { SELLER_MENU_GROUPS } from './seller'
import { SYSTEM_ADMIN_MENU_GROUPS } from './systemAdmin'
import { WH_MANAGER_MENU_GROUPS } from './whManager'
import { WH_WORKER_MENU_GROUPS } from './whWorker'

export const MENU_BY_ROLE = {
  [ROLES.MASTER_ADMIN]: MASTER_ADMIN_MENU_GROUPS,
  [ROLES.SELLER]:       SELLER_MENU_GROUPS,
  [ROLES.SYSTEM_ADMIN]: SYSTEM_ADMIN_MENU_GROUPS,
  [ROLES.WH_MANAGER]:   WH_MANAGER_MENU_GROUPS,
  [ROLES.WH_WORKER]:    WH_WORKER_MENU_GROUPS,
}
