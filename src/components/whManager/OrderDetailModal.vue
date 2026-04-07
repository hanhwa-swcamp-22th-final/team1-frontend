<script setup>
import { computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import TimelineStepper from '@/components/common/TimelineStepper.vue'
import { ORDER_STATUS } from '@/constants'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  order:  { type: Object,  default: null  },
})

defineEmits(['cancel'])

const CHANNEL_MAP = {
  amazon: { label: 'Amazon', color: 'badge--blue'  },
  manual: { label: '수동',   color: 'badge--gray'  },
  csv:    { label: 'CSV',    color: 'badge--gray'  },
}

const ORDER_STEPS = [
  { key: ORDER_STATUS.PENDING,        label: '접수' },
  { key: ORDER_STATUS.CONFIRMED,      label: '확인' },
  { key: ORDER_STATUS.PREPARING_ITEM, label: '물품준비중' },
  { key: ORDER_STATUS.SHIPPED,        label: '출고완료' },
]

const isCancelled = computed(() => props.order?.status === ORDER_STATUS.CANCELLED)
</script>

<template>
  <BaseModal
    :title="`주문 상세 · ${order?.id ?? ''}`"
    :isOpen="isOpen"
    :hideFooter="false"
    width="600px"
    @cancel="$emit('cancel')"
  >
    <template v-if="order">
      <!-- 히어로 배너 -->
      <div class="hero" :class="{ 'hero--cancelled': isCancelled }">
        <div class="hero-row">
          <div>
            <div class="eyebrow">Order ID</div>
            <div class="hero-id">{{ order.id }}</div>
          </div>
          <StatusBadge :status="order.status" type="order" />
        </div>
        <div class="hero-meta">
          <span class="badge" :class="CHANNEL_MAP[order.channel]?.color ?? 'badge--gray'">
            {{ CHANNEL_MAP[order.channel]?.label ?? order.channel }}
          </span>
          <span class="meta-dot">·</span>
          <span class="meta-text">{{ order.company }}</span>
          <span class="meta-dot">·</span>
          <span class="meta-text">{{ order.seller }}</span>
        </div>
      </div>

      <!-- 기본 정보 그리드 -->
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">주문 상품</div>
          <div class="info-value">{{ order.product }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">배송지</div>
          <div class="info-value">{{ order.region }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">주문일</div>
          <div class="info-value">{{ order.orderedAt }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">담당 창고</div>
          <div class="info-value">{{ order.warehouse }}</div>
        </div>
      </div>

      <!-- 취소 안내 -->
      <div v-if="isCancelled" class="cancelled-notice">
        이 주문은 취소 처리되었습니다.
      </div>

      <!-- 진행 타임라인 -->
      <div v-else class="timeline-section">
        <div class="section-label">처리 현황</div>
        <TimelineStepper :steps="ORDER_STEPS" :currentStep="order?.status" />
      </div>
    </template>

    <template #footer>
      <button class="ui-btn ui-btn--ghost" @click="$emit('cancel')">닫기</button>
    </template>
  </BaseModal>
</template>

<style scoped>
/* ── Hero ─────────────────────────────── */
.hero {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}
.hero--cancelled {
  border-color: var(--red);
  background: var(--red-pale);
}

.hero-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.eyebrow {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--blue);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.hero-id {
  font-family: var(--font-mono);
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--t1);
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.meta-dot { color: var(--t3); font-size: var(--font-size-xs); }
.meta-text { font-size: var(--font-size-sm); color: var(--t2); }

/* ── 채널 배지 ────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
}
.badge--blue { background: var(--blue-pale);   color: var(--blue); }
.badge--gray { background: var(--surface-2);   color: var(--t3); border: 1px solid var(--border); }

/* ── 기본 정보 그리드 ────────────────── */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.info-item {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.info-label {
  font-size: var(--font-size-xs);
  color: var(--t3);
  margin-bottom: 4px;
}

.info-value {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--t1);
}

/* ── 취소 안내 ────────────────────────── */
.cancelled-notice {
  padding: var(--space-4);
  border: 1px solid var(--red);
  border-radius: var(--radius-md);
  background: var(--red-pale);
  color: var(--red);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-align: center;
}

/* ── 타임라인 섹션 레이블 ───────────────── */
.section-label {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--t2);
  margin-bottom: var(--space-3);
}

/* ── 버튼 ─────────────────────────────── */
.ui-btn {
  display: inline-flex;
  align-items: center;
  padding: 0 var(--space-4);
  height: 36px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}
.ui-btn--ghost { border-color: var(--border); background: transparent; color: var(--t2); }
.ui-btn--ghost:hover { background: var(--surface-2); color: var(--t1); }
</style>