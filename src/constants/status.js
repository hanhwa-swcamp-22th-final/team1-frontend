/* ══════════════════════════════════════════════════════════
   ⚠️  임시 상수값 — 백엔드 API 스펙 확정 후 이 파일만 수정하면
       전체 프로젝트에 일괄 반영됩니다.
       컴포넌트/스토어에서 문자열 직접 사용 절대 금지.
   ══════════════════════════════════════════════════════════ */

/**
 * ORDER_STATUS — 주문 처리 4단계
 *
 * 상태 전이 흐름:
 *
 *   PENDING → CONFIRMED → PREPARING_ITEM → SHIPPED
 *      ↓           ↓           ↓
 *   CANCELLED   CANCELLED   CANCELLED
 *
 * PREPARING_ITEM: WH_WORKER가 피킹&패킹 진행
 * SHIPPED: 출고 완료 (최종 상태)
 * CANCELLED: PENDING·CONFIRMED·PREPARING_ITEM 단계에서 취소 가능
 *
 * StatusBadge.vue의 MAP.order와 연동됨.
 */
export const ORDER_STATUS = {
  PENDING: 'PENDING', // 주문 접수 (셀러 등록 초기 상태)
  CONFIRMED: 'CONFIRMED', // 주문 확인 (WH_MANAGER 확인)
  PREPARING_ITEM: 'PREPARING_ITEM', // 물품 준비 중 (피킹&패킹 진행)
  SHIPPED: 'SHIPPED', // 출고 완료 (최종 상태)
  CANCELLED: 'CANCELLED', // 취소
}

/**
 * ASN_STATUS — 입고 예정 통보서(Advance Shipping Notice) 2단계
 *
 * 상태 전이 흐름:
 *
 *   SUBMITTED → RECEIVED
 *       ↓
 *   CANCELLED
 *
 * SUBMITTED: 셀러가 ASN 등록 완료 → ITEM_STATUS.INBOUND_SCHEDULED 자동 생성
 * RECEIVED:  WH_MANAGER가 실제 입고 처리 완료 (최종 상태)
 * CANCELLED: SUBMITTED 단계에서만 취소 가능
 *
 * StatusBadge.vue의 MAP.asn과 연동됨.
 */
