<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import TimelineStepper from '@/components/common/TimelineStepper.vue'
import { ROUTE_NAMES } from '@/constants'
import {
  addWorkerStateListeners,
  createWorkerAlerts,
  createWorkerDashboardTasks,
  loadWorkerState,
  resetWorkerState,
} from '@/utils/whWorkerState'

const router = useRouter()
const STORAGE_KEY = 'wh-worker-shared-state-v2'
const OVERVIEW_FILTERS = ['전체', '대기', '진행중', '완료']
const breadcrumb = [{ label: 'WH Worker' }, { label: '통합 대시보드' }]

const tasks = ref([])
const alerts = ref([])
const overviewFilter = ref('전체')
const highlightedTaskId = ref('')

function syncDashboardState() {
  const state = loadWorkerState()
  tasks.value = createWorkerDashboardTasks(state)
  alerts.value = createWorkerAlerts(state)

  const hasHighlighted = tasks.value.some((task) => task.id === highlightedTaskId.value)
  if (!hasHighlighted) {
    highlightedTaskId.value = tasks.value[0]?.id ?? ''
  }
}

const allTaskCount = computed(() => tasks.value.length)
const waitingTaskCount = computed(() => tasks.value.filter((task) => task.status === '대기').length)
const progressTaskCount = computed(() => tasks.value.filter((task) => task.status === '진행중').length)
const doneTaskCount = computed(() => tasks.value.filter((task) => task.status === '완료').length)

const filteredOverviewTasks = computed(() => {
  const ordered = [...tasks.value].sort(sortTasks)
  if (overviewFilter.value === '전체') return ordered
  return ordered.filter((task) => task.status === overviewFilter.value)
})

const inboundTasks = computed(() => [...tasks.value].filter((task) => task.type === '검수&적재').sort(sortTasks).slice(0, 3))
const outboundTasks = computed(() => [...tasks.value].filter((task) => task.type === '피킹&패킹').sort(sortTasks).slice(0, 3))
const highlightedTask = computed(() => tasks.value.find((task) => task.id === highlightedTaskId.value) ?? filteredOverviewTasks.value[0] ?? null)

const summaryCards = computed(() => [
  {
    key: 'all',
    label: '전체 작업',
    value: `${allTaskCount.value}건`,
    description: '오늘 작업자에게 배정된 전체 작업 수',
    tone: 'blue',
  },
  {
    key: 'wait',
    label: '대기 작업',
    value: `${waitingTaskCount.value}건`,
    description: '바로 시작 가능한 작업',
    tone: 'amber',
  },
  {
    key: 'progress',
    label: '진행중 작업',
    value: `${progressTaskCount.value}건`,
    description: '현재 입력 또는 검수 중인 작업',
    tone: 'purple',
  },
  {
    key: 'done',
    label: '완료 작업',
    value: `${doneTaskCount.value}건`,
    description: '오늘 완료 처리된 작업',
    tone: 'green',
  },
])

function sortTasks(a, b) {
  const statusRank = { 대기: 0, 진행중: 1, 완료: 2 }
  const typeRank = { '검수&적재': 0, '피킹&패킹': 1 }
  return (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99) || (typeRank[a.type] ?? 99) - (typeRank[b.type] ?? 99) || a.refNo.localeCompare(b.refNo)
}

function taskStatusClass(status) {
  return { 대기: 'status-chip--amber', 진행중: 'status-chip--blue', 완료: 'status-chip--green' }[status]
}

function alertLevelClass(level) {
  return { 안내: 'alert-badge--blue', 확인: 'alert-badge--purple', 주의: 'alert-badge--red' }[level]
}

function stepKey(task) {
  return task?.activeStep || ''
}

function inspectProgress(task) {
  return task.bins.filter((bin) => bin.statusInspect === '완료').length
}

function putProgress(task) {
  return task.bins.filter((bin) => bin.statusPut === '완료').length
}

function pickProgress(task) {
  return task.bins.filter((bin) => bin.pickStatus === '완료').length
}

function packProgress(task) {
  return task.bins.filter((bin) => bin.packStatus === '완료').length
}

function highlightTask(taskId) {
  highlightedTaskId.value = taskId
}

