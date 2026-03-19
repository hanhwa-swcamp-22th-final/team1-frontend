<script setup>
import { computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'

const props = defineProps({
  isOpen:         { type: Boolean, required: true },
  selectedOrders: { type: Array,   default: () => [] },
})

const emit = defineEmits(['confirm', 'cancel'])

const avgRate = computed(() => {
  if (!props.selectedOrders.length) return '0.00'
  const total = props.selectedOrders.reduce((acc, o) => acc + o.estimatedRate, 0)
  return (total / props.selectedOrders.length).toFixed(2)
})
</script>

<template>
  <BaseModal
    title="일괄 라벨 출력"
    :isOpen="isOpen"
    width="560px"
    @cancel="$emit('cancel')"
  >
    <!-- 히어로 -->
    <div class="hero">
      <div class="hero-top">
        <div>
          <div class="eyebrow">Batch Label Print</div>
          <div class="hero-title">{{ selectedOrders.length }}건 라벨 일괄 출력</div>
          <div class="hero-copy">주문별 추천 배송사 결과를 기준으로 PDF를 묶어서 출력합니다.</div>
        </div>
        <span class="badge badge--blue">PDF 묶음 생성</span>
      </div>
      <div class="metric-grid">
        <div class="metric-card">
          <span class="metric-label">대상 주문</span>
          <span class="metric-value">{{ selectedOrders.length }}건</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">최저요금 평균</span>
          <span class="metric-value">${{ avgRate }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">출력 형식</span>
          <span class="metric-value">PDF</span>
        </div>
      </div>
    </div>

    <!-- 경고 -->
    <div class="callout callout--warning">
      <div class="callout-title">출력 전 확인</div>
      <div class="callout-copy">배송사 추천 결과가 최저 요금 기준으로 선택되었는지, 그리고 예외 주문이 포함되지 않았는지 확인하세요.</div>
    </div>

    <template #footer>
      <div class="footer-row">
        <button class="ui-btn ui-btn--ghost" @click="$emit('cancel')">취소</button>
        <button class="ui-btn ui-btn--primary" @click="emit('confirm')">출력 시작</button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
/* ── 히어로 ────────────────────────────────────── */
.hero {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.eyebrow {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--blue);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-1);
}

.hero-title {
  font-family: var(--font-condensed);
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--t1);
  margin-bottom: var(--space-1);
}

.hero-copy {
  font-size: var(--font-size-xs);
  color: var(--t3);
  line-height: 1.5;
}

/* ── 메트릭 카드 ─────────────────────────────── */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

.metric-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.metric-label { font-size: var(--font-size-xs); color: var(--t3); }
.metric-value {
  font-family: var(--font-condensed);
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--t1);
}

/* ── callout ────────────────────────────────── */
.callout {
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-2);
}

.callout--warning {
  background: var(--amber-pale);
  border: 1px solid #d97706;
}

.callout-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #b45309;
  margin-bottom: var(--space-1);
}

.callout-copy {
  font-size: var(--font-size-xs);
  color: var(--t2);
  line-height: 1.5;
}

/* ── 배지 ────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}
.badge--blue { background: var(--blue-pale); color: var(--blue); }

/* ── Footer ──────────────────────────────── */
.footer-row {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  width: 100%;
}

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

.ui-btn--primary { background: var(--blue); color: #fff; }
.ui-btn--primary:hover { opacity: 0.9; }
.ui-btn--ghost { border-color: var(--border); background: transparent; color: var(--t2); }
.ui-btn--ghost:hover { background: var(--surface-2); color: var(--t1); }
</style>