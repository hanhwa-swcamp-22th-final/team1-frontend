<script setup>
import { ref, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { WORKER_STATUS, TASK_STATUS, WORKER_PRESENCE_STATUS } from '@/constants'

const props = defineProps({
  isOpen:        { type: Boolean, required: true },
  task:          { type: Object,  default: null  },
  worker:        { type: Object,  default: null  },
  workerOptions: { type: Array,   default: () => [] },
})

const emit = defineEmits(['confirm', 'cancel'])

const selectedWorkerId   = ref('')
const selectedTaskType   = ref('')
const sendNotification   = ref(true)

// task가 변경될 때 초기화
function init() {
  selectedWorkerId.value = props.task?.workerId ?? props.worker?.id ?? ''
  selectedTaskType.value = props.task?.type ?? WORKER_STATUS.PICKING_PACKING
}

// 새 배정 모드(task 없음) vs 재배정 모드
const isNewMode = computed(() => !props.task)

// isOpen watch 대신 computed로 task 변화 감지
const taskTypeLabel = computed(() => {
  if (selectedTaskType.value === WORKER_STATUS.INSPECTION_LOADING) return '검수&적재'
  if (selectedTaskType.value === WORKER_STATUS.PICKING_PACKING)    return '피킹&패킹'
  return '-'
})

// 후보 비교 테이블 — workerOptions에서 추천도 자동 설정
const candidateWorkers = computed(() =>
  props.workerOptions.map(w => ({
    ...w,
    recommendation:
      w.id === props.task?.workerId
        ? TASK_STATUS.COMPLETED
        : w.presenceStatus === WORKER_PRESENCE_STATUS.IDLE
          ? TASK_STATUS.PARTIAL_DONE
          : TASK_STATUS.WAITING,
  }))
)

function handleOpen() {
  init()
}

function handleConfirm() {
  emit('confirm', {
    taskId:           props.task?.id,
    workerId:         selectedWorkerId.value,
    sendNotification: sendNotification.value,
  })
}
</script>

<template>
  <BaseModal
    title="작업 배정 및 재조정"
    :is-open="isOpen"
    width="760px"
    @cancel="emit('cancel')"
    @confirm="handleConfirm"
    @vue:mounted="handleOpen"
  >
    <!-- 히어로 섹션 -->
    <div class="assign-hero">
      <div class="assign-hero__info">
        <p class="assign-hero__eyebrow">Worker Task Control</p>
        <h3 class="assign-hero__title">
          {{ isNewMode ? '예외 작업 수동 배정' : task.refDoc + ' 수동 재배정' }}
        </h3>
      </div>
      <StatusBadge :status="isNewMode ? TASK_STATUS.WAITING : TASK_STATUS.REVIEW_NEEDED" type="taskStatus" />
    </div>

    <!-- 메트릭 카드 4개 (task 있을 때만) -->
    <div v-if="task" class="metric-grid">
      <div class="metric-card">
        <p class="metric-card__label">작업 유형</p>
        <p class="metric-card__value">{{ taskTypeLabel }}</p>
      </div>
      <div class="metric-card">
        <p class="metric-card__label">영향 Bin</p>
        <p class="metric-card__value">{{ task.bins?.join(', ') || '-' }}</p>
      </div>
      <div class="metric-card">
        <p class="metric-card__label">현재 작업자</p>
        <p class="metric-card__value">{{ task.workerName || '미배정' }}</p>
      </div>
      <div class="metric-card">
        <p class="metric-card__label">기준 문서</p>
        <p class="metric-card__value">{{ task.refDoc || '-' }}</p>
      </div>
    </div>

    <!-- 배정 폼 -->
    <div class="form-section">
      <BaseForm label="작업 유형">
        <select v-model="selectedTaskType" class="select-input">
          <option :value="WORKER_STATUS.INSPECTION_LOADING">검수&적재</option>
          <option :value="WORKER_STATUS.PICKING_PACKING">피킹&패킹</option>
        </select>
      </BaseForm>

      <BaseForm label="기준 문서">
        <input :value="task?.refDoc ?? '-'" class="text-input" readonly />
      </BaseForm>

      <BaseForm label="영향 Bin">
        <input :value="task?.bins?.join(', ') ?? '-'" class="text-input" readonly />
      </BaseForm>

      <BaseForm label="최종 작업자">
        <select v-model="selectedWorkerId" class="select-input">
          <option value="" disabled>작업자 선택</option>
          <option v-for="w in workerOptions" :key="w.id" :value="w.id">
            {{ w.name }} ({{ w.id }})
          </option>
        </select>
      </BaseForm>
    </div>

    <!-- 자동 추천 기준 chips -->
    <div class="chips-row">
      <span class="chip">① 동일 SKU 기적재 Bin 우선</span>
      <span class="chip">② 수용 수량 충분한 빈 Bin</span>
      <span class="chip">③ Zone 내 근접 위치</span>
    </div>

    <!-- 후보 작업자 비교 테이블 -->
    <div v-if="candidateWorkers.length" class="section">
      <h4 class="section__title">후보 작업자 비교</h4>
      <table class="compare-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>담당 존</th>
            <th>현재 상태</th>
            <th>추천도</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in candidateWorkers"
            :key="c.id"
            :class="{ 'row--selected': c.id === selectedWorkerId }"
            style="cursor: pointer"
            @click="selectedWorkerId = c.id"
          >
            <td>{{ c.name }}</td>
            <td>{{ c.zones?.join(', ') || '-' }}</td>
            <td><StatusBadge :status="c.presenceStatus" type="workerPresence" /></td>
            <td><StatusBadge :status="c.recommendation" type="taskStatus" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 알림 안내 callout -->
    <div class="callout callout--info">
      배정 완료 시 선택된 작업자의 태블릿에 푸시 알림이 전송됩니다.
    </div>

    <!-- footer 슬롯: 체크박스 + 취소 + 확정 -->
    <template #footer>
      <label class="notify-check">
        <input v-model="sendNotification" type="checkbox" />
        작업자에게 알림 전송
      </label>
      <div class="footer-actions">
        <button class="btn btn--secondary" @click="emit('cancel')">취소</button>
        <button
          class="btn btn--primary"
          :disabled="!selectedWorkerId"
          @click="handleConfirm"
        >
          배정 확정
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.assign-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px;
  background: var(--surface-2);
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
}
.assign-hero__eyebrow {
  font-size: var(--font-size-xs);
  color: var(--t3);
  margin: 0 0 4px;
}
.assign-hero__title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--t1);
  margin: 0;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.metric-card {
  background: var(--surface-2);
  border-radius: var(--radius-md);
  padding: 12px;
  text-align: center;
}
.metric-card__label {
  font-size: var(--font-size-xs);
  color: var(--t3);
  margin: 0 0 4px;
}
.metric-card__value {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--t1);
  margin: 0;
  word-break: break-all;
}

.form-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
  margin-bottom: 16px;
}

.select-input,
.text-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-1);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--surface-1);
  color: var(--t1);
}
.text-input[readonly] {
  background: var(--surface-2);
  color: var(--t3);
}

.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.chip {
  padding: 4px 10px;
  background: var(--blue-pale);
  color: var(--blue);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.section {
  margin-bottom: 16px;
}
.section__title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--t2);
  margin: 0 0 10px;
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}
.compare-table th,
.compare-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid var(--border-1);
}
.compare-table th {
  color: var(--t3);
  font-weight: 600;
  background: var(--surface-2);
}
.row--selected {
  background: var(--blue-pale);
}

.callout {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  margin-bottom: 8px;
}
.callout--info {
  background: var(--blue-pale);
  color: var(--blue);
  border-left: 3px solid var(--blue);
}

.notify-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  color: var(--t2);
  cursor: pointer;
}
.footer-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
.btn {
  padding: 8px 20px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  border: none;
}
.btn--secondary {
  background: var(--surface-2);
  color: var(--t2);
}
.btn--primary {
  background: var(--blue);
  color: #fff;
}
.btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>