/* ══════════════════════════════════════════════════════════
   ⚠️  임시 상수값 — 백엔드 API 스펙 확정 후 이 파일만 수정하면
       전체 프로젝트에 일괄 반영됩니다.
       컴포넌트/스토어에서 문자열 직접 사용 절대 금지.
   ══════════════════════════════════════════════════════════ */

/**
 * ORDER_STATUS — 주문 처리 6단계
 *
 * 상태 전이 흐름:
 *
 *   PENDING → CONFIRMED → PICKING → PACKING → SHIPPED
 *      ↓           ↓          ↓         ↓
 *   CANCELLED   CANCELLED  CANCELLED CANCELLED
 *
 * PICKING/PACKING: WH_WORKER가 작업 수행
 * SHIPPED: WH_MANAGER가 출고 확인 후 전환
 * CANCELLED: 어느 단계에서든 취소 가능
 *
 * StatusBadge.vue의 MAP.order와 연동됨.
 */
export const ORDER_STATUS = {
  PENDING: 'PENDING', // 주문 접수 (셀러가 등록한 초기 상태)
  CONFIRMED: 'CONFIRMED', // 주문 확인 (WH_MANAGER 확인)
  PICKING: 'PICKING', // 피킹 중 (WH_WORKER 작업)
  PACKING: 'PACKING', // 패킹 중 (WH_WORKER 작업)
  SHIPPED: 'SHIPPED', // 출고 완료 (최종 상태)
  CANCELLED: 'CANCELLED', // 취소
}

/**
 * ASN_STATUS — 입고 예정 통보서(Advance Shipping Notice) 4단계
 *
 * 상태 전이 흐름:
 *
 *   DRAFT → SUBMITTED → RECEIVED
 *     ↓          ↓
 *  CANCELLED  CANCELLED
 *
 * DRAFT:     셀러가 작성 중 (미제출 상태)
 * SUBMITTED: 셀러가 제출 완료 → WH_MANAGER에게 입고 예정 알림
 * RECEIVED:  WH_MANAGER가 실제 입고 처리 완료
 *
 * StatusBadge.vue의 MAP.asn과 연동됨.
 */
export const ASN_STATUS = {
  DRAFT: 'DRAFT', // 작성 중
  SUBMITTED: 'SUBMITTED', // 제출됨
  RECEIVED: 'RECEIVED', // 입고 완료
  CANCELLED: 'CANCELLED', // 취소
}

/**
 * ACCOUNT_STATUS — 계정 상태 3단계
 *
 * 상태 전이 흐름:
 *
 *   (신규 계정 생성) → TEMP_PASSWORD → ACTIVE
 *                                          ↓
 *                                       INACTIVE (관리자 비활성화)
 *
 * TEMP_PASSWORD: 최초 로그인 시 강제 비밀번호 변경 (router/index.js 가드 #3 처리)
 * INACTIVE:      로그인 불가 상태
 *
 * StatusBadge.vue의 MAP.account와 연동됨.
 * router/index.js의 beforeEach 가드에서 TEMP_PASSWORD 체크.
 */
export const ACCOUNT_STATUS = {
  ACTIVE: 'ACTIVE', // 정상
  TEMP_PASSWORD: 'TEMP_PASSWORD', // 임시 비밀번호 (첫 로그인 강제 변경)
  INACTIVE: 'INACTIVE', // 비활성
}
