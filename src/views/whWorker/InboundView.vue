<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  addWorkerStateListeners,
  loadWorkerState,
  nowStamp,
  resetWorkerState,
  updateWorkerState,
} from '@/utils/whWorkerState'

const breadcrumb = [{ label: 'WH Worker' }, { label: '입고 관리' }]
const route = useRoute()
const STORAGE_KEY = 'wh-worker-shared-state-v2'

const tasks = ref([])
const selectedTaskId = ref(String(route.query.taskId || ''))
const inboundSubTab = ref('inspect')

function cloneSeed(seed) {
  return JSON.parse(JSON.stringify(seed))
}

function resolveTaskTab(task) {
  if (!task) return 'inspect'
  if (task.status === '완료' || task.activeStep === '적재 완료') return 'done'
  return task.activeStep === '적재' ? 'put' : 'inspect'
}

function syncInboundState() {
  const state = loadWorkerState()
  tasks.value = cloneSeed(state.inboundTasks)
  applySelectionFromRoute()
  ensureVisibleSelection()
}

const selectedTask = computed(() => tasks.value.find((task) => task.id === selectedTaskId.value) ?? null)

function applySelectionFromRoute() {
  const taskId = String(route.query.taskId || '')
  if (!taskId) return
  const matched = tasks.value.find((task) => task.id === taskId)
  if (!matched) return
  selectedTaskId.value = matched.id
  inboundSubTab.value = resolveTaskTab(matched)
}

const filteredTaskCards = computed(() => {
  const list = [...tasks.value].filter((task) => {
    if (inboundSubTab.value === 'inspect') return task.activeStep === '검수' && task.status !== '완료'
    if (inboundSubTab.value === 'put') return task.activeStep === '적재' && task.status !== '완료'
    if (inboundSubTab.value === 'done') return task.status === '완료'
    return true
  })
  return list.sort(sortTasks)
})

const totalAssignedCount = computed(() => tasks.value.length)
const waitingTaskCount = computed(() => tasks.value.filter((task) => task.status === '대기').length)
const progressTaskCount = computed(() => tasks.value.filter((task) => task.status === '진행중').length)
const doneTaskCount = computed(() => tasks.value.filter((task) => task.status === '완료').length)

const summaryCards = computed(() => [
  {
    key: 'all',
    label: '전체 작업',
    value: `${totalAssignedCount.value}건`,
    description: '오늘 작업자에게 배정된 전체 입고 작업 수',
    tone: 'blue',
  },
  {
    key: 'wait',
    label: '대기 작업',
    value: `${waitingTaskCount.value}건`,
    description: '바로 시작 가능한 입고 작업',
    tone: 'amber',
  },
  {
    key: 'progress',
    label: '진행중 작업',
    value: `${progressTaskCount.value}건`,
    description: '현재 검수 또는 적재 중인 작업',
    tone: 'purple',
  },
  {
    key: 'done',
    label: '완료 작업',
    value: `${doneTaskCount.value}건`,
    description: '오늘 완료 처리된 입고 작업',
    tone: 'green',
  },
])

const detailSummaryCards = computed(() => {
  const task = selectedTask.value
  if (!task) return []

  return [
    {
      label: '검수 진행',
      value: `${inspectDone(task)} / ${task.bins.length} Bin`,
      description: '수량 입력과 검수 완료 처리 기준',
    },
    {
      label: '적재 진행',
      value: `${putDone(task)} / ${task.bins.length} Bin`,
      description: '확정 Bin 코드와 적재 수량 기준',
    },
    {
      label: '재고 반영',
      value: task.stockActivation ? '반영 완료' : '적재 대기',
      description: task.stockActivation ? task.completedAt || '완료 시각 기록됨' : '적재 완료 Bin만 반영',
    },
  ]
})

const inboundDetailStepIndex = computed(() => {
  if (!selectedTask.value) return 1
  return { 검수: 1, 적재: 2, '적재 완료': 3 }[selectedTask.value.activeStep] ?? 1
})