export const ASN_STATUS = {
  SUBMITTED: 'SUBMITTED', // 제출됨
  RECEIVED: 'RECEIVED', // 입고 완료 (최종 상태)
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
/**
 * SELLER_STATUS — 셀러 상태 3단계
 *
 * 상태 전이 흐름:
 *
 *   (신규 셀러 등록) → PENDING → ACTIVE
 *                                ↓
 *                             SUSPENDED (관리자 비활성화)
 *
 * PENDING: 셀러 초대 대기중
 * SUSPENDED: 정지됨
 *
 */
export const SELLER_STATUS ={
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED',
}

/**
 * ITEM_STATUS — 물품 상태 7단계 (REQ-074)
 *
 * 상태 전이 흐름:
 *
 *   INBOUND_SCHEDULED → INBOUND → INSPECTION_LOADING → STORED
 *                                                          ↓
 *                                         OUTBOUND_COMPLETE ← OUTBOUND_WAITING ← PICKING_PACKING
 *
 * INBOUND_SCHEDULED:  SELLER가 ASN을 등록하는 즉시 자동 생성
 * INBOUND:            물품이 Dock에 도착하고 WH_MANAGER가 1차 외관 검수 완료
 * INSPECTION_LOADING: 작업자가 수량/상태 정밀 검수 후 Bin에 적재
 * STORED:             적재 완료 후 피킹 전까지의 보관 상태
 * PICKING_PACKING:    출고 오더에 따라 피킹 + 포장 + 송장 부착
 * OUTBOUND_WAITING:   포장 완료 후 Stage Area로 이동된 상태
 * OUTBOUND_COMPLETE:  택배사(송장 스캔) 또는 운송 수단에 인계 완료 (최종 상태)
 *
 * StatusBadge.vue의 MAP.item과 연동됨.
 */
export const ITEM_STATUS = {
  INBOUND_SCHEDULED: 'INBOUND_SCHEDULED', // 입고예정
  INBOUND: 'INBOUND', // 입고
  INSPECTION_LOADING: 'INSPECTION_LOADING', // 검수&적재
  STORED: 'STORED', // 보관중
  PICKING_PACKING: 'PICKING_PACKING', // 피킹&패킹
  OUTBOUND_WAITING: 'OUTBOUND_WAITING', // 출고대기
  OUTBOUND_COMPLETE: 'OUTBOUND_COMPLETE', // 출고완료 (최종 상태)
}

/**
 * WORKER_STATUS — 작업자 상태 2단계 (REQ-075)
 *
 * INSPECTION_LOADING: 입고된 물품을 확인하고 Bin에 배치하는 작업 상태
 * PICKING_PACKING:    출고 오더에 따라 물품을 집어오고 포장하는 작업 상태
 *
 * StatusBadge.vue의 MAP.worker와 연동됨.
 */
export const WORKER_STATUS = {
  INSPECTION_LOADING: 'INSPECTION_LOADING', // 검수&적재 작업 중
  PICKING_PACKING: 'PICKING_PACKING', // 피킹&패킹 작업 중
}

/**
 * OUTBOUND_CONFIRM_STATUS — 출고 확정 상태 2단계
 *
 * 상태 전이 흐름:
 *
 *   PENDING_CONFIRM → CONFIRMED
 *
 * PENDING_CONFIRM: 인계 완료 (택배사 인계 후 출고 확정 대기)
 * CONFIRMED:       출고 확정 완료 (최종 재고 차감 완료)
 *
 * StatusBadge.vue의 MAP.outboundConfirm와 연동됨.
 */
export const OUTBOUND_CONFIRM_STATUS = {
  PENDING_CONFIRM: 'PENDING_CONFIRM', // 인계 완료
  CONFIRMED:       'CONFIRMED',       // 출고 확정 완료
}

/**
 * LABEL_STATUS — 배송 라벨 발행 상태 2단계
 *
 * 상태 전이 흐름:
 *
 *   NOT_ISSUED → ISSUED
 *
 * NOT_ISSUED: 라벨 미발행 (포장 완료 후 초기 상태)
 * ISSUED:     라벨 발행 완료
 *
 * StatusBadge.vue의 MAP.labelStatus와 연동됨.
 */
export const LABEL_STATUS = {
  NOT_ISSUED: 'NOT_ISSUED', // 라벨 미발행
  ISSUED:     'ISSUED',     // 라벨 발행 완료
}

/**
 * PICKING_LIST_STATUS — 피킹 리스트 상태 3단계
 *
 * 상태 전이 흐름:
 *
 *   WAITING → IN_PROGRESS → COMPLETED
 *
 * StatusBadge.vue의 MAP.pickingList와 연동됨.
 */
export const PICKING_LIST_STATUS = {
  WAITING:     'WAITING',     // 피킹 대기
  IN_PROGRESS: 'IN_PROGRESS', // 피킹 진행 중
  COMPLETED:   'COMPLETED',   // 피킹 완료
}

/**
 * WORKER_PRESENCE_STATUS — 작업자 재실 상태 4단계
 *
 * 상태 전이 흐름:
 *
 *   IDLE ⇄ PICKING | PUTAWAY
 *   IDLE / PICKING / PUTAWAY → OFFLINE (로그아웃/비활성화)
 *
 * PICKING:  피킹&패킹 작업 진행 중
 * PUTAWAY:  검수&적재(Put-away) 작업 진행 중
 * IDLE:     대기 중 (로그인 상태, 작업 없음)
 * OFFLINE:  오프라인 (로그아웃 또는 비활성 계정)
 *
 * StatusBadge.vue의 MAP.workerPresence와 연동됨.
 */
export const WORKER_PRESENCE_STATUS = {
  PICKING:  'PICKING',  // 작업 중 (피킹)
  PUTAWAY:  'PUTAWAY',  // 작업 중 (Put-away)
  IDLE:     'IDLE',     // 대기 중
  OFFLINE:  'OFFLINE',  // 오프라인
}
