<script setup>
/**
 * StatusBadge — 상태 색상 배지
 *
 * Props:
 *   status : string  — constants/status.js의 값 (예: ORDER_STATUS.PENDING)
 *   type   : 'order' | 'asn' | 'account'  — 상태 맵 선택 (기본 'order')
 *
 * 상태별 색상 매핑 테이블:
 *
 * [order]
 *   PENDING   → amber  (접수)
 *   CONFIRMED → blue   (확인)
 *   PICKING   → purple (피킹중)
 *   PACKING   → purple (패킹중)
 *   SHIPPED   → green  (출고완료)
 *   CANCELLED → red    (취소)
 *
 * [asn]
 *   DRAFT     → amber (작성중)
 *   SUBMITTED → blue  (제출됨)
 *   RECEIVED  → green (입고완료)
 *   CANCELLED → red   (취소)
 *
 * [account]
 *   ACTIVE        → green (정상)
 *   TEMP_PASSWORD → amber (임시비밀번호)
 *   INACTIVE      → red   (비활성)
 *
 * 알 수 없는 상태 fallback:
 *   MAP에 없는 status 값 → { label: props.status, color: 'default' }
 *   → 회색 배지에 원본 문자열 표시 (디버깅 용이)
 *
 * 사용 예:
 *   <StatusBadge :status="row.status" type="order" />
 *   <StatusBadge :status="user.accountStatus" type="account" />
 */
import { computed } from 'vue'
import { ORDER_STATUS, ASN_STATUS, ACCOUNT_STATUS } from '@/constants'

const props = defineProps({
  status: { type: String, required: true },
  type:   { type: String, default: 'order' },
})

/** type별 상태→표시정보 매핑 */
const MAP = {
  order: {
    [ORDER_STATUS.PENDING]:   { label: '접수',    color: 'amber'  },
    [ORDER_STATUS.CONFIRMED]: { label: '확인',    color: 'blue'   },
    [ORDER_STATUS.PICKING]:   { label: '피킹중',  color: 'purple' },
    [ORDER_STATUS.PACKING]:   { label: '패킹중',  color: 'purple' },
    [ORDER_STATUS.SHIPPED]:   { label: '출고완료', color: 'green'  },
    [ORDER_STATUS.CANCELLED]: { label: '취소',    color: 'red'    },
  },
  asn: {
    [ASN_STATUS.DRAFT]:     { label: '작성중',   color: 'amber' },
    [ASN_STATUS.SUBMITTED]: { label: '제출됨',   color: 'blue'  },
    [ASN_STATUS.RECEIVED]:  { label: '입고완료', color: 'green' },
    [ASN_STATUS.CANCELLED]: { label: '취소',     color: 'red'   },
  },
  account: {
    [ACCOUNT_STATUS.ACTIVE]:        { label: '정상',        color: 'green' },
    [ACCOUNT_STATUS.TEMP_PASSWORD]: { label: '임시비밀번호', color: 'amber' },
    [ACCOUNT_STATUS.INACTIVE]:      { label: '비활성',      color: 'red'   },
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
  <span class="badge" :class="`badge--${info.color}`">{{ info.label }}</span>
</template>

<style scoped>
.badge {
  display: inline-flex; align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.02em;
}
/* 색상별 스타일 (variables.css의 semantic color 쌍 사용) */
.badge--blue    { background: var(--blue-pale);   color: var(--blue);   }
.badge--green   { background: var(--green-pale);  color: var(--green);  }
.badge--amber   { background: var(--amber-pale);  color: #B45309;       }  /* amber 텍스트는 어두운 톤 */
.badge--red     { background: var(--red-pale);    color: var(--red);    }
.badge--purple  { background: var(--purple-pale); color: var(--purple); }
.badge--default { background: var(--surface-2);   color: var(--t3);     }  /* 알 수 없는 상태 */
</style>