function inboundStepNodeClass(index) {
  if (inboundDetailStepIndex.value > index) return 'flow-step__node--done'
  if (inboundDetailStepIndex.value === index) return 'flow-step__node--active'
  return ''
}

function inboundStepLabelClass(index) {
  if (inboundDetailStepIndex.value > index) return 'flow-step__label--done'
  if (inboundDetailStepIndex.value === index) return 'flow-step__label--active'
  return ''
}

function inboundLineClass(index) {
  return inboundDetailStepIndex.value > index ? 'flow-line--done' : ''
}

function ensureVisibleSelection() {
  if (!tasks.value.length) {
    selectedTaskId.value = ''
    return
  }

  if (!filteredTaskCards.value.length) {
    const fallbackTask = tasks.value[0]
    selectedTaskId.value = fallbackTask?.id ?? ''
    if (fallbackTask) inboundSubTab.value = resolveTaskTab(fallbackTask)
    return
  }

  if (!filteredTaskCards.value.some((card) => card.id === selectedTaskId.value)) {
    selectedTaskId.value = filteredTaskCards.value[0].id
  }
}

watch(
  () => route.query.taskId,
  () => {
    applySelectionFromRoute()
    ensureVisibleSelection()
  },
  { immediate: true }
)

watch([filteredTaskCards, inboundSubTab], () => {
  ensureVisibleSelection()
})

function persistTasks() {
  updateWorkerState({ inboundTasks: cloneSeed(tasks.value) })
}

function sortTasks(a, b) {
  const statusRank = { 대기: 0, 진행중: 1, 완료: 2 }
  return (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9) || a.id.localeCompare(b.id)
}

function inspectDone(task) {
  return task.bins.filter((bin) => bin.statusInspect === '완료').length
}

function putDone(task) {
  return task.bins.filter((bin) => bin.statusPut === '완료').length
}

function statusClass(status) {
  return {
    대기: 'status-chip--amber',
    진행중: 'status-chip--blue',
    완료: 'status-chip--green',
  }[status]
}

function stepClass(task, step) {
  if (task.activeStep === '적재 완료' && step === '적재') return 'step-chip--done'
  if (step === task.activeStep) return 'step-chip--active'
  if (task.activeStep === '적재' && step === '검수') return 'step-chip--done'
  return ''
}

function inspectMismatch(bin) {
  return String(bin.inspectedQty).trim() !== '' && Number(bin.inspectedQty) !== Number(bin.plannedQty)
}

function putMismatch(bin) {
  return String(bin.putQty).trim() !== '' && Number(bin.putQty) !== Number(bin.inspectedQty || bin.plannedQty)
}

function putCodeMismatch(bin) {
  return String(bin.confirmBinCode).trim() !== '' && String(bin.confirmBinCode).trim() !== String(bin.designatedBinCode).trim()
}

function resetSamples() {
  resetWorkerState()
  inboundSubTab.value = 'inspect'
  syncInboundState()
}

function openInspect() {
  inboundSubTab.value = 'inspect'
}

function openPut() {
  inboundSubTab.value = 'put'
}

function openDone() {
  inboundSubTab.value = 'done'
}

function selectTask(taskId) {
  selectedTaskId.value = taskId
}

