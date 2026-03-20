<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import TimelineStepper from '@/components/common/TimelineStepper.vue'
import { ROUTE_NAMES } from '@/constants'
import {
  addWorkerStateListeners,
  createWorkerAlerts,
  createWorkerTaskSummaries,
  loadWorkerState,
} from '@/utils/whWorkerState'

const router = useRouter()
const route = useRoute()

const breadcrumb = [{ label: 'WH Worker' }, { label: '내 작업' }]
const FILTERS = ['전체', '대기', '진행중', '완료']

const tasks = ref([])
const alerts = ref([])
const activeFilter = ref('전체')
const selectedTaskId = ref('')

function syncTasksState() {
  const state = loadWorkerState()
  tasks.value = createWorkerTaskSummaries(state)
  alerts.value = createWorkerAlerts(state)
  applySelectionFromRoute()
  ensureVisibleSelection()
}

const filteredTasks = computed(() => {
  const ordered = [...tasks.value]
  if (activeFilter.value === '전체') return ordered
  return ordered.filter((task) => task.status === activeFilter.value)
})

const selectedTask = computed(() => {
  return (
    filteredTasks.value.find((task) => task.id === selectedTaskId.value) ??
    filteredTasks.value[0] ??
    tasks.value.find((task) => task.id === selectedTaskId.value) ??
    tasks.value[0] ??
    null
  )
})

const alertCards = computed(() => {
  return alerts.value
    .map((alert) => ({
      ...alert,
      task: tasks.value.find((task) => task.id === alert.taskId) ?? null,
    }))
    .filter((alert) => alert.task)
})

function applySelectionFromRoute() {
  const taskId = String(route.query.taskId || '')
  if (!taskId) return
  const matched = tasks.value.find((task) => task.id === taskId)
  if (!matched) return
  activeFilter.value = '전체'
  selectedTaskId.value = matched.id
}

function ensureVisibleSelection() {
  if (!tasks.value.length) {
    selectedTaskId.value = ''
    return
  }

  if (filteredTasks.value.some((task) => task.id === selectedTaskId.value)) return
  selectedTaskId.value = filteredTasks.value[0]?.id ?? tasks.value[0]?.id ?? ''
}

function selectTask(taskId) {
  selectedTaskId.value = taskId
}

function focusAlertTask(alert) {
  if (!alert?.task) return
  activeFilter.value = '전체'
  selectedTaskId.value = alert.task.id
  router.replace({ query: { ...route.query, taskId: alert.task.id, alertId: alert.id } })
}

function openSelectedTask() {
  const task = selectedTask.value
  if (!task) return

  if (task.type === '검수&적재') {
    router.push({
      name: ROUTE_NAMES.WH_WORKER_INBOUND,
      query: { taskId: task.id },
    })
    return
  }

  router.push({
    name: ROUTE_NAMES.WH_WORKER_OUTBOUND,
    query: { taskId: task.id },
  })
}

function statusClass(status) {
  if (status === '대기') return 'status-badge--wait'
  if (status === '진행중') return 'status-badge--progress'
  return 'status-badge--done'
}

function alertLevelClass(level) {
  if (level === '안내') return 'alert-badge--blue'
  if (level === '확인') return 'alert-badge--purple'
  return 'alert-badge--red'
}

const summaryInfo = computed(() => {
  const task = selectedTask.value
  if (!task) return []

  return [
    { label: '셀러 회사명', value: task.sellerCompany },
    { label: '참조번호', value: task.refNo },
    { label: '기존 상태', value: task.referenceStatus },
    { label: '담당 Bin', value: `${task.assignedBinCount} Bin` },
    { label: '총 수량', value: `${task.totalQty}개` },
    { label: '작업 메모', value: task.note },
  ]
})

watch(() => route.query.taskId, () => {
  applySelectionFromRoute()
  ensureVisibleSelection()
}, { immediate: true })

watch([activeFilter, filteredTasks], () => {
  ensureVisibleSelection()
})

let removeListeners = () => {}

onMounted(() => {
  syncTasksState()
  removeListeners = addWorkerStateListeners(syncTasksState)
})

onBeforeUnmount(() => {
  removeListeners()
})
</script>

