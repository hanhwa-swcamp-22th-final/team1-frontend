<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()
const breadcrumb = [{ label: 'WH Worker' }, { label: '출고 관리' }]

const OUTBOUND_TASKS_SEED = Object.freeze([
  {
    id: 'OB-2026-0312-01',
    sellerCompany: '어반셀러코리아',
    pickListNo: 'PICK-240312-701',
    assignedBinCount: 3,
    totalQty: 170,
    status: '대기',
    activeStep: '피킹',
    notes: '배정된 Bin 범위만 피킹합니다. 대기 상태 작업이 우선 노출됩니다.',
    completedAt: '',
    adminAlerts: [],
    bins: [
      { id: 'P-01', routeOrder: 1, location: 'ZONE-A · RACK-01 · BIN-01', sku: 'SKU-UV-1001', orderSpecQty: 60, pickedQty: '', packedQty: '', reason: '', pickStatus: '대기', packStatus: '대기' },
      { id: 'P-02', routeOrder: 2, location: 'ZONE-A · RACK-01 · BIN-02', sku: 'SKU-UV-1002', orderSpecQty: 50, pickedQty: '', packedQty: '', reason: '', pickStatus: '대기', packStatus: '대기' },
      { id: 'P-03', routeOrder: 3, location: 'ZONE-A · RACK-02 · BIN-01', sku: 'SKU-UV-1003', orderSpecQty: 60, pickedQty: '', packedQty: '', reason: '', pickStatus: '대기', packStatus: '대기' },
    ],
  },
  {
    id: 'OB-2026-0312-02',
    sellerCompany: '스마트키친랩',
    pickListNo: 'PICK-240312-702',
    assignedBinCount: 2,
    totalQty: 80,
    status: '진행중',
    activeStep: '피킹',
    notes: '피킹 수량 입력 후 Bin 단위로 부분 저장과 완료 처리가 가능합니다.',
    completedAt: '',
    adminAlerts: ['[피킹 불일치] P-05 / SKU-KT-2202 / 사유: 2개 부족'],
    bins: [
      { id: 'P-04', routeOrder: 1, location: 'ZONE-B · RACK-03 · BIN-02', sku: 'SKU-KT-2201', orderSpecQty: 60, pickedQty: '60', packedQty: '', reason: '', pickStatus: '완료', packStatus: '대기' },
      { id: 'P-05', routeOrder: 2, location: 'ZONE-B · RACK-03 · BIN-03', sku: 'SKU-KT-2202', orderSpecQty: 20, pickedQty: '18', packedQty: '', reason: '2개 부족', pickStatus: '진행중', packStatus: '대기' },
    ],
  },
  {
    id: 'OB-2026-0312-03',
    sellerCompany: '리빙하우스',
    pickListNo: 'PICK-240312-703',
    assignedBinCount: 2,
    totalQty: 55,
    status: '진행중',
    activeStep: '패킹 검수',
    notes: '피킹 완료 후 주문 스펙 대조 기반으로 패킹 검수를 진행합니다.',
    completedAt: '',
    adminAlerts: [],
    bins: [
      { id: 'P-06', routeOrder: 1, location: 'ZONE-C · RACK-01 · BIN-01', sku: 'SKU-LV-3303', orderSpecQty: 30, pickedQty: '30', packedQty: '30', reason: '', pickStatus: '완료', packStatus: '완료' },
      { id: 'P-07', routeOrder: 2, location: 'ZONE-C · RACK-01 · BIN-02', sku: 'SKU-LV-3304', orderSpecQty: 25, pickedQty: '25', packedQty: '', reason: '', pickStatus: '완료', packStatus: '대기' },
    ],
  },
  {
    id: 'OB-2026-0311-04',
    sellerCompany: '홈킷스토어',
    pickListNo: 'PICK-240311-688',
    assignedBinCount: 1,
    totalQty: 42,
    status: '완료',
    activeStep: '작업 완료',
    notes: '패킹 검수 완료 후 출고대기 상태로 전환된 작업입니다.',
    completedAt: '2026-03-18 09:42',
    adminAlerts: [],
    bins: [
      { id: 'P-08', routeOrder: 1, location: 'ZONE-D · RACK-01 · BIN-01', sku: 'SKU-HK-1101', orderSpecQty: 42, pickedQty: '42', packedQty: '42', reason: '', pickStatus: '완료', packStatus: '완료' },
    ],
  },
])