function recomputeTask(task) {
  const isInspectDone = task.bins.every((bin) => bin.statusInspect === '완료')
  const isPutDone = task.bins.every((bin) => bin.statusPut === '완료')
  const hasProgress = task.bins.some(
    (bin) =>
      bin.statusInspect === '완료' ||
      bin.statusPut === '완료' ||
      String(bin.inspectedQty).trim() !== '' ||
      String(bin.putQty).trim() !== '' ||
      String(bin.confirmBinCode).trim() !== ''
  )

  if (isPutDone) {
    task.status = '완료'
    task.activeStep = '작업 완료'
    task.asnStatus = '보관중'
    task.stockActivation = true
    if (!task.completedAt) task.completedAt = nowStamp()
    return
  }

  if (isInspectDone) {
    task.status = '진행중'
    task.activeStep = '적재'
    task.asnStatus = '검수완료'
    task.stockActivation = false
    task.completedAt = ''
    return
  }

  if (hasProgress) {
    task.status = '진행중'
    task.activeStep = '검수'
    task.asnStatus = '검수중'
    task.stockActivation = false
    task.completedAt = ''
    return
  }

  task.status = '대기'
  task.activeStep = '검수'
  task.asnStatus = '입고예정'
  task.stockActivation = false
  task.completedAt = ''
  persistTasks()
}

function isWholeNumberInput(value) {
  return /^\d+$/.test(String(value).trim())
}

function saveInspect(bin) {
  const task = selectedTask.value
  if (!task) return

  const inspectedQty = String(bin.inspectedQty).trim()
  if (!isWholeNumberInput(inspectedQty)) return

  bin.inspectedQty = inspectedQty
  bin.statusInspect = '완료'
  if (Number(inspectedQty) !== Number(bin.plannedQty) && !String(bin.inspectNote).trim()) {
    bin.inspectNote = `[불일치] ${bin.id} / ${bin.sku} 수량 차이 확인 필요`
  }

  recomputeTask(task)
  persistTasks()
}

function savePut(bin) {
  const task = selectedTask.value
  if (!task) return

  const putQty = String(bin.putQty).trim()
  const confirmBinCode = String(bin.confirmBinCode).trim()
  if (!isWholeNumberInput(putQty) || !confirmBinCode) return

  bin.putQty = putQty
  bin.confirmBinCode = confirmBinCode
  bin.statusPut = '완료'
  recomputeTask(task)
  if (task.status === '완료') inboundSubTab.value = 'done'
  persistTasks()
}

function completeInspectAll() {
  const task = selectedTask.value
  if (!task) return

  task.bins.forEach((bin) => {
    if (!String(bin.inspectedQty).trim()) {
      bin.inspectedQty = String(bin.plannedQty)
    }
    bin.statusInspect = '완료'
  })

  recomputeTask(task)
  inboundSubTab.value = 'put'
  persistTasks()
}

function completePutAll() {
  const task = selectedTask.value
  if (!task) return

  task.bins.forEach((bin) => {
    if (!String(bin.confirmBinCode).trim()) {
      bin.confirmBinCode = bin.designatedBinCode
    }
    if (!String(bin.putQty).trim()) {
      bin.putQty = String(bin.inspectedQty || bin.plannedQty)
    }
    if (bin.statusInspect !== '완료') {
      bin.statusInspect = '완료'
      if (!String(bin.inspectedQty).trim()) bin.inspectedQty = String(bin.plannedQty)
    }
    bin.statusPut = '완료'
  })

  recomputeTask(task)
  inboundSubTab.value = 'done'
  persistTasks()
}

let removeListeners = () => {}

onMounted(() => {
  syncInboundState()
  removeListeners = addWorkerStateListeners(syncInboundState)
})

