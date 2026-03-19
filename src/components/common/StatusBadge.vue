<script setup>
/**
 * StatusBadge — 상태 색상 배지
 *
 * Props:
 *   status : string  — constants/status.js의 값 (예: ORDER_STATUS.PENDING)
 *   type   : 'order' | 'asn' | 'account' | 'seller' | 'item' | 'worker'  — 상태 맵 선택 (기본 'order')
 *
 * 상태별 색상 매핑 테이블:
 *
 * [order]
 *   PENDING        → amber  (접수)
 *   CONFIRMED      → blue   (확인)
 *   PREPARING_ITEM → purple (물품준비중)
 *   SHIPPED        → green  (출고완료)
 *   CANCELLED      → red    (취소)
 *
 * [asn]
 *   SUBMITTED → blue  (제출됨)
 *   RECEIVED  → green (입고완료)
 *   CANCELLED → red   (취소)
 *
 * [account]
 *   ACTIVE        → green (정상)
 *   TEMP_PASSWORD → amber (임시비밀번호)
 *   INACTIVE      → red   (비활성)
 *
 * [seller]
 *   ACTIVE        → green (정상)
 *   PENDING       → amber (초대대기)
 *   SUSPENDED     → red   (정지)
 *
 * [item]
 *   INBOUND_SCHEDULED  → amber  (입고예정)
 *   INBOUND            → blue   (입고)
 *   INSPECTION_LOADING → purple (검수&적재)
 *   STORED             → green  (보관중)
 *   PICKING_PACKING    → purple (피킹&패킹)
 *   OUTBOUND_WAITING   → gold   (출고대기)
 *   OUTBOUND_COMPLETE  → green  (출고완료)
 *
 * [worker]
 *   INSPECTION_LOADING → purple (검수&적재)
 *   PICKING_PACKING    → amber  (피킹&패킹)
 *
 * 알 수 없는 상태 fallback:
 *   MAP에 없는 status 값 → { label: props.status, color: 'default' }
 *   → 회색 배지에 원본 문자열 표시 (디버깅 용이)
 *
 * 사용 예:
 *   <StatusBadge :status="row.status" type="order" />
 *   <StatusBadge :status="user.accountStatus" type="account" />
 *   <StatusBadge :status="item.status" type="item" />
 */
import { computed } from 'vue'
import { ACCOUNT_STATUS, ASN_STATUS, ITEM_STATUS, LABEL_STATUS, ORDER_STATUS, OUTBOUND_CONFIRM_STATUS, PICKING_LIST_STATUS, TASK_ASSIGN_TYPE, TASK_STATUS, WORKER_PRESENCE_STATUS, WORKER_STATUS } from '@/constants'

const props = defineProps({
  status: { type: String, required: true },
  type: { type: String, default: 'order' },
})