const STEP_FILTERS = ['피킹', '패킹 검수', '작업 완료']
const tasks = ref(cloneSeed(OUTBOUND_TASKS_SEED))
const activeStepFilter = ref('피킹')
const selectedTaskId = ref(String(route.query.taskId || ''))

function cloneSeed(seed) {
  return JSON.parse(JSON.stringify(seed))
}

function nowStamp() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}

function sortTasks(a, b) {
  const statusRank = { 대기: 0, 진행중: 1, 완료: 2 }
  return (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9) || a.id.localeCompare(b.id)
}

function statusClass(status) {
  return {
    대기: 'status-chip--amber',
    진행중: 'status-chip--purple',
    완료: 'status-chip--green',
  }[status]
}

function rowStatusClass(state) {
  return state === '완료' ? 'status-chip--green' : state === '진행중' ? 'status-chip--purple' : 'status-chip--amber'
}

function orderStateLabel(task) {
  if (task.activeStep === '피킹') return task.status === '대기' ? '피킹대기' : '피킹중'
  if (task.activeStep === '패킹 검수') return '피킹&패킹중'
  return '출고대기'
}

function taskStepLabel(task) {
  return task.activeStep
}

const filteredTaskCards = computed(() => {
  return [...tasks.value].filter((task) => task.activeStep === activeStepFilter.value).sort(sortTasks)
})

const selectedTask = computed(() => {
  const byId = tasks.value.find((task) => task.id === selectedTaskId.value)
  return byId ?? filteredTaskCards.value[0] ?? null
})

watch(
  () => route.query.taskId,
  (taskId) => {
    if (!taskId) return
    const matched = tasks.value.find((task) => task.id === String(taskId))
    if (!matched) return
    selectedTaskId.value = matched.id
    activeStepFilter.value = matched.activeStep
  },
  { immediate: true }
)

watch(
  [filteredTaskCards, selectedTask],
  ([cards, task]) => {
    if (!cards.length) {
      selectedTaskId.value = ''
      return
    }
    if (!task || !cards.some((card) => card.id === task.id)) {
      selectedTaskId.value = cards[0].id
    }
  },
  { immediate: true }
)

const summaryCards = computed(() => [
  {
    key: 'wait',
    label: '대기 출고',
    value: `${tasks.value.filter((task) => task.status === '대기').length}건`,
    description: '피킹 시작 전 작업',
    tone: 'amber',
  },
  {
    key: 'progress',
    label: '진행중 출고',
    value: `${tasks.value.filter((task) => task.status === '진행중').length}건`,
    description: '피킹 또는 패킹 검수 중',
    tone: 'blue',
  },
  {
    key: 'done',
    label: '완료 출고',
    value: `${tasks.value.filter((task) => task.status === '완료').length}건`,
    description: '출고대기 상태 전환 완료',
    tone: 'green',
  },
])

const detailStepIndex = computed(() => ({ 피킹: 1, '패킹 검수': 2, '작업 완료': 3 }[selectedTask.value?.activeStep] ?? 1))

const detailHint = computed(() => {
  if (!selectedTask.value) return ''
  if (selectedTask.value.activeStep === '피킹') return '동선 순서와 Bin 위치를 확인하고 실제 피킹 수량을 입력하세요. 수량이 다르면 사유를 입력한 뒤 Bin 단위로 저장 또는 완료할 수 있습니다.'
  if (selectedTask.value.activeStep === '패킹 검수') return '주문 스펙과 실물 수량을 대조해 패킹 검수를 진행합니다. 결품·과잉 발생 시 관리자 알림이 자동 생성됩니다.'
  return '패킹 검수 완료 후 작업 완료 버튼으로 주문 상태가 출고대기로 전환됩니다.'
})

