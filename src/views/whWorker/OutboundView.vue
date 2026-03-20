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

const breadcrumb = [{ label: 'WH Worker' }, { label: '출고 관리' }]
const route = useRoute()

const tasks = ref([])
const selectedTaskId = ref(String(route.query.taskId || ''))
const outboundSubTab = ref('pick')

function cloneSeed(seed) {
  return JSON.parse(JSON.stringify(seed))
}

function resolveTaskTab(task) {
  if (!task) return 'pick'
  if (task.status === '완료' || task.activeStep === '작업 완료') return 'done'
  return task.activeStep === '포장' ? 'pack' : 'pick'
}

function syncOutboundState() {
  const state = loadWorkerState()
  tasks.value = cloneSeed(state.outboundTasks)
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
  outboundSubTab.value = resolveTaskTab(matched)
}

watch(
  () => route.query.taskId,
  () => {
    applySelectionFromRoute()
    ensureVisibleSelection()
  },
  { immediate: true }
)

const filteredTaskCards = computed(() => {
  const list = [...tasks.value].filter((task) => {
    if (outboundSubTab.value === 'pick') return task.activeStep === '피킹' && task.status !== '완료'
    if (outboundSubTab.value === 'pack') return task.activeStep === '포장' && task.status !== '완료'
    if (outboundSubTab.value === 'done') return task.status === '완료'
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
    description: '오늘 배정된 전체 출고 작업 수',
    tone: 'blue',
  },
  {
    key: 'wait',
    label: '대기 작업',
    value: `${waitingTaskCount.value}건`,
    description: '바로 시작 가능한 피킹 작업',
    tone: 'amber',
  },
  {
    key: 'progress',
    label: '진행중 작업',
    value: `${progressTaskCount.value}건`,
    description: '현재 피킹 또는 포장 중인 작업',
    tone: 'purple',
  },
  {
    key: 'done',
    label: '완료 작업',
    value: `${doneTaskCount.value}건`,
    description: '오늘 출고 완료 처리된 작업',
    tone: 'green',
  },
])

const detailSummaryCards = computed(() => {
  const task = selectedTask.value
  if (!task) return []

  return [
    {
      label: '피킹 진행',
      value: `${pickDone(task)} / ${task.bins.length} Bin`,
      description: '피킹 수량 입력과 피킹 완료 처리 기준',
    },
    {
      label: '포장 진행',
      value: `${packDone(task)} / ${task.bins.length} Bin`,
      description: '포장 수량 입력과 포장 완료 처리 기준',
    },
    {
      label: '재고 차감',
      value: task.stockDeduction ? '차감 완료' : '포장 대기',
      description: task.stockDeduction ? task.completedAt || '완료 시각 기록됨' : '포장 완료 Bin만 차감',
    },
  ]
})

const outboundDetailStepIndex = computed(() => {
  if (!selectedTask.value) return 1
  return { 피킹: 1, 포장: 2, '작업 완료': 3 }[selectedTask.value.activeStep] ?? 1
})

function outboundStepNodeClass(index) {
  if (outboundDetailStepIndex.value > index) return 'flow-step__node--done'
  if (outboundDetailStepIndex.value === index) return 'flow-step__node--active'
  return ''
}

function outboundStepLabelClass(index) {
  if (outboundDetailStepIndex.value > index) return 'flow-step__label--done'
  if (outboundDetailStepIndex.value === index) return 'flow-step__label--active'
  return ''
}

function outboundLineClass(index) {
  return outboundDetailStepIndex.value > index ? 'flow-line--done' : ''
}

function ensureVisibleSelection() {
  if (!tasks.value.length) {
    selectedTaskId.value = ''
    return
  }

  if (!filteredTaskCards.value.length) {
    const fallbackTask = tasks.value[0]
    selectedTaskId.value = fallbackTask?.id ?? ''
    if (fallbackTask) outboundSubTab.value = resolveTaskTab(fallbackTask)
    return
  }

  if (!filteredTaskCards.value.some((card) => card.id === selectedTaskId.value)) {
    selectedTaskId.value = filteredTaskCards.value[0].id
  }
}

watch([filteredTaskCards, outboundSubTab], () => {
  ensureVisibleSelection()
})

function persistTasks() {
  updateWorkerState({ outboundTasks: cloneSeed(tasks.value) })
}

function sortTasks(a, b) {
  const statusRank = { 대기: 0, 진행중: 1, 완료: 2 }
  return (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9) || a.id.localeCompare(b.id)
}

function pickDone(task) { return task.bins.filter((bin) => bin.statusPick === '완료').length }
function packDone(task) { return task.bins.filter((bin) => bin.statusPack === '완료').length }

function statusClass(status) {
  return { 대기: 'status-chip--amber', 진행중: 'status-chip--blue', 완료: 'status-chip--green' }[status]
}

function pickMismatch(bin) {
  return String(bin.pickedQty).trim() !== '' && Number(bin.pickedQty) !== Number(bin.orderedQty)
}

function packMismatch(bin) {
  return String(bin.packedQty).trim() !== '' && Number(bin.packedQty) !== Number(bin.pickedQty || bin.orderedQty)
}

function resetSamples() {
  resetWorkerState()
  outboundSubTab.value = 'pick'
  syncOutboundState()
}

function openPick() { outboundSubTab.value = 'pick' }
function openPack() { outboundSubTab.value = 'pack' }
function openDone() { outboundSubTab.value = 'done' }
function selectTask(taskId) { selectedTaskId.value = taskId }

function recomputeTask(task) {
  const isPickDone = task.bins.every((bin) => bin.statusPick === '완료')
  const isPackDone = task.bins.every((bin) => bin.statusPack === '완료')
  const hasProgress = task.bins.some(
    (bin) =>
      bin.statusPick === '완료' ||
      bin.statusPack === '완료' ||
      String(bin.pickedQty).trim() !== '' ||
      String(bin.packedQty).trim() !== ''
  )

  if (isPackDone) {
    task.status = '완료'
    task.activeStep = '작업 완료'
    task.orderStatus = '출고완료'
    task.stockDeduction = true
    if (!task.completedAt) task.completedAt = nowStamp()
    return
  }
  if (isPickDone) {
    task.status = '진행중'
    task.activeStep = '포장'
    task.orderStatus = '피킹완료'
    task.stockDeduction = false
    task.completedAt = ''
    return
  }
  if (hasProgress) {
    task.status = '진행중'
    task.activeStep = '피킹'
    task.orderStatus = '피킹중'
    task.stockDeduction = false
    task.completedAt = ''
    return
  }
  task.status = '대기'
  task.activeStep = '피킹'
  task.orderStatus = '피킹대기'
  task.stockDeduction = false
  task.completedAt = ''
}

function isWholeNumberInput(value) {
  return /^\d+$/.test(String(value).trim())
}

function savePick(bin) {
  const task = selectedTask.value
  if (!task) return
  const pickedQty = String(bin.pickedQty).trim()
  if (!isWholeNumberInput(pickedQty)) return

  bin.pickedQty = pickedQty
  bin.statusPick = '완료'
  if (Number(pickedQty) !== Number(bin.orderedQty) && !String(bin.pickNote).trim()) {
    bin.pickNote = `[불일치] 수량 차이 확인 필요`
  }
  recomputeTask(task)
  persistTasks()
}

function savePack(bin) {
  const task = selectedTask.value
  if (!task) return
  const packedQty = String(bin.packedQty).trim()
  if (!isWholeNumberInput(packedQty)) return

  bin.packedQty = packedQty
  bin.statusPack = '완료'
  recomputeTask(task)
  if (task.status === '완료') outboundSubTab.value = 'done'
  persistTasks()
}

function completePickAll() {
  const task = selectedTask.value
  if (!task) return
  task.bins.forEach((bin) => {
    if (!String(bin.pickedQty).trim()) bin.pickedQty = String(bin.orderedQty)
    bin.statusPick = '완료'
  })
  recomputeTask(task)
  outboundSubTab.value = 'pack'
  persistTasks()
}

function completePackAll() {
  const task = selectedTask.value
  if (!task) return
  task.bins.forEach((bin) => {
    if (!String(bin.packedQty).trim()) bin.packedQty = String(bin.pickedQty || bin.orderedQty)
    if (bin.statusPick !== '완료') {
      bin.statusPick = '완료'
      if (!String(bin.pickedQty).trim()) bin.pickedQty = String(bin.orderedQty)
    }
    bin.statusPack = '완료'
  })
  recomputeTask(task)
  outboundSubTab.value = 'done'
  persistTasks()
}

let removeListeners = () => {}

onMounted(() => {
  syncOutboundState()
  removeListeners = addWorkerStateListeners(syncOutboundState)
})

onBeforeUnmount(() => {
  removeListeners()
})
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="출고 관리">
    <template #header-action>
      <button class="ui-btn ui-btn--ghost" @click="resetSamples">샘플 초기화</button>
      <button :class="['ui-btn', outboundSubTab === 'pick' ? 'ui-btn--primary' : 'ui-btn--ghost']" @click="openPick">
        피킹 보기
      </button>
      <button :class="['ui-btn', outboundSubTab === 'pack' ? 'ui-btn--primary' : 'ui-btn--ghost']" @click="openPack">
        포장 보기
      </button>
    </template>

    <section class="inbound-page">
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
            <div><h2 class="panel-title">출고 작업 목록</h2></div>
            <div class="stage-tabs" role="tablist">
              <button :class="['stage-tab', { 'stage-tab--active': outboundSubTab === 'pick' }]" @click="openPick">피킹</button>
              <button :class="['stage-tab', { 'stage-tab--active': outboundSubTab === 'pack' }]" @click="openPack">포장</button>
              <button :class="['stage-tab', { 'stage-tab--active': outboundSubTab === 'done' }]" @click="openDone">완료</button>
            </div>
          </div>

          <div class="task-list">
            <button
              v-for="task in filteredTaskCards"
              :key="task.id"
              :class="['task-card', { 'task-card--active': selectedTask?.id === task.id }]"
              @click="selectTask(task.id)"
            >
              <div class="task-card__top">
                <div>
                  <h3>{{ task.refNo }}</h3>
                  <p>{{ task.id }} · {{ task.sellerCompany }}</p>
                </div>
                <span :class="['status-chip', statusClass(task.status)]">{{ task.status }}</span>
              </div>
              <dl class="task-meta-grid">
                <div><dt>총 피킹 라인</dt><dd>{{ task.assignedBinCount }} 개</dd></div>
                <div><dt>총 수량</dt><dd>{{ task.totalQty }}</dd></div>
                <div><dt>현재 단계</dt><dd>{{ task.activeStep }}</dd></div>
              </dl>
            </button>
            <div v-if="!filteredTaskCards.length" class="empty-state">해당 단계의 출고 작업이 없습니다.</div>
          </div>
        </article>

        <article v-if="selectedTask" class="panel panel--detail">
          <div class="panel-head panel-head--detail">
            <div>
              <h2 class="panel-title">{{ selectedTask.refNo }}</h2>
              <p class="panel-subtitle">{{ selectedTask.sellerCompany }} · {{ selectedTask.notes }}</p>
            </div>
            <span :class="['status-chip', statusClass(selectedTask.status)]">{{ selectedTask.status }}</span>
          </div>

          <div class="detail-flow">
            <div class="flow-step">
              <div :class="['flow-step__node', outboundStepNodeClass(1)]"><span v-if="outboundDetailStepIndex > 1">✓</span><span v-else>1</span></div>
              <span :class="['flow-step__label', outboundStepLabelClass(1)]">피킹</span>
            </div>
            <div :class="['flow-line', outboundLineClass(1)]"></div>
            <div class="flow-step">
              <div :class="['flow-step__node', outboundStepNodeClass(2)]"><span v-if="outboundDetailStepIndex > 2">✓</span><span v-else>2</span></div>
              <span :class="['flow-step__label', outboundStepLabelClass(2)]">포장 검수</span>
            </div>
            <div :class="['flow-line', outboundLineClass(2)]"></div>
            <div class="flow-step">
              <div :class="['flow-step__node', outboundStepNodeClass(3)]">3</div>
              <span :class="['flow-step__label', outboundStepLabelClass(3)]">작업 완료</span>
            </div>
          </div>

          <div class="hint-box">
            <strong>작업 기준</strong>
            Bin 위치를 확인하고 피킹합니다. 피킹 완료 후 포장 단계로 넘어가며, 모든 포장 완료 시 재고가 차감됩니다.
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
                <h3>{{ outboundSubTab === 'pick' ? '피킹 작업' : outboundSubTab === 'pack' ? '포장 검수 작업' : '완료 내역' }}</h3>
                <p>
                  {{
                    outboundSubTab === 'pick'
                      ? '지시 수량과 실제 피킹 수량을 비교하고, 필요하면 비고를 남깁니다.'
                      : outboundSubTab === 'pack'
                        ? '피킹된 상품을 확인하고 포장 수량을 입력해 출고 준비를 마칩니다.'
                        : '피킹과 포장이 모두 끝난 상품만 표시됩니다.'
                  }}
                </p>
              </div>
              <button
                v-if="outboundSubTab !== 'done'"
                class="ui-btn ui-btn--primary"
                @click="outboundSubTab === 'pick' ? completePickAll() : completePackAll()"
              >
                {{ outboundSubTab === 'pick' ? '피킹 일괄 완료' : '포장 일괄 완료' }}
              </button>
            </div>

            <div class="table-wrap">
              <table class="work-table">
                <thead v-if="outboundSubTab === 'pick'">
                <tr>
                  <th>Bin</th>
                  <th>위치</th>
                  <th>SKU</th>
                  <th>지시 수량</th>
                  <th>피킹 수량</th>
                  <th>비고</th>
                  <th>상태</th>
                  <th>처리</th>
                </tr>
                </thead>
                <thead v-else-if="outboundSubTab === 'pack'">
                <tr>
                  <th>SKU</th>
                  <th>주문 수량</th>
                  <th>피킹 수량</th>
                  <th>포장 수량</th>
                  <th>상태</th>
                  <th>처리</th>
                </tr>
                </thead>
                <thead v-else>
                <tr>
                  <th>SKU</th>
                  <th>Bin 위치</th>
                  <th>주문 수량</th>
                  <th>피킹 수량</th>
                  <th>포장 수량</th>
                  <th>피킹 상태</th>
                  <th>포장 상태</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="bin in selectedTask.bins" :key="bin.id" :class="{ 'row-alert': pickMismatch(bin) || packMismatch(bin) }">
                  <template v-if="outboundSubTab === 'pick'">
                    <td>{{ bin.binCode }}</td>
                    <td>{{ bin.location }}</td>
                    <td>{{ bin.sku }}</td>
                    <td>{{ bin.orderedQty }}</td>
                    <td><input v-model="bin.pickedQty" class="field field--short" inputmode="numeric" /></td>
                    <td><input v-model="bin.pickNote" class="field" placeholder="비고 입력" /></td>
                    <td><span :class="['status-chip', statusClass(bin.statusPick === '완료' ? '완료' : bin.pickedQty ? '진행중' : '대기')]">{{ bin.statusPick }}</span></td>
                    <td><button class="text-btn" type="button" @click="savePick(bin)">피킹 저장</button></td>
                  </template>
                  <template v-else-if="outboundSubTab === 'pack'">
                    <td>{{ bin.sku }}</td>
                    <td>{{ bin.orderedQty }}</td>
                    <td>{{ bin.pickedQty || '-' }}</td>
                    <td><input v-model="bin.packedQty" class="field field--short" inputmode="numeric" /></td>
                    <td><span :class="['status-chip', statusClass(bin.statusPack === '완료' ? '완료' : bin.packedQty ? '진행중' : '대기')]">{{ bin.statusPack }}</span></td>
                    <td><button class="text-btn" type="button" @click="savePack(bin)">포장 확인</button></td>
                  </template>
                  <template v-else>
                    <td>{{ bin.sku }}</td>
                    <td>{{ bin.location }}</td>
                    <td>{{ bin.orderedQty }}</td>
                    <td>{{ bin.pickedQty || '-' }}</td>
                    <td>{{ bin.packedQty || '-' }}</td>
                    <td><span :class="['status-chip', statusClass(bin.statusPick)]">{{ bin.statusPick }}</span></td>
                    <td><span :class="['status-chip', statusClass(bin.statusPack)]">{{ bin.statusPack }}</span></td>
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
  text-align: left;
  vertical-align: middle;
}

.work-table th {
  background: var(--surface-2);
  color: var(--t2);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-align: center;
}

.work-table td {
  color: var(--t2);
  font-size: var(--font-size-sm);
  text-align: center;
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