/** type별 상태→표시정보 매핑 */
const MAP = {
  order: {
    [ORDER_STATUS.PENDING]: { label: '접수', color: 'amber' },
    [ORDER_STATUS.CONFIRMED]: { label: '확인', color: 'blue' },
    [ORDER_STATUS.PREPARING_ITEM]: { label: '물품준비중', color: 'purple' },
    [ORDER_STATUS.SHIPPED]: { label: '출고완료', color: 'green' },
    [ORDER_STATUS.CANCELLED]: { label: '취소', color: 'red' },
  },
  asn: {
    [ASN_STATUS.SUBMITTED]: { label: '제출됨', color: 'blue' },
    [ASN_STATUS.RECEIVED]: { label: '입고완료', color: 'green' },
    [ASN_STATUS.CANCELLED]: { label: '취소', color: 'red' },
  },
  account: {
    [ACCOUNT_STATUS.ACTIVE]: { label: '정상', color: 'green' },
    [ACCOUNT_STATUS.TEMP_PASSWORD]: { label: '임시비밀번호', color: 'amber' },
    [ACCOUNT_STATUS.INACTIVE]: { label: '비활성', color: 'red' },
  },
  seller: {
    [SELLER_STATUS.ACTIVE]: { label: '정상', color: 'green' },
    [SELLER_STATUS.PENDING]: { label: '초대대기', color: 'amber' },
    [SELLER_STATUS.SUSPENDED]: { label: '비활성', color: 'red' },
  },
  item: {
    [ITEM_STATUS.INBOUND_SCHEDULED]: { label: '입고예정', color: 'amber' },
    [ITEM_STATUS.INBOUND]: { label: '입고', color: 'blue' },
    [ITEM_STATUS.INSPECTION_LOADING]: { label: '검수&적재', color: 'purple' },
    [ITEM_STATUS.STORED]: { label: '보관중', color: 'green' },
    [ITEM_STATUS.PICKING_PACKING]: { label: '피킹&패킹', color: 'purple' },
    [ITEM_STATUS.OUTBOUND_WAITING]: { label: '출고대기', color: 'gold' },
    [ITEM_STATUS.OUTBOUND_COMPLETE]: { label: '출고완료', color: 'green' },
  },
  worker: {
    [WORKER_STATUS.INSPECTION_LOADING]: { label: '검수&적재', color: 'purple' },
    [WORKER_STATUS.PICKING_PACKING]: { label: '피킹&패킹', color: 'amber' },
  },
  pickingList: {
    [PICKING_LIST_STATUS.WAITING]:     { label: '대기',    color: 'default' },
    [PICKING_LIST_STATUS.IN_PROGRESS]: { label: '진행 중', color: 'amber'   },
    [PICKING_LIST_STATUS.COMPLETED]:   { label: '완료',    color: 'green'   },
  },
  labelStatus: {
    [LABEL_STATUS.NOT_ISSUED]: { label: '라벨 미발행',   color: 'amber' },
    [LABEL_STATUS.ISSUED]:     { label: '라벨 발행 완료', color: 'green' },
  },
  carrier: {
    USPS:  { label: 'USPS',  color: 'green'  },
    UPS:   { label: 'UPS',   color: 'blue'   },
    FedEx: { label: 'FedEx', color: 'purple' },
  },
  outboundConfirm: {
    [OUTBOUND_CONFIRM_STATUS.PENDING_CONFIRM]: { label: '인계 완료',    color: 'amber' },
    [OUTBOUND_CONFIRM_STATUS.CONFIRMED]:       { label: '출고 확정 완료', color: 'green' },
  },
  workerPresence: {
    [WORKER_PRESENCE_STATUS.PICKING]:  { label: '작업 중 (피킹&패킹)', color: 'amber'   },
    [WORKER_PRESENCE_STATUS.PUTAWAY]:  { label: '작업 중 (Put-away)', color: 'purple'  },
    [WORKER_PRESENCE_STATUS.IDLE]:     { label: '대기 중',            color: 'green'   },
    [WORKER_PRESENCE_STATUS.OFFLINE]:  { label: '오프라인',           color: 'default' },
  },
  taskStatus: {
    [TASK_STATUS.WAITING]:       { label: '대기',      color: 'default' },
    [TASK_STATUS.IN_PROGRESS]:   { label: '진행중',    color: 'amber'   },
    [TASK_STATUS.PARTIAL_DONE]:  { label: '부분완료',  color: 'amber'   },
    [TASK_STATUS.COMPLETED]:     { label: '완료',      color: 'green'   },
    [TASK_STATUS.REVIEW_NEEDED]: { label: '검토 필요', color: 'red'     },
  },
  taskAssignType: {
    [TASK_ASSIGN_TYPE.AUTO]:   { label: '자동', color: 'blue' },
    [TASK_ASSIGN_TYPE.MANUAL]: { label: '수동', color: 'gold' },
  },
}

/**
 * 현재 props에 해당하는 배지 표시 정보 계산.
 * MAP에 없는 상태는 원본 문자열을 회색으로 표시 (fallback).
 */
const info = computed(() => {
  const entry = MAP[props.type]?.[props.status]
  return entry ?? { label: props.status, color: 'default' }
})
</script>

<template>
  <span :class="`badge--${info.color}`" class="badge">{{ info.label }}</span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.02em;
}
/* 색상별 스타일 (variables.css의 semantic color 쌍 사용) */
.badge--blue {
  background: var(--blue-pale);
  color: var(--blue);
}
.badge--green {
  background: var(--green-pale);
  color: var(--green);
}
.badge--amber {
  background: var(--amber-pale);
  color: #b45309;
} /* amber 텍스트는 어두운 톤 */
.badge--red {
  background: var(--red-pale);
  color: var(--red);
}
.badge--purple {
  background: var(--purple-pale);
  color: var(--purple);
}
.badge--gold {
  background: var(--gold-pale);
  color: #b45309;
}
.badge--default {
  background: var(--surface-2);
  color: var(--t3);
} /* 알 수 없는 상태 */
</style>