const detailInfoCards = computed(() => {
  const task = selectedTask.value
  if (!task) return []
  return [
    { label: '셀러 회사', value: task.sellerCompany },
    { label: '피킹리스트 번호', value: task.pickListNo },
    { label: '총 Bin 수', value: `${task.assignedBinCount}개` },
    { label: '총 피킹 수량', value: `${task.totalQty}개` },
    { label: '주문 상태', value: orderStateLabel(task) },
    { label: '완료 시각', value: task.completedAt || '-' },
  ]
})

function stepNodeClass(index) {
  if (detailStepIndex.value > index) return 'flow-step__node--done'
  if (detailStepIndex.value === index) return 'flow-step__node--active'
  return ''
}

function stepLabelClass(index) {
  if (detailStepIndex.value > index) return 'flow-step__label--done'
  if (detailStepIndex.value === index) return 'flow-step__label--active'
  return ''
}

function lineClass(index) {
  return detailStepIndex.value > index ? 'flow-line--done' : ''
}

function selectTask(taskId) {
  selectedTaskId.value = taskId
}

function setStepFilter(step) {
  activeStepFilter.value = step
}

function isPickMismatch(bin) {
  return String(bin.pickedQty).trim() !== '' && Number(bin.pickedQty) !== Number(bin.orderSpecQty)
}

function isPackMismatch(bin) {
  return String(bin.packedQty).trim() !== '' && Number(bin.packedQty) !== Number(bin.orderSpecQty)
}

function pickCanComplete(bin) {
  return String(bin.pickedQty).trim() !== '' && (!isPickMismatch(bin) || String(bin.reason).trim() !== '')
}

function packCanComplete(bin) {
  return String(bin.packedQty).trim() !== '' && (!isPackMismatch(bin) || String(bin.reason).trim() !== '')
}

function savePickRow(task, bin) {
  if (!String(bin.pickedQty).trim()) return
  bin.pickStatus = '진행중'
  task.status = '진행중'
  recomputeTask(task)
}

function completePickRow(task, bin) {
  if (!pickCanComplete(bin)) return
  if (isPickMismatch(bin)) pushAdminAlert(task, `[피킹 불일치] ${bin.id} / ${bin.sku} / 사유: ${bin.reason}`)
  bin.pickStatus = '완료'
  recomputeTask(task)
}

function savePackRow(task, bin) {
  if (!String(bin.packedQty).trim()) return
  bin.packStatus = '진행중'
  task.status = '진행중'
  recomputeTask(task)
}

function completeInspectRow(task, bin) {
  if (!packCanComplete(bin)) return
  if (isPackMismatch(bin)) pushAdminAlert(task, `[패킹 불일치] ${bin.id} / ${bin.sku} / 사유: ${bin.reason}`)
  bin.packStatus = '완료'
  recomputeTask(task)
}

function completeTask(task) {
  if (!task.bins.every((bin) => bin.packStatus === '완료')) return
  task.activeStep = '작업 완료'
  task.status = '완료'
  task.completedAt = task.completedAt || nowStamp()
  activeStepFilter.value = '작업 완료'
  selectedTaskId.value = task.id
}

function pushAdminAlert(task, message) {
  if (!task.adminAlerts.includes(message)) task.adminAlerts.unshift(message)
}

