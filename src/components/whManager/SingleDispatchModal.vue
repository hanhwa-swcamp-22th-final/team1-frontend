<script setup>
import { ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  order:  { type: Object,  default: null },
  workers: { type: Array, default: () => [] },
})

const emit = defineEmits(['confirm', 'cancel'])

const selectedWorkerId = ref('')

watch(() => props.isOpen, (val) => {
  if (val && props.workers.length) {
    selectedWorkerId.value = props.workers[0].id
  }
})

function handleConfirm() {
  emit('confirm', {
    orderId: props.order?.id,
    workerId: selectedWorkerId.value,
  })
}
</script>

<template>
  <BaseModal
    title="개별 출고 지시"
    :isOpen="isOpen"
    width="480px"
    @confirm="handleConfirm"
    @cancel="$emit('cancel')"
  >
    <template v-if="order">
      <!-- 주문 정보 요약 -->
      <div class="dispatch-hero">
        <div class="dispatch-eyebrow">Single Dispatch</div>
        <div class="dispatch-title">{{ order.id }} 피킹 지시</div>
        <div class="dispatch-copy">
          {{ order.sellerName }} · {{ order.itemSummary }} · {{ order.shipDestination }}
        </div>
        <span class="badge badge--green">재고 검증 완료</span>
      </div>

      <!-- 작업자 선택 -->
      <div class="field-group">
        <label class="field-label">담당 작업자</label>
        <select v-model="selectedWorkerId" class="field-select">
          <option v-for="w in workers" :key="w.id" :value="w.id">
            {{ w.name }}
          </option>
        </select>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.dispatch-hero {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}

.dispatch-eyebrow {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--blue);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-1);
}

.dispatch-title {
  font-family: var(--font-condensed);
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--t1);
  margin-bottom: var(--space-1);
}

.dispatch-copy {
  font-size: var(--font-size-sm);
  color: var(--t3);
  margin-bottom: var(--space-3);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
}
.badge--green { background: var(--green-pale); color: var(--green); }

.field-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--t2);
}

.field-select {
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
  cursor: pointer;
}
.field-select:focus {
  outline: none;
  border-color: var(--blue);
}
</style>