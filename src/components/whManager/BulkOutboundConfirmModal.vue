<script setup>
import { ref, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const props = defineProps({
  isOpen:         { type: Boolean, required: true },
  selectedOrders: { type: Array,   default: () => [] },
})

const emit = defineEmits(['confirm', 'cancel'])

const includeCsv = ref(true)

const carrierSummary = computed(() => {
  const carriers = [...new Set(props.selectedOrders.map(o => o.carrier))]
  return carriers.join(' / ')
})

function handleConfirm() {
  if (!props.selectedOrders.length) return
  emit('confirm', {
    orderIds:   props.selectedOrders.map(o => o.id),
    includeCsv: includeCsv.value,
  })
}
</script>

<template>
  <BaseModal
    title="일괄 출고 확정"
    :isOpen="isOpen"
    width="600px"
    @cancel="$emit('cancel')"
  >
    <!-- 히어로 -->
    <div class="hero">
      <div class="hero-top">
        <div>
          <div class="eyebrow">Outbound Finalization</div>
          <div class="hero-title">{{ selectedOrders.length }}건 일괄 출고 확정</div>
          <div class="hero-copy">송장 발행 완료 주문을 한 번에 확정합니다. 확정 시 재고 차감, 셀러 화면 반영, 외부 채널용 CSV 준비가 동시에 진행됩니다.</div>
        </div>
        <span class="badge badge--amber">최종 차감 대기</span>
      </div>
      <div class="metric-grid">
        <div class="metric-card">
          <span class="metric-label">대상 주문</span>
          <span class="metric-value">{{ selectedOrders.length }}건</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">배송사</span>
          <span class="metric-value">{{ carrierSummary || '-' }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">CSV 준비</span>
          <span class="metric-value">{{ includeCsv ? '활성' : '비활성' }}</span>
        </div>
      </div>
    </div>

    <!-- 선택 주문 목록 -->
    <div class="table-wrap">
      <table class="confirm-table">
        <thead>
          <tr>
            <th>주문번호</th>
            <th>배송사</th>
            <th>송장번호</th>
            <th class="col-status">상태</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in selectedOrders" :key="o.id">
            <td class="mono">{{ o.id }}</td>
            <td><StatusBadge :status="o.carrier" type="carrier" /></td>
            <td class="mono tracking">{{ o.trackingNumber }}</td>
            <td><StatusBadge :status="o.status" type="outboundConfirm" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 안내 callout -->
    <div class="callout callout--info">
      <div class="callout-title">출고 확정 후</div>
      <div class="callout-copy">Amazon 외 채널 주문은 송장 CSV 다운로드 대상에 자동 포함됩니다.</div>
    </div>

    <template #footer>
      <div class="footer-row">
        <label class="csv-check">
          <input v-model="includeCsv" type="checkbox" />
          <span>Amazon 외 채널 송장 CSV 준비</span>
        </label>
        <div class="footer-actions">
          <button class="ui-btn ui-btn--ghost" @click="$emit('cancel')">취소</button>
          <button
            class="ui-btn ui-btn--primary"
            :disabled="!selectedOrders.length"
            @click="handleConfirm"
          >
            확정
          </button>
        </div>
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

/* ── 테이블 ─────────────────────────────────── */
.table-wrap {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: var(--space-4);
}

.confirm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.confirm-table th {
  padding: 8px 12px;
  background: var(--surface-2);
  color: var(--t3);
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.confirm-table td {
  padding: 8px 12px;
  color: var(--t1);
  border-bottom: 1px solid var(--border);
}

.confirm-table tr:last-child td { border-bottom: none; }

.col-status { width: 110px; }
.mono       { font-family: var(--font-mono); font-size: var(--font-size-xs); color: var(--blue); }
.tracking   { color: var(--t3); }

/* ── callout ────────────────────────────────── */
.callout {
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-2);
}

.callout--info {
  background: var(--blue-pale);
  border: 1px solid var(--blue);
}

.callout-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--blue);
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
  flex-shrink: 0;
}
.badge--amber { background: var(--amber-pale); color: #b45309; }

/* ── Footer ──────────────────────────────── */
.footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: var(--space-3);
}

.footer-actions {
  display: flex;
  gap: var(--space-2);
}

.csv-check {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--t2);
  cursor: pointer;
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

.ui-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ui-btn--primary { background: var(--blue); color: #fff; }
.ui-btn--primary:not(:disabled):hover { opacity: 0.9; }
.ui-btn--ghost { border-color: var(--border); background: transparent; color: var(--t2); }
.ui-btn--ghost:hover { background: var(--surface-2); color: var(--t1); }
</style>