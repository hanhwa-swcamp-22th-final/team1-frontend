<script setup>
import { ref, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'

const props = defineProps({
  isOpen:       { type: Boolean, required: true },
  selectedCount: { type: Number, default: 0 },
})

const emit = defineEmits(['confirm', 'cancel'])

const pickingGroupBy = ref('WORKER_BIN')
const targetTime     = ref('')
const sendNotif      = ref(true)

const estimatedLists = computed(() => Math.ceil(props.selectedCount / 2) || 1)

function handleConfirm() {
  emit('confirm', {
    pickingGroupBy: pickingGroupBy.value,
    targetTime:     targetTime.value,
    sendNotif:      sendNotif.value,
  })
}
</script>

<template>
  <BaseModal
    title="일괄 출고 지시 발행"
    :isOpen="isOpen"
    width="640px"
    @cancel="$emit('cancel')"
  >
    <!-- 히어로 영역 -->
    <div class="hero">
      <div class="hero-top">
        <div>
          <div class="eyebrow">Dispatch Batch</div>
          <div class="hero-title">선택 주문 출고 지시 발행</div>
          <div class="hero-copy">
            주문을 묶어 피킹 리스트 생성 단계로 넘깁니다.<br />
            Worker-Bin 자동 배정 기준과 완료 목표 시간을 함께 관리합니다.
          </div>
        </div>
        <span class="badge badge--blue">피킹 리스트 생성</span>
      </div>

      <!-- KPI 카드 3개 -->
      <div class="data-grid">
        <div class="data-card">
          <span class="data-label">선택 주문</span>
          <div class="data-value">{{ selectedCount }}건</div>
        </div>
        <div class="data-card">
          <span class="data-label">피킹 묶음</span>
          <div class="data-value">존 기준</div>
        </div>
        <div class="data-card">
          <span class="data-label">예상 리스트</span>
          <div class="data-value">{{ estimatedLists }}개</div>
        </div>
      </div>
    </div>

    <!-- 설정 영역 -->
    <div class="settings-surface">
      <div class="settings-grid">
        <div class="field-group">
          <label class="field-label">피킹 묶음 기준</label>
          <select v-model="pickingGroupBy" class="field-select">
            <option value="WORKER_BIN">Worker-Bin 자동 배정</option>
            <option value="SELLER">셀러사별 묶음</option>
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">완료 목표 시간</label>
          <input
            v-model="targetTime"
            class="field-input"
            type="text"
            placeholder="예) 오늘 14:00"
          />
        </div>
      </div>
    </div>

    <!-- 커스텀 footer -->
    <template #footer>
      <div class="footer-wrap">
        <label class="notif-check">
          <input v-model="sendNotif" type="checkbox" />
          <span>피킹 리스트 생성 후 작업자 알림 전송</span>
        </label>
        <div class="footer-actions">
          <button class="btn btn--ghost" @click="$emit('cancel')">취소</button>
          <button class="btn btn--primary" @click="handleConfirm">발행</button>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
/* ── 히어로 ─────────────────────────────────────── */
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
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--t1);
  margin-bottom: var(--space-1);
}

.hero-copy {
  font-size: var(--font-size-sm);
  color: var(--t3);
  line-height: 1.5;
}

/* ── 데이터 카드 ─────────────────────────────────── */
.data-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

.data-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
}

.data-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--t3);
  margin-bottom: var(--space-1);
}

.data-value {
  font-family: var(--font-condensed);
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--t1);
}

/* ── 설정 영역 ─────────────────────────────────── */
.settings-surface {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

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

.field-select,
.field-input {
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
}

.field-select { cursor: pointer; }

.field-select:focus,
.field-input:focus {
  outline: none;
  border-color: var(--blue);
}

/* ── 배지 ──────────────────────────────────────── */
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
.badge--blue { background: var(--blue-pale); color: var(--blue); }

/* ── 커스텀 Footer ─────────────────────────────── */
.footer-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
}

.notif-check {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--t2);
  cursor: pointer;
}

.footer-actions {
  display: flex;
  gap: var(--space-2);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-4);
  height: 36px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background var(--ease-fast), color var(--ease-fast);
}

.btn--ghost {
  border-color: var(--border);
  background: transparent;
  color: var(--t2);
}
.btn--ghost:hover { background: var(--surface-2); color: var(--t1); }

.btn--primary {
  background: var(--blue);
  color: #fff;
}
.btn--primary:hover { opacity: 0.9; }
</style>