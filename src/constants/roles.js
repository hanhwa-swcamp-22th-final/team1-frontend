/**
 * ROLES — 사용자 역할 상수
 *
 * 각 Role의 담당 화면:
 *   SYSTEM_ADMIN → views/systemAdmin/   (플랫폼 전체 관리: 업체 등록, 수수료)
 *   MASTER_ADMIN → views/masterAdmin/   (창고사 관리: 창고·계정·요금·RBAC)
 *   WH_MANAGER   → views/whManager/     (창고 운영: ASN·재고·출고·작업자 계정)
 *   WH_WORKER    → views/whWorker/      (태블릿 터치 UI: 검수·피킹·패킹 작업)
 *   SELLER       → views/seller/        (셀러 셀프서비스: 상품·ASN·주문·아마존)
 *
 * ⚠️  WH_WORKER 주의사항:
 *   views/whWorker/ 는 태블릿(최소 768px) 터치 UI 기준으로 개발.
 *   큰 버튼(min 44px), 넓은 터치 영역, 데스크톱 호버 효과 불필요.
 *
 * 사용 예:
 *   import { ROLES } from '@/constants'
 *   if (auth.role === ROLES.WH_MANAGER) { ... }
 *
 * router/routes/ 에서 meta.role 설정:
 *   meta: { role: ROLES.SELLER }  → 해당 Role만 접근 허용
 */
export const ROLES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  MASTER_ADMIN: 'MASTER_ADMIN',
  WH_MANAGER: 'WH_MANAGER',
  WH_WORKER: 'WH_WORKER',
  SELLER: 'SELLER',
}