onBeforeUnmount(() => {
  removeListeners()
})
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="입고 관리">
    <template #header-action>
      <button class="ui-btn ui-btn--ghost" @click="resetSamples">샘플 초기화</button>
      <button :class="['ui-btn', inboundSubTab === 'inspect' ? 'ui-btn--primary' : 'ui-btn--ghost']" @click="openInspect">
        검수 보기
      </button>
      <button :class="['ui-btn', inboundSubTab === 'put' ? 'ui-btn--primary' : 'ui-btn--ghost']" @click="openPut">
        적재 보기
      </button>
    </template>

    <section class="inbound-page">
      <!-- 상단 요약 카드 영역 -->
      <div class="summary-grid">
        <article v-for="card in summaryCards" :key="card.key" :class="`summary-card--${card.tone}`" class="summary-card">
          <p class="summary-card__label">{{ card.label }}</p>
          <strong class="summary-card__value">{{ card.value }}</strong>
          <span class="summary-card__desc">{{ card.description }}</span>
        </article>
      </div>

      <div class="content-grid">
        <article class="panel panel--task-list">
          <div class="panel-head panel-head--tabs">
            <div>
              <h2 class="panel-title">입고 작업 목록</h2>
            </div>

            <div class="stage-tabs" role="tablist" aria-label="입고 작업 단계">
              <button :class="['stage-tab', { 'stage-tab--active': inboundSubTab === 'inspect' }]" type="button" @click="openInspect">검수</button>
              <button :class="['stage-tab', { 'stage-tab--active': inboundSubTab === 'put' }]" type="button" @click="openPut">적재</button>
              <button :class="['stage-tab', { 'stage-tab--active': inboundSubTab === 'done' }]" type="button" @click="openDone">완료</button>
            </div>
          </div>

          <div class="task-list">
            <button
              v-for="task in filteredTaskCards"
              :key="task.id"
              :class="['task-card', { 'task-card--active': selectedTask?.id === task.id }]"
              type="button"
              @click="selectTask(task.id)"
            >
              <div class="task-card__top">
                <div>
                  <h3>{{ task.id }}</h3>
                  <p>{{ task.refNo }} · {{ task.sellerCompany }}</p>
                </div>
                <span :class="['status-chip', statusClass(task.status)]">{{ task.status }}</span>
              </div>

              <dl class="task-meta-grid">
                <div>
                  <dt>담당 Bin</dt>
                  <dd>{{ task.assignedBinCount }} Bin</dd>
                </div>
                <div>
                  <dt>총 수량</dt>
                  <dd>{{ task.totalQty }}</dd>
                </div>
                <div>
                  <dt>현재 단계</dt>
                  <dd>{{ task.activeStep }}</dd>
                </div>
              </dl>
            </button>

            <div v-if="!filteredTaskCards.length" class="empty-state">
              선택한 단계에 해당하는 입고 작업이 없습니다.
            </div>
          </div>
        </article>

        <article v-if="selectedTask" class="panel panel--detail">
          <div class="panel-head panel-head--detail">
            <div>
              <h2 class="panel-title">{{ selectedTask.refNo }}</h2>
              <p class="panel-subtitle">
                {{ selectedTask.sellerCompany }} · {{ selectedTask.notes }}
              </p>
            </div>
            <span :class="['status-chip', statusClass(selectedTask.status)]">{{ selectedTask.status }}</span>
          </div>

          <div class="detail-flow">
            <div class="flow-step">
              <div :class="['flow-step__node', inboundStepNodeClass(1)]">
                <span v-if="inboundDetailStepIndex > 1">✓</span>
                <span v-else>1</span>
              </div>
              <span :class="['flow-step__label', inboundStepLabelClass(1)]">검수</span>
            </div>

            <div :class="['flow-line', inboundLineClass(1)]"></div>

            <div class="flow-step">
              <div :class="['flow-step__node', inboundStepNodeClass(2)]">
                <span v-if="inboundDetailStepIndex > 2">✓</span>
                <span v-else>2</span>
              </div>
              <span :class="['flow-step__label', inboundStepLabelClass(2)]">적재</span>
            </div>

            <div :class="['flow-line', inboundLineClass(2)]"></div>

            <div class="flow-step">
              <div :class="['flow-step__node', inboundStepNodeClass(3)]">3</div>
              <span :class="['flow-step__label', inboundStepLabelClass(3)]">작업 완료</span>
            </div>
          </div>

          <div class="hint-box">
            <strong>작업 기준</strong>
            검수 완료 후 적재 단계로 넘어가며, 모든 Bin 적재 완료 시 ASN 상태가 보관중으로 전환됩니다.
          </div>

          <div class="detail-summary-grid">
            <article v-for="card in detailSummaryCards" :key="card.label" class="detail-summary-card">
              <p>{{ card.label }}</p>
              <strong>{{ card.value }}</strong>
              <span>{{ card.description }}</span>
            </article>
          </div>

          <section class="work-block">
            <div class="work-block__head">
              <div>
                <h3>{{ inboundSubTab === 'inspect' ? '검수 작업' : inboundSubTab === 'put' ? '적재 작업' : '완료 작업' }}</h3>
                <p>
                  {{
                    inboundSubTab === 'inspect'
                      ? '예정 수량과 실수량을 비교하고, 필요하면 비고를 남깁니다.'
                      : inboundSubTab === 'put'
                        ? '확정 Bin 코드와 적재 수량을 입력해 재고 반영 준비를 마칩니다.'
                        : '검수와 적재가 모두 끝난 Bin만 표시됩니다.'
                  }}
                </p>
              </div>
              <button
                v-if="inboundSubTab !== 'done'"
                class="ui-btn ui-btn--primary"
                @click="inboundSubTab === 'inspect' ? completeInspectAll() : completePutAll()"
              >
                {{ inboundSubTab === 'inspect' ? '검수 일괄 완료' : '적재 일괄 완료' }}
              </button>
            </div>

            <div class="table-wrap">
              <table class="work-table">
                <thead v-if="inboundSubTab === 'inspect'">
                <tr>
                  <th>Bin</th>
                  <th>위치</th>
                  <th>SKU</th>
                  <th>예정 수량</th>
                  <th>검수 수량</th>
                  <th>비고</th>
                  <th>상태</th>
                  <th>처리</th>
                </tr>
                </thead>
                <thead v-else-if="inboundSubTab === 'put'">
                <tr>
                  <th>Bin</th>
                  <th>지정 Bin</th>
                  <th>위치</th>
                  <th>SKU</th>
                  <th>검수 수량</th>
                  <th>확정 Bin</th>
                  <th>적재 수량</th>
                  <th>상태</th>
                  <th>처리</th>
                </tr>
                </thead>
                <thead v-else>
                <tr>
                  <th>Bin</th>
                  <th>위치</th>
                  <th>SKU</th>
                  <th>검수 수량</th>
                  <th>적재 Bin</th>
                  <th>적재 수량</th>
                  <th>검수 상태</th>
                  <th>적재 상태</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="bin in selectedTask.bins" :key="bin.id" :class="{ 'row-alert': inspectMismatch(bin) || putMismatch(bin) || putCodeMismatch(bin) }">
                  <template v-if="inboundSubTab === 'inspect'">
                    <td>{{ bin.id }}</td>
                    <td>{{ bin.location }}</td>
                    <td>{{ bin.sku }}</td>
                    <td>{{ bin.plannedQty }}</td>
                    <td>
                      <input v-model="bin.inspectedQty" class="field field--short" inputmode="numeric" />
                    </td>
                    <td>
                      <input v-model="bin.inspectNote" class="field" placeholder="비고 입력" />
                    </td>
                    <td>
                        <span :class="['status-chip', statusClass(bin.statusInspect === '완료' ? '완료' : bin.inspectedQty ? '진행중' : '대기')]">
                          {{ bin.statusInspect }}
                        </span>
                    </td>
                    <td>
                      <button class="text-btn" type="button" @click="saveInspect(bin)">검수 저장</button>
                    </td>
                  </template>
                  <template v-else-if="inboundSubTab === 'put'">
                    <td>{{ bin.id }}</td>
                    <td>{{ bin.designatedBinCode }}</td>
                    <td>{{ bin.location }}</td>
                    <td>{{ bin.sku }}</td>
                    <td>{{ bin.inspectedQty || '-' }}</td>
                    <td>
                      <input v-model="bin.confirmBinCode" class="field field--code" placeholder="Bin 코드" />
                    </td>
                    <td>
                      <input v-model="bin.putQty" class="field field--short" inputmode="numeric" />
                    </td>
                    <td>
                        <span :class="['status-chip', statusClass(bin.statusPut === '완료' ? '완료' : bin.putQty || bin.confirmBinCode ? '진행중' : '대기')]">
                          {{ bin.statusPut }}
                        </span>
                    </td>
                    <td>
                      <button class="text-btn" type="button" @click="savePut(bin)">적재 저장</button>
                    </td>
                  </template>
                  <template v-else>
                    <td>{{ bin.id }}</td>
                    <td>{{ bin.location }}</td>
                    <td>{{ bin.sku }}</td>
                    <td>{{ bin.inspectedQty || '-' }}</td>
                    <td>{{ bin.confirmBinCode || '-' }}</td>
                    <td>{{ bin.putQty || '-' }}</td>
                    <td><span :class="['status-chip', statusClass(bin.statusInspect)]">{{ bin.statusInspect }}</span></td>
                    <td><span :class="['status-chip', statusClass(bin.statusPut)]">{{ bin.statusPut }}</span></td>
                  </template>
                </tr>
                </tbody>
              </table>
            </div>
          </section>
        </article>
      </div>
    </section>
  </AppLayout>