<template>
  <AppLayout title="내 작업" :breadcrumb="breadcrumb">
    <div class="tasks-page">
      <!-- 상단: 오늘 배정된 작업 목록 카드 -->
      <section class="section-card">
        <div class="section-card__header section-card__header--table">
          <h2 class="section-title">오늘 배정된 작업 목록</h2>

          <div class="filter-tabs" role="tablist" aria-label="작업 상태 필터">
            <button
              v-for="filter in FILTERS"
              :key="filter"
              type="button"
              class="filter-tab"
              :class="{ 'filter-tab--active': activeFilter === filter }"
              @click="activeFilter = filter"
            >
              {{ filter }}
            </button>
          </div>
        </div>

        <!-- 작업 목록 테이블 -->
        <div class="task-table-wrap">
          <table class="task-table">
            <thead>
              <tr>
                <th>작업 ID</th>
                <th>작업 유형</th>
                <th>셀러 회사명</th>
                <th>참조번호</th>
                <th>담당 BIN</th>
                <th>수량</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="task in filteredTasks"
                :key="task.id"
                class="task-row"
                :class="{ 'task-row--selected': selectedTask?.id === task.id }"
                @click="selectTask(task.id)"
              >
                <td>{{ task.id }}</td>
                <td>{{ task.type }}</td>
                <td>{{ task.sellerCompany }}</td>
                <td>{{ task.refNo }}</td>
                <td>{{ task.assignedBinCount }} Bin</td>
                <td>{{ task.totalQty }}</td>
                <td>
                  <span class="status-badge" :class="statusClass(task.status)">{{ task.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 중단: 예외 알림 목록 카드 -->
      <section class="section-card alert-section">
        <div class="section-card__header alert-section__header">
          <div>
            <h2 class="section-title">예외 알림 목록</h2>
            <p class="section-subtitle">대시보드의 최근 예외 알림을 내 작업 화면에서도 카드 형태로 바로 확인할 수 있습니다.</p>
          </div>
        </div>

        <div v-if="alertCards.length" class="alert-grid">
          <button
            v-for="alert in alertCards"
            :key="alert.id"
            type="button"
            class="alert-card"
            :class="{ 'alert-card--selected': selectedTask?.id === alert.task?.id }"
            @click="focusAlertTask(alert)"
          >
            <div class="alert-card__top">
              <span class="alert-badge" :class="alertLevelClass(alert.level)">{{ alert.level }}</span>
              <span class="alert-time">{{ alert.time }}</span>
            </div>

            <div class="alert-card__body">
              <strong class="alert-title">{{ alert.title }}</strong>
              <p class="alert-desc">{{ alert.description }}</p>
            </div>

            <div class="alert-card__meta">
              <span class="alert-task-id">{{ alert.task?.id }}</span>
              <span class="alert-task-type">{{ alert.task?.type }}</span>
              <span class="status-badge" :class="statusClass(alert.task?.status)">{{ alert.task?.status }}</span>
            </div>

            <div class="alert-card__linked">
              <p class="alert-linked-label">연결 작업</p>
              <p class="alert-linked-value">{{ alert.task?.sellerCompany }} · {{ alert.task?.refNo }}</p>
            </div>
          </button>
        </div>

        <div v-else class="alert-empty">
          현재 확인할 예외 알림이 없습니다.
        </div>
      </section>

      <!-- 하단: 선택 작업 요약 카드 -->
      <section v-if="selectedTask" class="section-card summary-card">
        <div class="section-card__header summary-card__header">
          <h2 class="section-title">선택 작업 요약</h2>
          <button type="button" class="ui-btn ui-btn--primary" @click="openSelectedTask">
            {{ selectedTask.type === '검수&적재' ? '입고 관리에서 열기' : '출고 관리에서 열기' }}
          </button>
        </div>

        <div class="summary-card__body">
          <div class="summary-top">
            <div>
              <p class="task-kind">{{ selectedTask.type }}</p>
              <div class="summary-title-row">
                <h3 class="summary-id">{{ selectedTask.id }}</h3>
                <span class="status-badge" :class="statusClass(selectedTask.status)">{{ selectedTask.status }}</span>
              </div>
            </div>
          </div>

          <div class="stepper-wrap">
            <TimelineStepper :steps="selectedTask.steps" :current-step="selectedTask.currentStep" />
          </div>

          <!-- 요약 정보 박스는 3열 x 2행 구조 -->
          <div class="summary-grid-boxes">
            <article v-for="item in summaryInfo" :key="item.label" class="info-box">
              <p class="info-box__label">{{ item.label }}</p>
              <p class="info-box__value">{{ item.value }}</p>
            </article>
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
.tasks-page {
  display: grid;
  gap: 24px;
}

.section-card {
  background: var(--surface, #fff);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.section-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px 0;
}

.section-card__header--table {
  padding-bottom: 14px;
}

.section-title {
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 800;
  color: var(--text-primary, #172554);
}

.section-subtitle {
  margin: 8px 0 0;
  color: var(--t4, #7c8aa5);
  font-size: 13px;
  line-height: 1.5;
}

.filter-tabs {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tab {
  min-width: 56px;
  height: 38px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-2, #f8fafc);
  color: var(--text-primary, #172554);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tab--active {
  background: var(--blue, #4f6ef7);
  border-color: var(--blue, #4f6ef7);
  color: #fff;
}

.task-table-wrap {
  padding: 0 12px 14px;
}

.task-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
}

.task-table thead th {
  padding: 14px 16px;
  background: #fff;
  border-bottom: 1px solid var(--border);
  color: var(--t4, #7c8aa5);
  font-size: 13px;
  font-weight: 700;
  text-align: left;
}

.task-table tbody td {
  padding: 18px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary, #172554);
  font-size: 14px;
  font-weight: 600;
}

.task-table tbody tr:last-child td {
  border-bottom: 0;
}

.task-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.task-row:hover {
  background: rgba(79, 110, 247, 0.04);
}

.task-row--selected {
  background: rgba(79, 110, 247, 0.12);
}

.status-badge,
.alert-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
}

.status-badge--wait {
  background: #fff7df;
  color: #ba7a00;
}

.status-badge--progress {
  background: #eef2ff;
  color: #4f6ef7;
}

.status-badge--done {
  background: #e8f8f0;
  color: #16a34a;
}

.alert-section {
  padding-bottom: 20px;
}

.alert-section__header {
  padding-bottom: 16px;
}

.alert-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
  padding: 0 20px;
  align-items: stretch;
}

.alert-grid > * {
  min-width: 0;
}

.alert-card {
  appearance: none;
  -webkit-appearance: none;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  border: 1px solid var(--border, #dbe2ea);
  background: var(--surface-2, #f8fafc);
  border-radius: 18px;
  padding: 18px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 14px;
  font: inherit;
  color: inherit;
  box-shadow: none;
  transition: all 0.2s ease;
}

.alert-card:hover {
  border-color: var(--blue, #4f6ef7);
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(79, 110, 247, 0.08);
}

.alert-card--selected {
  border-color: var(--blue, #4f6ef7);
  background: rgba(79, 110, 247, 0.06);
  box-shadow: 0 10px 20px rgba(79, 110, 247, 0.08);
}

.alert-card__top,
.alert-card__meta,
.summary-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.alert-card__top {
  flex-wrap: wrap;
}

.alert-card__body {
  min-width: 0;
}

.alert-card__meta {
  flex-wrap: wrap;
  justify-content: flex-start;
}

.alert-title {
  display: block;
  margin: 0;
  color: var(--text-primary, #172554);
  font-size: 15px;
  font-weight: 800;
  line-height: 1.4;
  word-break: keep-all;
}

.alert-desc {
  margin: 8px 0 0;
  color: var(--t4, #7c8aa5);
  font-size: 13px;
  line-height: 1.5;
  word-break: keep-all;
}

.alert-time {
  font-size: 13px;
  font-weight: 700;
  color: var(--t4, #7c8aa5);
}

.alert-badge--blue {
  background: #eef2ff;
  color: #4f6ef7;
}

.alert-badge--purple {
  background: #f3e8ff;
  color: #7c3aed;
}

.alert-badge--red {
  background: #fee2e2;
  color: #dc2626;
}

.alert-task-id,
.alert-task-type {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid var(--border);
  color: var(--text-primary, #172554);
  font-size: 12px;
  font-weight: 700;
}

.alert-card__linked {
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.alert-linked-label {
  margin: 0 0 6px;
  color: var(--t4, #7c8aa5);
  font-size: 12px;
  font-weight: 700;
}

.alert-linked-value {
  margin: 0;
  color: var(--text-primary, #172554);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  word-break: break-word;
}

.alert-empty {
  margin: 0 20px;
  padding: 20px;
  border-radius: 16px;
  border: 1px dashed var(--border);
  background: var(--surface-2, #f8fafc);
  color: var(--t4, #7c8aa5);
  font-size: 14px;
  font-weight: 700;
  text-align: center;
}

.summary-card {
  padding: 0 0 18px;
}

.summary-card__header {
  padding-bottom: 12px;
}

.summary-card__body {
  padding: 0 20px 0;
}

.summary-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.summary-top > div {
  width: 100%;
}

.task-kind {
  margin: 0 0 6px;
  color: var(--blue, #4f6ef7);
  font-size: 13px;
  font-weight: 800;
}

.summary-title-row .status-badge {
  flex-shrink: 0;
}

.summary-id {
  margin: 0;
  font-size: 16px;
  line-height: 1.35;
  font-weight: 800;
  color: var(--text-primary, #172554);
}

.stepper-wrap {
  margin-bottom: 20px;
  padding: 0 8px;
}

.summary-grid-boxes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.info-box {
  min-height: 88px;
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: var(--surface-2, #f8fafc);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  text-align: left;
}

.info-box__label {
  margin: 0 0 12px;
  color: var(--t4, #7c8aa5);
  font-size: 13px;
  font-weight: 700;
}

.info-box__value {
  margin: 0;
  color: var(--text-primary, #172554);
  font-size: 14px;
  line-height: 1.45;
  font-weight: 700;
  word-break: keep-all;
}

@media (max-width: 1280px) {
  .section-title {
    font-size: 18px;
  }

  .summary-id {
    font-size: 16px;
  }

  .summary-grid-boxes {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .section-card__header,
  .summary-title-row,
  .alert-card__top {
    flex-direction: column;
    align-items: flex-start;
  }

  .task-table-wrap {
    overflow-x: auto;
  }

  .task-table {
    min-width: 880px;
  }

  .alert-grid,
  .summary-grid-boxes {
    grid-template-columns: 1fr;
  }

  .alert-card {
    padding: 16px;
  }
}
</style>
