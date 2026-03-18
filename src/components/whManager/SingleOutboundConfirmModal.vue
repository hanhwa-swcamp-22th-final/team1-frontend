<script setup>
import BaseModal from '@/components/common/BaseModal.vue'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  order:  { type: Object,  default: null  },
})

const emit = defineEmits(['confirm', 'cancel'])

function handleConfirm() {
  if (!props.order) return
  emit('confirm', { orderId: props.order.id })
}
</script>

<template>
  <BaseModal
    title="개별 출고 확정"
    :isOpen="isOpen"
    @cancel="$emit('cancel')"
  >
    <template v-if="order">
      <!-- 히어로 -->
      <div class="hero">
        <div class="hero-top">
          <div>
            <div class="eyebrow">Single Confirm</div>
            <div class="hero-title">{{ order.id }} 출고 확정</div>
            <div class="hero-copy">
              송장번호 <span class="mono">{{ order.trackingNumber }}</span>
              이 셀러 화면과 외부 채널 연동 대상에 반영됩니다.
            </div>
          </div>
          <span class="badge badge--amber">재고 차감 예정</span>
        </div>
      </div>

      <!-- 재고 차감 경고 -->
      <div class="callout callout--warning">
        <div class="callout-title">재고 차감 예정</div>
        <div class="callout-copy">
          <span v-for="(d, i) in order.skuDeductions" :key="d.sku">
            {{ d.sku }} {{ d.qty }}EA{{ i < order.skuDeductions.length - 1 ? ' / ' : '' }}
          </span>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="footer-row">
        <button class="ui-btn ui-btn--ghost" @click="$emit('cancel')">취소</button>
        <button class="ui-btn ui-btn--primary" :disabled="!order" @click="handleConfirm">확정</button>
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

.mono {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--t2);
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

/* ── callout ────────────────────────────── */
.callout {
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
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

.ui-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ui-btn--primary { background: var(--blue); color: #fff; }
.ui-btn--primary:not(:disabled):hover { opacity: 0.9; }
.ui-btn--ghost { border-color: var(--border); background: transparent; color: var(--t2); }
.ui-btn--ghost:hover { background: var(--surface-2); color: var(--t1); }
</style>