<script setup>
import { ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  order:  { type: Object,  default: null  },
})

const emit = defineEmits(['confirm', 'cancel'])

const SERVICES = {
  USPS:  ['Priority Mail', 'First Class', 'Ground Advantage'],
  UPS:   ['Ground', 'UPS 2nd Day Air', 'UPS Next Day Air'],
  FedEx: ['Home Delivery', 'Ground', 'Express Saver'],
}

const form = ref({ carrier: '', service: '', labelFormat: '4x6 PDF' })

watch(() => props.order, (o) => {
  if (!o) return
  form.value.carrier     = o.recommendedCarrier
  form.value.service     = o.recommendedService
  form.value.labelFormat = '4x6 PDF'
}, { immediate: true })

watch(() => form.value.carrier, (carrier) => {
  form.value.service = SERVICES[carrier]?.[0] ?? ''
})

function handleConfirm() {
  emit('confirm', {
    orderId:     props.order.id,
    carrier:     form.value.carrier,
    service:     form.value.service,
    labelFormat: form.value.labelFormat,
  })
}
</script>

<template>
  <BaseModal
    title="배송 라벨 발행"
    :isOpen="isOpen"
    width="560px"
    @cancel="$emit('cancel')"
  >
    <template v-if="order">
      <!-- 히어로 -->
      <div class="hero">
        <div class="hero-top">
          <div>
            <div class="eyebrow">Label Issuance</div>
            <div class="hero-title">{{ order.id }} 배송 라벨 발행</div>
            <div class="hero-copy">추천 배송사, 예상 요금, 출력 형식을 확인한 뒤 라벨을 발행합니다. 발행 직후 출고 확정 단계로 이어집니다.</div>
          </div>
          <StatusBadge :status="order.recommendedCarrier" type="carrier" />
        </div>
        <div class="metric-grid">
          <div class="metric-card">
            <span class="metric-label">추천 배송사</span>
            <span class="metric-value">{{ order.recommendedCarrier }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">예상 요금</span>
            <span class="metric-value">${{ order.estimatedRate.toFixed(2) }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">출력 형식</span>
            <span class="metric-value">4x6 PDF</span>
          </div>
        </div>
      </div>

      <!-- 폼 -->
      <div class="form-surface">
        <div class="form-grid">
          <BaseForm label="배송사">
            <select v-model="form.carrier" class="form-select">
              <option v-for="c in Object.keys(SERVICES)" :key="c" :value="c">{{ c }}</option>
            </select>
          </BaseForm>
          <BaseForm label="서비스">
            <select v-model="form.service" class="form-select">
              <option v-for="s in (SERVICES[form.carrier] ?? [])" :key="s" :value="s">{{ s }}</option>
            </select>
          </BaseForm>
          <BaseForm label="예상 요금">
            <input class="form-input" :value="`$${order.estimatedRate.toFixed(2)}`" readonly />
          </BaseForm>
          <BaseForm label="출력 형식">
            <select v-model="form.labelFormat" class="form-select">
              <option value="4x6 PDF">4x6 PDF</option>
              <option value="ZPL">ZPL</option>
            </select>
          </BaseForm>
        </div>
      </div>

      <!-- 안내 -->
      <div class="callout callout--info">
        <div class="callout-title">발행 후 상태 변경</div>
        <div class="callout-copy">주문 상태가 라벨 발행 완료로 갱신되고, 출고 확정 화면에서 최종 재고 차감을 진행할 수 있습니다.</div>
      </div>
    </template>

    <template #footer>
      <div class="footer-row">
        <button class="ui-btn ui-btn--ghost" @click="$emit('cancel')">닫기</button>
        <button class="ui-btn ui-btn--primary" @click="handleConfirm">라벨 발행</button>
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

.metric-label {
  font-size: var(--font-size-xs);
  color: var(--t3);
}

.metric-value {
  font-family: var(--font-condensed);
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--t1);
}

/* ── 폼 ─────────────────────────────────────── */
.form-surface {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.form-select,
.form-input {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
}

.form-input[readonly] {
  background: var(--surface-2);
  color: var(--t2);
  cursor: default;
}

/* ── 안내 callout ─────────────────────────── */
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