function recomputeTask(task) {
  const allPickDone = task.bins.every((bin) => bin.pickStatus === '완료')
  const allPackDone = task.bins.every((bin) => bin.packStatus === '완료')
  const anyTouched = task.bins.some((bin) => String(bin.pickedQty).trim() !== '' || String(bin.packedQty).trim() !== '')

  if (allPackDone) {
    task.activeStep = '작업 완료'
    task.status = '진행중'
    activeStepFilter.value = '작업 완료'
    selectedTaskId.value = task.id
    return
  }

  if (allPickDone) {
    task.activeStep = '패킹 검수'
    task.status = '진행중'
    activeStepFilter.value = '패킹 검수'
    selectedTaskId.value = task.id
    task.bins.forEach((bin) => {
      if (bin.packStatus !== '완료') bin.packStatus = '대기'
    })
    return
  }

  task.activeStep = '피킹'
  task.status = anyTouched ? '진행중' : '대기'
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="출고 관리">
    <template #header-action>
      <button :class="['ui-btn', activeStepFilter === '피킹' ? 'ui-btn--primary' : 'ui-btn--ghost']" @click="setStepFilter('피킹')">피킹 보기</button>
      <button :class="['ui-btn', activeStepFilter === '패킹 검수' ? 'ui-btn--primary' : 'ui-btn--ghost']" @click="setStepFilter('패킹 검수')">패킹 검수 보기</button>
      <button :class="['ui-btn', activeStepFilter === '작업 완료' ? 'ui-btn--primary' : 'ui-btn--ghost']" @click="setStepFilter('작업 완료')">완료 보기</button>
    </template>

    <section class="outbound-page">
      <div class="summary-grid summary-grid--three">
        <article v-for="card in summaryCards" :key="card.key" :class="`summary-card--${card.tone}`" class="summary-card">
          <p class="summary-card__label">{{ card.label }}</p>
          <strong class="summary-card__value">{{ card.value }}</strong>
          <span class="summary-card__desc">{{ card.description }}</span>
        </article>
      </div>

      <div class="content-grid">
        <article class="panel panel--task-list">
          <div class="panel-head">
            <div>
              <h2 class="panel-title">출고 작업 목록</h2>
              <p class="panel-subtitle">피킹 → 패킹 검수 → 작업 완료 흐름으로 순차 처리합니다.</p>
            </div>

            <div class="stage-filter">
              <button v-for="step in STEP_FILTERS" :key="step" :class="['stage-filter__btn', { 'stage-filter__btn--active': activeStepFilter === step }]" type="button" @click="setStepFilter(step)">
                {{ step }}
              </button>
            </div>
          </div>

          <div class="task-list">
            <button v-for="task in filteredTaskCards" :key="task.id" :class="['task-card', { 'task-card--active': selectedTask?.id === task.id }]" type="button" @click="selectTask(task.id)">
              <div class="task-card__top">
                <div class="task-card__title-wrap">
                  <h3>{{ task.id }}</h3>
                  <p>{{ task.pickListNo }} · {{ task.sellerCompany }}</p>
                </div>
                <span :class="['status-chip', statusClass(task.status)]">{{ task.status }}</span>
              </div>

              <div class="task-card__info-grid">
                <article class="task-card__info-box"><span>담당 Bin</span><strong>{{ task.assignedBinCount }} Bin</strong></article>
                <article class="task-card__info-box"><span>총 수량</span><strong>{{ task.totalQty }}</strong></article>
                <article class="task-card__info-box"><span>현재 단계</span><strong>{{ taskStepLabel(task) }}</strong></article>
              </div>
            </button>
          </div>
        </article>

        <article v-if="selectedTask" class="panel panel--detail">
          <div class="panel-head panel-head--detail">
            <div>
              <h2 class="panel-title">{{ selectedTask.id }}</h2>
              <p class="panel-subtitle">{{ selectedTask.notes }}</p>
            </div>
            <span :class="['status-chip', statusClass(selectedTask.status)]">{{ selectedTask.status }}</span>
          </div>

          <div class="detail-flow">
            <div class="flow-step">
              <div :class="['flow-step__node', stepNodeClass(1)]"><span v-if="detailStepIndex > 1">✓</span><span v-else>1</span></div>
              <span :class="['flow-step__label', stepLabelClass(1)]">피킹</span>
            </div>
            <div :class="['flow-line', lineClass(1)]"></div>
            <div class="flow-step">
              <div :class="['flow-step__node', stepNodeClass(2)]"><span v-if="detailStepIndex > 2">✓</span><span v-else>2</span></div>
              <span :class="['flow-step__label', stepLabelClass(2)]">패킹 검수</span>
            </div>
            <div :class="['flow-line', lineClass(2)]"></div>
            <div class="flow-step">
              <div :class="['flow-step__node', stepNodeClass(3)]">3</div>
              <span :class="['flow-step__label', stepLabelClass(3)]">작업 완료</span>
            </div>
          </div>

          <div class="detail-info-grid">
            <article v-for="card in detailInfoCards" :key="card.label" class="detail-info-card">
              <p>{{ card.label }}</p>
              <strong>{{ card.value }}</strong>
            </article>
          </div>

          <div class="hint-box">{{ detailHint }}</div>

          <div v-if="selectedTask.adminAlerts.length" class="alert-board">
            <article class="alert-card">
              <p class="alert-card__title">창고 관리자 알림</p>
              <div class="alert-card__value" v-for="alert in selectedTask.adminAlerts" :key="alert">{{ alert }}</div>
            </article>
          </div>

          <section class="work-block">
            <div class="table-wrap">
              <table class="work-table">
                <thead v-if="selectedTask.activeStep === '피킹'">
                  <tr>
                    <th class="cell-center">동선 순서</th>
                    <th>Bin 위치</th>
                    <th>SKU</th>
                    <th class="cell-center">주문 스펙 수량</th>
                    <th class="cell-center">피킹 수량</th>
                    <th>불일치 사유</th>
                    <th class="cell-center">상태</th>
                    <th class="cell-center">처리</th>
                  </tr>
                </thead>
                <thead v-else-if="selectedTask.activeStep === '패킹 검수'">
                  <tr>
                    <th class="cell-center">동선 순서</th>
                    <th>Bin 위치</th>
                    <th>SKU</th>
                    <th class="cell-center">주문 스펙 수량</th>
                    <th class="cell-center">검수 수량</th>
                    <th>불일치 사유</th>
                    <th class="cell-center">상태</th>
                    <th class="cell-center">처리</th>
                  </tr>
                </thead>
                <thead v-else>
                  <tr>
                    <th class="cell-center">동선 순서</th>
                    <th>Bin 위치</th>
                    <th>SKU</th>
                    <th class="cell-center">피킹 수량</th>
                    <th class="cell-center">검수 수량</th>
                    <th>비고</th>
                    <th class="cell-center">상태</th>
                    <th class="cell-center">처리</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="bin in selectedTask.bins" :key="`${selectedTask.id}-${bin.id}`" :class="{ 'row-alert': (selectedTask.activeStep === '피킹' && isPickMismatch(bin)) || (selectedTask.activeStep === '패킹 검수' && isPackMismatch(bin)) }">
                    <template v-if="selectedTask.activeStep === '피킹'">
                      <td class="cell-center">{{ bin.routeOrder }}</td>
                      <td>
                        <strong>{{ bin.id }}</strong><br />
                        {{ bin.location }}
                      </td>
                      <td>{{ bin.sku }}</td>
                      <td class="cell-center">{{ bin.orderSpecQty }}</td>
                      <td class="cell-center"><input v-model="bin.pickedQty" class="field field--qty" inputmode="numeric" /></td>
                      <td>
                        <input v-model="bin.reason" class="field" :placeholder="isPickMismatch(bin) ? '사유 필수 입력' : '사유 입력'" />
                        <p v-if="isPickMismatch(bin)" class="alert-text">수량 불일치 시 관리자 알림이 생성됩니다.</p>
                      </td>
                      <td class="cell-center"><span :class="['status-chip', rowStatusClass(bin.pickStatus)]">{{ bin.pickStatus }}</span></td>
                      <td class="cell-center">
                        <div class="table-actions">
                          <button class="action-btn action-btn--ghost" type="button" @click="savePickRow(selectedTask, bin)">부분 저장</button>
                          <button class="action-btn" type="button" @click="completePickRow(selectedTask, bin)">피킹 완료</button>
                        </div>
                      </td>
                    </template>

                    <template v-else-if="selectedTask.activeStep === '패킹 검수'">
                      <td class="cell-center">{{ bin.routeOrder }}</td>
                      <td>
                        <strong>{{ bin.id }}</strong><br />
                        {{ bin.location }}
                      </td>
                      <td>{{ bin.sku }}</td>
                      <td class="cell-center">{{ bin.orderSpecQty }}</td>
                      <td class="cell-center"><input v-model="bin.packedQty" class="field field--qty" inputmode="numeric" /></td>
                      <td>
                        <input v-model="bin.reason" class="field" :placeholder="isPackMismatch(bin) ? '사유 필수 입력' : '사유 입력'" />
                        <p v-if="isPackMismatch(bin)" class="alert-text">결품/과잉 시 관리자 알림이 생성됩니다.</p>
                      </td>
                      <td class="cell-center"><span :class="['status-chip', rowStatusClass(bin.packStatus)]">{{ bin.packStatus }}</span></td>
                      <td class="cell-center">
                        <div class="table-actions">
                          <button class="action-btn action-btn--ghost" type="button" @click="savePackRow(selectedTask, bin)">부분 저장</button>
                          <button class="action-btn" type="button" @click="completeInspectRow(selectedTask, bin)">검수 완료</button>
                        </div>
                      </td>
                    </template>

                    <template v-else>
                      <td class="cell-center">{{ bin.routeOrder }}</td>
                      <td><strong>{{ bin.id }}</strong><br />{{ bin.location }}</td>
                      <td>{{ bin.sku }}</td>
                      <td class="cell-center">{{ bin.pickedQty }}</td>
                      <td class="cell-center">{{ bin.packedQty }}</td>
                      <td>{{ bin.reason || '-' }}</td>
                      <td class="cell-center"><span class="status-chip status-chip--green">완료</span></td>
                      <td class="cell-center"><button class="action-btn" type="button" @click="completeTask(selectedTask)">작업 완료</button></td>
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
.outbound-page {
  display: grid;
  gap: var(--space-5);
}

.summary-grid {
  display: grid;
  gap: var(--space-4);
}

.summary-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.summary-card,
.panel,
.detail-info-card,
.work-block {
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.summary-card {
  min-height: 132px;
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
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
.summary-card--green { border-top: 4px solid var(--green); }

.content-grid {
  display: grid;
  grid-template-columns: minmax(360px, 0.72fr) minmax(0, 1.28fr);
  gap: var(--space-5);
  align-items: start;
}

.panel {
  padding: 20px;
}

.panel--task-list,
.panel--detail {
  display: grid;
  gap: var(--space-4);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
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

.stage-filter {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 0;
}

.stage-filter__btn {
  min-width: 0;
  height: 40px;
  padding: 0 18px;
  border: 1px solid #d7deea;
  border-radius: 999px;
  background: #f7f9fc;
  color: #1f2a44;
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: 1;
  transition: background-color var(--ease-fast), border-color var(--ease-fast), color var(--ease-fast), box-shadow var(--ease-fast);
}

.stage-filter__btn--active {
  border-color: #4d70f0;
  background: #4d70f0;
  color: #ffffff;
  box-shadow: none;
}

.task-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  max-height: calc(100vh - 310px);
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
  align-items: flex-start;
  gap: 12px;
}

.task-card__title-wrap {
  min-width: 0;
}

.task-card__title-wrap h3 {
  font-family: var(--font-condensed);
  font-size: clamp(20px, 1.15vw, 24px);
  line-height: 1;
  color: var(--t1);
}

.task-card__title-wrap p {
  margin-top: 4px;
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.task-card__info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.task-card__info-box {
  padding: 12px;
  border-radius: var(--radius-lg);
  background: var(--surface-2);
}

.task-card__info-box span {
  display: block;
  color: var(--t3);
  font-size: var(--font-size-xs);
  margin-bottom: 6px;
}

.task-card__info-box strong {
  display: block;
  color: var(--t1);
  font-size: var(--font-size-md);
  font-weight: 700;
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
  white-space: nowrap;
}

.status-chip--amber {
  color: #a16400;
  background: #fff7df;
}

.status-chip--purple {
  color: #6f63e8;
  background: #eceeff;
}

.status-chip--green {
  color: #138553;
  background: #e8f8ef;
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

.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.detail-info-card {
  padding: 16px;
  background: var(--surface-2);
  border-radius: var(--radius-lg);
}

.detail-info-card p {
  margin-bottom: 8px;
  color: var(--t3);
  font-size: var(--font-size-xs);
  line-height: 1.5;
}

.detail-info-card strong {
  display: block;
  color: var(--t1);
  font-size: var(--font-size-md);
  font-weight: 700;
  line-height: 1.4;
  word-break: keep-all;
}

.hint-box {
  padding: 16px 18px;
  border-radius: var(--radius-lg);
  background: #eef3ff;
  color: var(--t2);
  line-height: 1.7;
}

.work-block {
  overflow: hidden;
}

.table-wrap {
  overflow: auto;
}

.work-table {
  width: 100%;
  min-width: 780px;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.work-table th,
.work-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: middle;
}

.work-table th {
  background: var(--surface-2);
  color: var(--t1);
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: 1.4;
}

.work-table td {
  color: var(--t2);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.work-table tbody tr:last-child td {
  border-bottom: none;
}

.cell-center {
  text-align: center !important;
}

.field {
  width: 100%;
  height: 36px;
  border: 1px solid #d4dceb;
  border-radius: 10px;
  padding: 0 12px;
  background: #ffffff;
  color: var(--t1);
  text-align: left;
}

.field:focus {
  outline: none;
  border-color: #9cb2ff;
  box-shadow: 0 0 0 3px rgba(79, 110, 232, 0.1);
}

.field--qty {
  width: 88px;
  text-align: center;
}

.action-btn {
  min-width: 90px;
  min-height: 36px;
  padding: 8px 14px;
  border: none;
  border-radius: 10px;
  background: #4d70f0;
  color: #ffffff;
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: 1.2;
}

.action-btn:hover {
  filter: brightness(0.97);
}

@media (max-width: 1440px) {
  .summary-grid--three,
  .detail-info-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
  .summary-grid--three,
  .detail-info-grid,
  .task-card__info-grid {
    grid-template-columns: 1fr;
  }

  .panel,
  .summary-card,
  .task-card {
    padding: 16px;
  }

  .panel-head,
  .task-card__top {
    flex-direction: column;
  }

  .detail-flow {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .flow-line {
    display: none;
  }

  .status-chip {
    width: fit-content;
  }
}

.row-alert { background: rgba(239, 68, 68, 0.08); }
.alert-text { color: #dc2626; font-size: 12px; font-weight: 700; }
.alert-board { display: grid; gap: 10px; }
.alert-card { border: 1px solid rgba(239, 68, 68, 0.25); background: rgba(254, 242, 242, 0.9); border-radius: 16px; padding: 14px 16px; }
.alert-card__title { font-size: 13px; color: var(--t3); margin-bottom: 4px; }
.alert-card__value { font-weight: 700; color: var(--t1); }
.table-actions { display: inline-flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.action-btn--ghost { background: #fff; color: var(--blue); border: 1px solid rgba(59, 130, 246, 0.24); }
</style>