</template>

<style scoped>
.inbound-page {
  display: grid;
  gap: var(--space-5);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}


.summary-card,
.panel,
.detail-summary-card,
.work-block {
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

/* 상단 요약 카드는 대시보드와 같은 시각 스타일 사용 */
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

.content-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.7fr) minmax(0, 1.3fr);
  gap: var(--space-5);
  align-items: start;
}

.panel {
  padding: 20px;
}

.panel--task-list {
  display: grid;
  gap: var(--space-4);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
}


.panel-head--tabs {
  align-items: center;
}

.stage-tabs {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.stage-tab {
  min-width: 64px;
  height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid #cfd7e6;
  background: #fff;
  color: var(--t1);
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.stage-tab--active {
  background: #4f71f2;
  border-color: #4f71f2;
  color: #fff;
  box-shadow: 0 8px 18px rgba(79, 113, 242, 0.22);
}

.empty-state {
  padding: 24px 18px;
  border: 1px dashed var(--border-dk);
  border-radius: var(--radius-lg);
  color: var(--t3);
  text-align: center;
  background: var(--surface-2);
}

.panel-title {
  font-family: var(--font-condensed);
  font-size: clamp(24px, 1.45vw, 30px);
  line-height: 1.05;
  color: var(--t1);
}

.panel-subtitle {
  margin-top: 8px;
  color: var(--t3);
  font-size: var(--font-size-sm);
  line-height: 1.65;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 6px;
  color: var(--gold);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.task-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  max-height: calc(100vh - 300px);
  overflow: auto;
  padding-right: 4px;
}

.task-card {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: var(--surface);
  padding: 18px;
  display: grid;
  gap: 14px;
  text-align: left;
  transition: transform var(--ease-fast), box-shadow var(--ease-fast), border-color var(--ease-fast);
}

.task-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.task-card--active {
  border-color: #f4d188;
  box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.12);
}

.task-card__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.task-card__top h3 {
  font-family: var(--font-condensed);
  font-size: clamp(20px, 1.15vw, 24px);
  line-height: 1;
  color: var(--t1);
}

.task-card__top p {
  margin-top: 4px;
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.task-meta-grid,
.detail-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.task-meta-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.task-meta-grid div,
.detail-summary-card {
  padding: 12px;
  background: var(--surface-2);
  border-radius: var(--radius-lg);
}

.task-meta-grid dt,
.detail-summary-card p {
  font-size: var(--font-size-xs);
  color: var(--t3);
  margin-bottom: 6px;
}

.task-meta-grid dd,
.detail-summary-card strong {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--t1);
}

.detail-summary-card {
  display: grid;
  gap: 4px;
}

.detail-summary-card span {
  font-size: var(--font-size-xs);
  color: var(--t3);
  line-height: 1.6;
}

.panel--detail {
  display: grid;
  gap: var(--space-4);
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 30px;
  padding: 0 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.status-chip--amber {
  color: #a16400;
  background: var(--amber-pale);
}

.status-chip--blue {
  color: var(--blue);
  background: var(--blue-pale);
}

.status-chip--green {
  color: #138553;
  background: var(--green-pale);
}

.detail-flow {
  display: grid;
  grid-template-columns: minmax(110px, 1fr) minmax(48px, 1fr) minmax(110px, 1fr) minmax(48px, 1fr) minmax(110px, 1fr);
  align-items: center;
  padding: 8px 12px 0;
}

.flow-step {
  display: grid;
  justify-items: center;
  gap: 10px;
}

.flow-step__node {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 2px solid #d9e0ee;
  background: #f8f9fc;
  color: #9ca7bb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.flow-step__node--done {
  border-color: #33c784;
  background: #33c784;
  color: #ffffff;
}

.flow-step__node--active {
  border-color: #4d70f0;
  background: #4d70f0;
  color: #ffffff;
}

.flow-step__label {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: #a3adbf;
  text-align: center;
}

.flow-step__label--done {
  color: #2ab36f;
}

.flow-step__label--active {
  color: #4d70f0;
}

.flow-line {
  height: 2px;
  background: #dde3ef;
  border-radius: 999px;
}

.flow-line--done {
  background: #33c784;
}

.hint-box {
  padding: 16px;
  border-radius: var(--radius-lg);
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--t2);
  line-height: 1.7;
}

.hint-box strong {
  margin-right: 8px;
  color: var(--t1);
}

.work-block {
  overflow: hidden;
}

.work-block__head {
  padding: 18px 18px 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
}

.work-block__head h3 {
  font-family: var(--font-condensed);
  font-size: clamp(22px, 1.2vw, 26px);
  line-height: 1;
}

.work-block__head p {
  margin-top: 6px;
  font-size: var(--font-size-sm);
  color: var(--t3);
  line-height: 1.6;
}

.table-wrap {
  overflow: auto;
  padding: 18px;
}

.work-table {
  width: 100%;
  min-width: 940px;
  border-collapse: collapse;
}

.work-table th,
.work-table td {
  padding: 12px 10px;
  border-bottom: 1px solid var(--border);
  text-align: center;
  vertical-align: middle;
}

.work-table th {
  background: var(--surface-2);
  color: var(--t2);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.work-table td {
  color: var(--t2);
  font-size: var(--font-size-sm);
}

.field {
  width: 100%;
  height: 38px;
  border: 1px solid var(--border-dk);
  border-radius: var(--radius-md);
  padding: 0 12px;
  background: var(--surface);
  color: var(--t1);
}

.field:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.12);
}

.field--short {
  width: 96px;
}

.field--code {
  width: 132px;
}

.text-btn {
  border: none;
  background: transparent;
  color: var(--blue);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.text-btn:hover {
  text-decoration: underline;
}

@media (max-width: 1440px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .task-meta-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1180px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .task-list {
    max-height: none;
  }
}

@media (max-width: 768px) {
  .summary-grid,
  .detail-summary-grid,
  .task-meta-grid {
    grid-template-columns: 1fr;
  }

  .panel,
  .summary-card,
  .task-card {
    padding: 16px;
  }

  .work-block__head,
  .panel-head,
  .task-card__top {
    flex-direction: column;
  }

  .stage-tabs {
    width: 100%;
  }

  .status-chip {
    width: fit-content;
  }

  .detail-flow {
    grid-template-columns: 1fr;
    justify-items: start;
    gap: 12px;
    padding: 0;
  }

  .flow-step {
    width: 100%;
    grid-template-columns: 36px 1fr;
    justify-items: start;
    align-items: center;
    gap: 12px;
  }

  .flow-line {
    display: none;
  }
}

.row-alert { background: rgba(239, 68, 68, 0.08); }
</style>