function resetSamples() {
  resetWorkerState()
  overviewFilter.value = '전체'
  syncDashboardState()
}

function openFirstWaitingTask() {
  const target = filteredOverviewTasks.value.find((task) => task.status === '대기') ?? filteredOverviewTasks.value[0]
  if (!target) return
  openTask(target)
}

function openTask(task) {
  if (!task) return
  highlightedTaskId.value = task.id
  if (task.type === '검수&적재') {
    router.push({ name: ROUTE_NAMES.WH_WORKER_INBOUND, query: { taskId: task.id } })
    return
  }
  router.push({ name: ROUTE_NAMES.WH_WORKER_OUTBOUND, query: { taskId: task.id } })
}

function goToTasks(target = null) {
  const query = {}
  if (target?.taskId) {
    query.taskId = target.taskId
    query.alertId = target.id
  } else if (target?.id) {
    query.taskId = target.id
  }
  router.push({ name: ROUTE_NAMES.WH_WORKER_TASKS, query })
}

function goToInventory() {
  router.push({ name: ROUTE_NAMES.WH_WORKER_INVENTORY })
}

let removeListeners = () => {}

onMounted(() => {
  syncDashboardState()
  removeListeners = addWorkerStateListeners(syncDashboardState)
})

onBeforeUnmount(() => {
  removeListeners()
})
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="통합 대시보드">
    <template #header-action>
      <button class="ui-btn ui-btn--ghost" @click="resetSamples">샘플 초기화</button>
      <button class="ui-btn ui-btn--primary" @click="openFirstWaitingTask">첫 대기 작업 열기</button>
    </template>

    <section class="dashboard-page">
      <div class="summary-grid">
        <article v-for="card in summaryCards" :key="card.key" :class="`summary-card--${card.tone}`" class="summary-card">
          <p class="summary-card__label">{{ card.label }}</p>
          <strong class="summary-card__value">{{ card.value }}</strong>
          <span class="summary-card__desc">{{ card.description }}</span>
        </article>
      </div>

      <div class="dashboard-main-grid">
        <article class="dashboard-card dashboard-card--wide">
          <div class="section-head">
            <div>
              <h2 class="section-title">오늘 내 작업 목록</h2>
              <p class="section-subtitle">
                로그인 시 오늘 배정된 작업을 우선 표시하며, 대기 작업이 가장 먼저 보이도록 정렬했습니다.
              </p>
            </div>
            <div class="filter-chip-group">
              <button
                v-for="filter in OVERVIEW_FILTERS"
                :key="filter"
                :class="['filter-chip', { 'filter-chip--active': overviewFilter === filter }]"
                @click="overviewFilter = filter"
              >
                {{ filter }}
              </button>
            </div>
          </div>

          <div class="task-table-wrap">
            <table class="task-table">
              <thead>
              <tr>
                <th>작업 유형</th>
                <th>셀러 회사명</th>
                <th>ASN / 피킹리스트</th>
                <th>담당 Bin</th>
                <th>총 수량</th>
                <th>상태</th>
              </tr>
              </thead>
              <tbody>
              <tr
                v-for="task in filteredOverviewTasks.slice(0, 5)"
                :key="task.id"
                :class="{ 'task-row--active': highlightedTask?.id === task.id }"
                class="task-row"
                @click="highlightTask(task.id)"
              >
                <td>{{ task.type }}</td>
                <td>{{ task.sellerCompany }}</td>
                <td>{{ task.refNo }}</td>
                <td>{{ task.assignedBinCount }} Bin</td>
                <td>{{ task.totalQty }}</td>
                <td>
                  <span :class="taskStatusClass(task.status)" class="status-chip">{{ task.status }}</span>
                </td>
              </tr>
              <tr v-if="!filteredOverviewTasks.length">
                <td class="empty-row" colspan="6">선택한 상태의 작업이 없습니다.</td>
              </tr>
              </tbody>
            </table>
          </div>

          <div class="table-footer-actions">
            <button class="ui-btn ui-btn--primary" @click="goToTasks()">내 작업 전체 보기</button>
          </div>
        </article>

        <div class="dashboard-status-grid">
          <article class="dashboard-card dashboard-status-card">
            <div class="section-head section-head--stack-mobile">
              <div>
                <h2 class="section-title">입고 작업 진행 현황</h2>
                <p class="section-subtitle">검수 완료와 적재 완료를 분리해 보여주고, 적재 완료 Bin만 재고에 반영합니다.</p>
              </div>
              <button class="ui-btn ui-btn--primary" @click="router.push({ name: ROUTE_NAMES.WH_WORKER_INBOUND })">
                입고 관리로 이동
              </button>
            </div>

            <div class="list-stack">
              <button
                v-for="task in inboundTasks"
                :key="task.id"
                class="progress-card"
                type="button"
                @click="highlightTask(task.id)"
              >
                <div class="progress-card__top">
                  <div>
                    <h3>{{ task.refNo }}</h3>
                    <p>{{ task.sellerCompany }} · 현재 단계 {{ task.activeStep }}</p>
                  </div>
                  <span :class="taskStatusClass(task.status)" class="status-chip">{{ task.status }}</span>
                </div>
                <dl class="meta-grid">
                  <div>
                    <dt>검수 진행</dt>
                    <dd>{{ inspectProgress(task) }} / {{ task.bins.length }} Bin</dd>
                  </div>
                  <div>
                    <dt>적재 진행</dt>
                    <dd>{{ putProgress(task) }} / {{ task.bins.length }} Bin</dd>
                  </div>
                  <div>
                    <dt>ASN 상태</dt>
                    <dd>{{ task.referenceStatus }}</dd>
                  </div>
                </dl>
              </button>
            </div>
          </article>

          <article class="dashboard-card dashboard-status-card">
            <div class="section-head section-head--stack-mobile">
              <div>
                <h2 class="section-title">출고 작업 진행 현황</h2>
                <p class="section-subtitle">피킹 완료 후 패킹 검수로 이동하며, 최종 완료 시 출고 대기 구역으로 넘깁니다.</p>
              </div>
              <button class="ui-btn ui-btn--primary" @click="router.push({ name: ROUTE_NAMES.WH_WORKER_OUTBOUND })">
                출고 관리로 이동
              </button>
            </div>

            <div class="list-stack">
              <button
                v-for="task in outboundTasks"
                :key="task.id"
                class="progress-card"
                type="button"
                @click="highlightTask(task.id)"
              >
                <div class="progress-card__top">
                  <div>
                    <h3>{{ task.refNo }}</h3>
                    <p>{{ task.sellerCompany }} · 현재 단계 {{ task.activeStep }}</p>
                  </div>
                  <span :class="taskStatusClass(task.status)" class="status-chip">{{ task.status }}</span>
                </div>
                <dl class="meta-grid">
                  <div>
                    <dt>피킹 진행</dt>
                    <dd>{{ pickProgress(task) }} / {{ task.bins.length }} 주문</dd>
                  </div>
                  <div>
                    <dt>패킹 검수</dt>
                    <dd>{{ packProgress(task) }} / {{ task.bins.length }} 주문</dd>
                  </div>
                  <div>
                    <dt>주문 상태</dt>
                    <dd>{{ task.referenceStatus }}</dd>
                  </div>
                </dl>
              </button>
            </div>
          </article>

          <article class="dashboard-card dashboard-alert-wide">
            <div class="section-head section-head--stack-mobile">
              <div>
                <h2 class="section-title">최근 예외 알림</h2>
                <p class="section-subtitle">수량 불일치, 패킹 검수 대기, 신규 배정 등 확인이 필요한 항목만 모았습니다.</p>
              </div>
              <button class="ui-btn ui-btn--primary" @click="goToTasks()">내 작업에서 자세히 보기</button>
            </div>

            <div class="alert-list">
              <button
                v-for="alert in alerts.slice(0, 4)"
                :key="alert.id"
                class="alert-item"
                type="button"
                @click="goToTasks(alert)"
              >
                <div class="alert-item__top">
                  <span :class="alertLevelClass(alert.level)" class="alert-badge">{{ alert.level }}</span>
                  <span class="alert-time">{{ alert.time }}</span>
                </div>
                <strong class="alert-title">{{ alert.title }}</strong>
                <p class="alert-desc">{{ alert.description }}</p>
              </button>
            </div>
          </article>
        </div>
      </div>

      <article v-if="highlightedTask" class="dashboard-card detail-card">
        <div class="section-head section-head--stack-mobile">
          <div>
            <h2 class="section-title">선택 작업 요약</h2>
            <p class="section-subtitle">대시보드에서 바로 현재 상태와 다음 이동 화면을 확인할 수 있습니다.</p>
          </div>
          <button class="ui-btn ui-btn--primary" @click="openTask(highlightedTask)">
            {{ highlightedTask.type === '검수&적재' ? '입고 관리에서 열기' : '출고 관리에서 열기' }}
          </button>
        </div>

        <div class="detail-grid">
          <div class="detail-main">
            <div class="detail-headline">
              <div>
                <p class="detail-kicker">{{ highlightedTask.type }}</p>
                <h3>{{ highlightedTask.id }}</h3>
                <p class="detail-note">{{ highlightedTask.notes }}</p>
              </div>
              <span :class="taskStatusClass(highlightedTask.status)" class="status-chip">{{ highlightedTask.status }}</span>
            </div>

            <TimelineStepper
              :current-step="stepKey(highlightedTask)"
              :steps="highlightedTask.flow.map((step) => ({ key: step, label: step }))"
            />
          </div>

          <div class="detail-side">
            <div class="detail-mini-card">
              <span>기본 정보</span>
              <strong>{{ highlightedTask.sellerCompany }}</strong>
              <p>{{ highlightedTask.refNo }} · {{ highlightedTask.totalQty }}개</p>
            </div>
            <div class="detail-mini-card">
              <span>배정 정보</span>
              <strong>{{ highlightedTask.assignedBinCount }} Bin</strong>
              <p>작업자에게 배정된 Bin 범위 기준</p>
            </div>
            <div class="detail-mini-card detail-mini-card--accent">
              <span>재고/주문 상태</span>
              <strong>{{ highlightedTask.referenceStatus }}</strong>
              <p>
                {{ highlightedTask.completedAt ? `완료 시각 ${highlightedTask.completedAt}` : '전용 화면에서 입력 및 완료 처리' }}
              </p>
            </div>
          </div>
        </div>

        <div class="bottom-actions">
          <button class="ui-btn ui-btn--ghost" @click="goToInventory">재고 화면 보기</button>
          <button class="ui-btn ui-btn--ghost" @click="goToTasks()">내 작업 이동</button>
        </div>
      </article>
    </section>
  </AppLayout>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.summary-card,
