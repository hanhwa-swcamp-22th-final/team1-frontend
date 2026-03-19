<script setup>
import { computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  orders: { type: Array,   default: () => [] },
})

const emit = defineEmits(['cancel', 'confirm'])

const PRIORITY_OPTIONS = [
  { value: 'default', label: '기본' },
  { value: 'sameday', label: '당일 출고 우선' },
]

const warehouse = computed(() =>
  props.orders.length ? props.orders[0].warehouse : '창고 A',
)

const estimatedPickLists = computed(() =>
  Math.ceil(props.orders.length / 4) || 1,
)
</script>

<template>
  <BaseModal
    title="일괄 출고 지시"
    :isOpen="isOpen"
    width="640px"
    @cancel="emit('cancel')"
  >
    <!-- 히어로 영역 -->
    <div class="modal-hero">
      <div>
        <div class="modal-eyebrow">Outbound Batch</div>
        <div class="modal-hero-title">선택 주문 일괄 출고 지시</div>
        <div class="modal-hero-copy">
          선택된 주문들을 검증한 뒤 피킹 리스트 생성 단계로 넘깁니다.
          재고 할당 및 작업자 배정이 자동으로 처리됩니다.
        </div>
      </div>
      <span class="badge badge--blue">재고 검증 통과</span>
    </div>

    <!-- KPI 카드 3개 -->
    <div class="modal-kpis">
      <div class="modal-kpi">
        <div class="modal-kpi-label">선택 주문</div>
        <div class="modal-kpi-value">{{ orders.length }}건</div>
      </div>
      <div class="modal-kpi">
        <div class="modal-kpi-label">대상 창고</div>
        <div class="modal-kpi-value">{{ warehouse }}</div>
      </div>
      <div class="modal-kpi">
        <div class="modal-kpi-label">예상 피킹 리스트</div>
        <div class="modal-kpi-value">{{ estimatedPickLists }}건</div>
      </div>
    </div>

    <!-- 옵션 폼 -->
    <div class="modal-form-row">
      <div class="form-group">
        <label class="form-label">우선순위</label>
        <select class="form-input">
          <option v-for="opt in PRIORITY_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">작업 메모</label>
        <input
          class="form-input"
          type="text"
          placeholder="작업자에게 전달할 메모 입력..."
        />
      </div>
    </div>

    <!-- 다음 단계 callout -->
    <div class="callout">
      <div class="callout-title">다음 단계</div>
      <div class="callout-body">
        출고 지시 생성 후 피킹 리스트가 자동 발행되며, 담당 작업자에게 알림이 전송됩니다.
        작업자는 Bin 위치 기반 동선으로 피킹을 진행합니다.
      </div>
    </div>

    <!-- 커스텀 footer -->
    <template #footer>
      <button class="ui-btn ui-btn--ghost" @click="emit('cancel')">취소</button>
      <button class="ui-btn ui-btn--primary" @click="emit('confirm')">지시 생성</button>
    </template>
  </BaseModal>
</template>

<style scoped>
/* ── 히어로 ─────────────────────────────────── */
.modal-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}
.modal-eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--blue);
  margin-bottom: 6px;
}
.modal-hero-title {
  font-family: var(--font-condensed);
  font-size: 22px;
  font-weight: 700;
  color: var(--t1);
  margin-bottom: 6px;
}
.modal-hero-copy {
  font-size: 13px;
  color: var(--t3);
  line-height: 1.6;
}

/* ── KPI 카드 ─────────────────────────────────── */
.modal-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.modal-kpi {
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-2);
}
.modal-kpi-label { font-size: 11px; color: var(--t3); margin-bottom: 6px; }
.modal-kpi-value { font-size: 20px; font-weight: 700; color: var(--t1); }

/* ── 폼 ──────────────────────────────────────── */
.modal-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 12px; font-weight: 600; color: var(--t2); }
.form-input {
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: 13px;
  width: 100%;
  outline: none;
  transition: border-color var(--ease-fast);
}
.form-input:focus { border-color: var(--blue); }

/* ── Callout ──────────────────────────────────── */
.callout {
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--blue-pale);
  background: rgba(76, 116, 255, 0.04);
}
.callout-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--blue);
  margin-bottom: 6px;
}
.callout-body {
  font-size: 13px;
  color: var(--t2);
  line-height: 1.6;
}

/* ── 배지 ─────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
.badge--blue { background: var(--blue-pale); color: var(--blue); }

/* ── 버튼 ─────────────────────────────────────── */
.ui-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--t2);
  transition: background var(--ease-fast), color var(--ease-fast);
}
.ui-btn--ghost:hover  { background: var(--surface-2); color: var(--t1); }
.ui-btn--primary      { background: var(--blue); color: #fff; border-color: var(--blue); }
.ui-btn--primary:hover { background: #3a5fd8; border-color: #3a5fd8; }
</style>