.dashboard-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.summary-card {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 132px;
}

.summary-card__label {
  font-size: var(--font-size-sm);
  color: var(--t3);
  font-weight: 600;
}

.summary-card__value {
  font-family: var(--font-condensed);
  font-size: clamp(24px, 1.77vw, 34px);
  line-height: 1;
  color: var(--t1);
}

.summary-card__desc {
  font-size: var(--font-size-sm);
  color: var(--t3);
}

.summary-card--blue { border-top: 4px solid var(--blue); }
.summary-card--amber { border-top: 4px solid var(--amber); }
.summary-card--purple { border-top: 4px solid var(--purple); }
.summary-card--green { border-top: 4px solid var(--green); }
.summary-card--gold { border-top: 4px solid var(--gold); }

.dashboard-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-4);
  align-items: start;
}

.dashboard-card {
  padding: var(--space-5);
}

.dashboard-card--wide {
  grid-column: 1 / span 3;
}

.dashboard-status-grid {
  grid-column: 1 / span 3;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-4);
  align-items: start;
}

.dashboard-alert-wide {
  grid-column: 1 / span 2;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.section-title {
  font-size: var(--font-size-xl);
  font-family: var(--font-condensed);
  letter-spacing: 0.2px;
}

.section-subtitle {
  margin-top: 6px;
  color: var(--t3);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.filter-chip-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.filter-chip {
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--t2);
  border-radius: var(--radius-full);
  height: 34px;
  padding: 0 14px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  transition: all var(--ease-fast);
}

.filter-chip:hover {
  border-color: var(--blue);
  color: var(--blue);
}

.filter-chip--active {
  background: var(--blue);
  color: #fff;
  border-color: var(--blue);
}

.task-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.task-table {
  width: 100%;
  border-collapse: collapse;
}

.task-table thead tr {
  background: var(--surface-2);
}

.task-table th,
.task-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.task-table th {
  font-size: var(--font-size-xs);
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.task-table td {
  font-size: var(--font-size-sm);
  color: var(--t2);
}

.task-table tbody tr:last-child td {
  border-bottom: none;
}

.task-row {
  cursor: pointer;
  transition: background var(--ease-fast);
}

.task-row:hover {
  background: var(--blue-pale);
}

.task-row--active {
  background: linear-gradient(90deg, rgba(76, 116, 255, 0.14), rgba(76, 116, 255, 0.03));
}

.empty-row {
  text-align: center !important;
  color: var(--t3);
  padding: 42px 16px !important;
}

.table-footer-actions,
.bottom-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.text-link-btn {
  border: none;
  background: transparent;
  color: var(--blue);
  font-size: var(--font-size-sm);
  font-weight: 600;
  padding: 0;
}

.text-link-btn:hover {
  text-decoration: underline;
}

.list-stack,
.alert-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.progress-card,
.alert-item {
  width: 100%;
  border: 1px solid var(--border);
  background: var(--surface-2);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  text-align: left;
  transition: all var(--ease-fast);
}

.progress-card:hover,
.alert-item:hover {
  border-color: var(--blue);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.progress-card__top,
.alert-item__top,
.detail-headline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.progress-card h3,
.detail-headline h3 {
  font-size: var(--font-size-lg);
}

.progress-card p,
.detail-note,
.alert-desc {
  margin-top: 6px;
  color: var(--t3);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.meta-grid dt {
  color: var(--t3);
  font-size: var(--font-size-xs);
  margin-bottom: 4px;
}

.meta-grid dd {
  color: var(--t1);
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.status-chip,
.alert-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  height: 28px;
  padding: 0 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.status-chip--amber {
  background: var(--amber-pale);
  color: #b45309;
}

.status-chip--blue {
  background: var(--blue-pale);
  color: var(--blue);
}

.status-chip--green {
  background: var(--green-pale);
  color: var(--green);
}

.alert-badge--blue {
  background: var(--blue-pale);
  color: var(--blue);
}

.alert-badge--purple {
  background: var(--purple-pale);
  color: var(--purple);
}

.alert-badge--red {
  background: var(--red-pale);
  color: var(--red);
}

.alert-title {
  display: block;
  margin-top: 10px;
  color: var(--t1);
}

.alert-time {
  font-size: var(--font-size-xs);
  color: var(--t3);
}

.detail-card {
  padding: var(--space-5);
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.9fr);
  gap: var(--space-4);
  align-items: start;
}

.detail-main,
.detail-side {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.detail-kicker {
  color: var(--blue);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.detail-mini-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface-2);
  padding: var(--space-4);
}

.detail-mini-card span {
  color: var(--t3);
  font-size: var(--font-size-xs);
}

.detail-mini-card strong {
  display: block;
  margin-top: 8px;
  color: var(--t1);
  font-size: var(--font-size-lg);
}

.detail-mini-card p {
  margin-top: 6px;
  color: var(--t3);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.detail-mini-card--accent {
  background: linear-gradient(180deg, rgba(76, 116, 255, 0.08), rgba(76, 116, 255, 0.02));
  border-color: rgba(76, 116, 255, 0.18);
}

@media (max-width: 1400px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-main-grid {
    grid-template-columns: 1fr 1fr;
  }

  .dashboard-card--wide {
    grid-column: 1 / span 2;
  }

  .dashboard-status-grid {
    grid-column: 1 / span 2;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .summary-grid,
  .dashboard-main-grid,
  .dashboard-status-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-card--wide,
  .dashboard-alert-wide,
  .dashboard-status-grid {
    grid-column: auto;
  }

  .meta-grid {
    grid-template-columns: 1fr;
  }

  .section-head--stack-mobile,
  .section-head {
    flex-direction: column;
  }

  .progress-card__top,
  .alert-item__top,
  .detail-headline {
    flex-direction: column;
  }

  .table-footer-actions,
  .bottom-actions {
    justify-content: stretch;
    flex-direction: column;
  }
}
</style>