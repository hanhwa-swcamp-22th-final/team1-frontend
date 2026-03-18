<script setup>
import { computed, onMounted, onBeforeUnmount, onActivated, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import TimelineStepper from '@/components/common/TimelineStepper.vue'
import { ROUTE_NAMES } from '@/constants'

const router = useRouter()
const STORAGE_KEY = 'wh-worker-shared-state-v2'
const OVERVIEW_FILTERS = ['전체', '대기', '진행중', '완료']

const WORKER_TASKS_SEED = Object.freeze([
  {
    id: 'IB-2026-0312-01', type: '검수&적재', sellerCompany: '어반셀러코리아', refNo: 'ASN-240312-A01', assignedBinCount: 3, totalQty: 170, status: '대기',
    notes: '오늘 아침 입고 건입니다. 작업자는 본인에게 사전 배정된 Bin 범위 내 건만 확인합니다.', activeStep: '검수', flow: ['검수', '적재', '작업 완료'], referenceStatus: '입고예정', completedAt: '',
    bins: [
      { sku: 'SKU-UV-1001', plannedQty: 50, inspectedQty: '', putQty: '', statusInspect: '대기', statusPut: '대기' },
      { sku: 'SKU-UV-1002', plannedQty: 60, inspectedQty: '', putQty: '', statusInspect: '대기', statusPut: '대기' },
      { sku: 'SKU-UV-1003', plannedQty: 60, inspectedQty: '', putQty: '', statusInspect: '대기', statusPut: '대기' },
    ],
  },
  {
    id: 'IB-2026-0312-02', type: '검수&적재', sellerCompany: '푸드라인컴퍼니', refNo: 'ASN-240312-B04', assignedBinCount: 2, totalQty: 80, status: '진행중',
    notes: '검수는 일부 완료되었고 현재 적재 단계로 넘어간 작업입니다.', activeStep: '적재', flow: ['검수', '적재', '작업 완료'], referenceStatus: '검수완료', completedAt: '',
    bins: [
      { sku: 'SKU-FD-2001', plannedQty: 40, inspectedQty: '40', putQty: '40', statusInspect: '완료', statusPut: '완료' },
      { sku: 'SKU-FD-2002', plannedQty: 40, inspectedQty: '38', putQty: '', statusInspect: '완료', statusPut: '대기' },
    ],
  },
  {
    id: 'IB-2026-0312-03', type: '검수&적재', sellerCompany: '메가뷰티랩', refNo: 'ASN-240312-D11', assignedBinCount: 4, totalQty: 126, status: '대기',
    notes: '코스메틱 신규 입고 건으로 검수 시작 전 상태입니다.', activeStep: '검수', flow: ['검수', '적재', '작업 완료'], referenceStatus: '입고예정', completedAt: '',
    bins: [
      { sku: 'SKU-MB-4101', plannedQty: 30, inspectedQty: '', putQty: '', statusInspect: '대기', statusPut: '대기' },
      { sku: 'SKU-MB-4102', plannedQty: 28, inspectedQty: '', putQty: '', statusInspect: '대기', statusPut: '대기' },
      { sku: 'SKU-MB-4103', plannedQty: 32, inspectedQty: '', putQty: '', statusInspect: '대기', statusPut: '대기' },
      { sku: 'SKU-MB-4104', plannedQty: 36, inspectedQty: '', putQty: '', statusInspect: '대기', statusPut: '대기' },
    ],
  },
  {
    id: 'IB-2026-0311-05', type: '검수&적재', sellerCompany: '리빙하우스', refNo: 'ASN-240311-C09', assignedBinCount: 2, totalQty: 55, status: '완료',
    notes: '적재까지 완료되어 재고 관리에서 조회 가능한 작업입니다.', activeStep: '작업 완료', flow: ['검수', '적재', '작업 완료'], referenceStatus: '보관중', completedAt: '2026-03-12 09:12',
    bins: [
      { sku: 'SKU-LV-3301', plannedQty: 25, inspectedQty: '25', putQty: '25', statusInspect: '완료', statusPut: '완료' },
      { sku: 'SKU-LV-3302', plannedQty: 30, inspectedQty: '30', putQty: '30', statusInspect: '완료', statusPut: '완료' },
    ],
  },
  {
    id: 'OB-2026-0312-01', type: '피킹&패킹', sellerCompany: '어반셀러코리아', refNo: 'PICK-240312-701', assignedBinCount: 3, totalQty: 170, status: '대기',
    notes: '피킹 리스트 기준 작업입니다. 1 Bin = 1 SKU로 동선 순서에 맞춰 이동합니다.', activeStep: '피킹', flow: ['피킹', '패킹 검수', '작업 완료'], referenceStatus: '피킹대기', completedAt: '',
    bins: [
      { id: 'P-01', routeOrder: 1, location: 'ZONE-A · RACK-01 · BIN-01', sku: 'SKU-UV-1001', orderSpecQty: 60, pickedQty: '', packedQty: '', reason: '', pickStatus: '대기', packStatus: '대기' },
      { id: 'P-02', routeOrder: 2, location: 'ZONE-A · RACK-01 · BIN-02', sku: 'SKU-UV-1002', orderSpecQty: 50, pickedQty: '', packedQty: '', reason: '', pickStatus: '대기', packStatus: '대기' },
      { id: 'P-03', routeOrder: 3, location: 'ZONE-A · RACK-02 · BIN-01', sku: 'SKU-UV-1003', orderSpecQty: 60, pickedQty: '', packedQty: '', reason: '', pickStatus: '대기', packStatus: '대기' },
    ],
  },
  {
    id: 'OB-2026-0312-02', type: '피킹&패킹', sellerCompany: '스마트키친랩', refNo: 'PICK-240312-702', assignedBinCount: 2, totalQty: 80, status: '진행중',
    notes: '피킹 수량 입력 후 Bin 단위로 부분 저장과 완료 처리가 가능합니다.', activeStep: '피킹', flow: ['피킹', '패킹 검수', '작업 완료'], referenceStatus: '피킹중', completedAt: '',
    bins: [
      { id: 'P-04', routeOrder: 1, location: 'ZONE-B · RACK-03 · BIN-02', sku: 'SKU-KT-2201', orderSpecQty: 60, pickedQty: '60', packedQty: '', reason: '', pickStatus: '완료', packStatus: '대기' },
      { id: 'P-05', routeOrder: 2, location: 'ZONE-B · RACK-03 · BIN-03', sku: 'SKU-KT-2202', orderSpecQty: 20, pickedQty: '18', packedQty: '', reason: '2개 부족', pickStatus: '진행중', packStatus: '대기' },
    ],
  },
  {
    id: 'OB-2026-0312-03', type: '피킹&패킹', sellerCompany: '리빙하우스', refNo: 'PICK-240312-703', assignedBinCount: 2, totalQty: 55, status: '진행중',
    notes: '피킹 완료 후 주문 스펙 대조 기반으로 패킹 검수를 진행합니다.', activeStep: '패킹 검수', flow: ['피킹', '패킹 검수', '작업 완료'], referenceStatus: '피킹&패킹중', completedAt: '',
    bins: [
      { id: 'P-06', routeOrder: 1, location: 'ZONE-C · RACK-01 · BIN-01', sku: 'SKU-LV-3303', orderSpecQty: 30, pickedQty: '30', packedQty: '30', reason: '', pickStatus: '완료', packStatus: '완료' },
      { id: 'P-07', routeOrder: 2, location: 'ZONE-C · RACK-01 · BIN-02', sku: 'SKU-LV-3304', orderSpecQty: 25, pickedQty: '25', packedQty: '', reason: '', pickStatus: '완료', packStatus: '대기' },
    ],
  },
  {
    id: 'OB-2026-0312-04', type: '피킹&패킹', sellerCompany: '모던리빙', refNo: 'PICK-240312-704', assignedBinCount: 4, totalQty: 116, status: '대기',
    notes: '오후 마감 예정 출고 건으로 Bin 수가 많은 작업입니다.', activeStep: '피킹', flow: ['피킹', '패킹 검수', '작업 완료'], referenceStatus: '피킹대기', completedAt: '',
    bins: [
      { id: 'P-09', routeOrder: 1, location: 'ZONE-D · RACK-02 · BIN-01', sku: 'SKU-ML-5101', orderSpecQty: 24, pickedQty: '', packedQty: '', reason: '', pickStatus: '대기', packStatus: '대기' },
      { id: 'P-10', routeOrder: 2, location: 'ZONE-D · RACK-02 · BIN-02', sku: 'SKU-ML-5102', orderSpecQty: 28, pickedQty: '', packedQty: '', reason: '', pickStatus: '대기', packStatus: '대기' },
      { id: 'P-11', routeOrder: 3, location: 'ZONE-D · RACK-03 · BIN-01', sku: 'SKU-ML-5103', orderSpecQty: 30, pickedQty: '', packedQty: '', reason: '', pickStatus: '대기', packStatus: '대기' },
      { id: 'P-12', routeOrder: 4, location: 'ZONE-D · RACK-03 · BIN-02', sku: 'SKU-ML-5104', orderSpecQty: 34, pickedQty: '', packedQty: '', reason: '', pickStatus: '대기', packStatus: '대기' },
    ],
  },
  {
    id: 'OB-2026-0311-04', type: '피킹&패킹', sellerCompany: '홈킷스토어', refNo: 'PICK-240311-688', assignedBinCount: 1, totalQty: 42, status: '완료',
    notes: '패킹 검수 완료 후 출고대기 상태로 전환된 작업입니다.', activeStep: '작업 완료', flow: ['피킹', '패킹 검수', '작업 완료'], referenceStatus: '출고대기', completedAt: '2026-03-18 09:42',
    bins: [
      { id: 'P-08', routeOrder: 1, location: 'ZONE-D · RACK-01 · BIN-01', sku: 'SKU-HK-1101', orderSpecQty: 42, pickedQty: '42', packedQty: '42', reason: '', pickStatus: '완료', packStatus: '완료' },
    ],
  },
])

const ALERTS_SEED = Object.freeze([
  { id: 'ALT-01', taskId: 'IB-2026-0312-02', level: '주의', title: '검수 수량 불일치', description: 'SKU-FD-2002가 예정 40개 대비 38개로 확인되었습니다.', time: '09:18' },
  { id: 'ALT-02', taskId: 'OB-2026-0312-03', level: '확인', title: '패킹 검수 대기', description: '피킹 완료 후 1개 Bin이 아직 패킹 검수 전입니다.', time: '10:05' },
  { id: 'ALT-03', taskId: 'IB-2026-0312-01', level: '안내', title: '입고 예정 작업 신규 배정', description: '오전 입고 작업이 작업자에게 새로 배정되었습니다.', time: '10:22' },
  { id: 'ALT-04', taskId: 'OB-2026-0312-01', level: '주의', title: '출고 우선순위 높음', description: '당일 마감 주문 포함 건으로 우선 처리 권장입니다.', time: '11:10' },
  { id: 'ALT-05', taskId: 'IB-2026-0312-03', level: '안내', title: '화장품 입고 신규 배정', description: '메가뷰티랩 ASN-240312-D11 검수 대기 상태입니다.', time: '11:38' },
  { id: 'ALT-06', taskId: 'OB-2026-0312-04', level: '확인', title: '대량 피킹 작업 배정', description: '모던리빙 PICK-240312-704가 오후 출고 대상입니다.', time: '12:02' },
])

const breadcrumb = [{ label: '  WH Worker' }, { label: '통합 대시보드' }]
const tasks = ref([])
const alerts = ref(cloneSeed(ALERTS_SEED))
const overviewFilter = ref('전체')
const highlightedTaskId = ref('')

function cloneSeed(seed) {
  return JSON.parse(JSON.stringify(seed))
}

function outboundReferenceStatus(task) {
  if (task.activeStep === '작업 완료' || task.status === '완료') return '출고대기'
  if (task.activeStep === '패킹 검수') return '피킹&패킹중'
  return task.status === '대기' ? '피킹대기' : '피킹중'
}

function loadWorkerTasks() {
  if (typeof window === 'undefined') return cloneSeed(WORKER_TASKS_SEED)
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    if (saved && (Array.isArray(saved.inboundTasks) || Array.isArray(saved.outboundTasks))) {
      const inbound = (saved.inboundTasks ?? []).map((task) => ({
        id: task.id,
        type: '검수&적재',
        sellerCompany: task.sellerCompany,
        refNo: task.refNo,
        assignedBinCount: task.assignedBinCount,
        totalQty: task.totalQty,
        status: task.status,
        notes: task.notes,
        activeStep: task.activeStep,
        flow: ['검수', '적재', '작업 완료'],
        referenceStatus: task.asnStatus,
        completedAt: task.completedAt,
        bins: task.bins,
      }))

      const outbound = (saved.outboundTasks ?? []).map((task) => ({
        id: task.id,
        type: '피킹&패킹',
        sellerCompany: task.sellerCompany,
        refNo: task.pickListNo,
        assignedBinCount: task.assignedBinCount,
        totalQty: task.totalQty,
        status: task.status,
        notes: task.notes,
        activeStep: task.activeStep,
        flow: ['피킹', '패킹 검수', '작업 완료'],
        referenceStatus: outboundReferenceStatus(task),
        completedAt: task.completedAt,
        bins: task.bins,
      }))

      const merged = [...inbound, ...outbound]
      if (merged.length) return merged
    }
  } catch (error) {
    console.warn('dashboard shared parse failed', error)
  }
  return cloneSeed(WORKER_TASKS_SEED)
}


function refreshFromSharedState() {
  const currentId = highlightedTaskId.value
  tasks.value = loadWorkerTasks()
  if (tasks.value.some((task) => task.id === currentId)) {
    highlightedTaskId.value = currentId
    return
  }
  highlightedTaskId.value = tasks.value[0]?.id ?? ''
}

function handleSharedStateUpdate() {
  refreshFromSharedState()
}

onMounted(() => {
  refreshFromSharedState()
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleSharedStateUpdate)
    window.addEventListener('wh-worker-state-updated', handleSharedStateUpdate)
  }
})

onActivated(() => {
  refreshFromSharedState()
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('storage', handleSharedStateUpdate)
    window.removeEventListener('wh-worker-state-updated', handleSharedStateUpdate)
  }
})

const allTaskCount = computed(() => tasks.value.length)
const waitingTaskCount = computed(() => tasks.value.filter((task) => task.status === '대기').length)
const progressTaskCount = computed(() => tasks.value.filter((task) => task.status === '진행중').length)
const doneTaskCount = computed(() => tasks.value.filter((task) => task.status === '완료').length)
const reflectedInventoryCount = computed(() => inventoryRows(tasks.value).filter((row) => row.reflected).length)
const pendingInventoryCount = computed(() => inventoryRows(tasks.value).filter((row) => row.pending).length)

const filteredOverviewTasks = computed(() => {
  const ordered = [...tasks.value].sort(sortTasks)
  if (overviewFilter.value === '전체') return ordered
  return ordered.filter((task) => task.status === overviewFilter.value)
})

const inboundTasks = computed(() => [...tasks.value].filter((task) => task.type === '검수&적재').sort(sortTasks).slice(0, 3))
const outboundTasks = computed(() => [...tasks.value].filter((task) => task.type === '피킹&패킹').sort(sortTasks).slice(0, 3))
const highlightedTask = computed(() => tasks.value.find((task) => task.id === highlightedTaskId.value) ?? filteredOverviewTasks.value[0] ?? null)

const summaryCards = computed(() => [
  { key: 'all', label: '전체 작업', value: `${allTaskCount.value}건`, description: '오늘 작업자에게 배정된 전체 작업 수', tone: 'blue' },
  { key: 'wait', label: '대기 작업', value: `${waitingTaskCount.value}건`, description: '바로 시작 가능한 작업', tone: 'amber' },
  { key: 'progress', label: '진행중 작업', value: `${progressTaskCount.value}건`, description: '현재 입력 또는 검수 중인 작업', tone: 'purple' },
  { key: 'done', label: '완료 작업', value: `${doneTaskCount.value}건`, description: '오늘 완료 처리된 작업', tone: 'green' },
  { key: 'inventory', label: '재고 반영 Bin', value: `${reflectedInventoryCount.value} Bin`, description: `적재 대기 ${pendingInventoryCount.value} Bin`, tone: 'gold' },
])

function sortTasks(a, b) {
  const statusRank = { 대기: 0, 진행중: 1, 완료: 2 }
  const typeRank = { '검수&적재': 0, '피킹&패킹': 1 }
  return (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99) || (typeRank[a.type] ?? 99) - (typeRank[b.type] ?? 99) || a.refNo.localeCompare(b.refNo)
}

function inventoryRows(taskList) {
  return taskList
    .filter((task) => task.type === '검수&적재')
    .flatMap((task) => task.bins.map((bin) => ({ taskId: task.id, reflected: bin.statusInspect === '완료' && bin.statusPut === '완료', pending: bin.statusInspect === '완료' && bin.statusPut !== '완료' })))
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
  if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY)
  tasks.value = loadWorkerTasks()
  alerts.value = cloneSeed(ALERTS_SEED)
  overviewFilter.value = '전체'
  highlightedTaskId.value = tasks.value[0]?.id ?? ''
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

function goToTasks() {
  router.push({ name: ROUTE_NAMES.WH_WORKER_TASKS })
}

function goToInventory() {
  router.push({ name: ROUTE_NAMES.WH_WORKER_INVENTORY })
}
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
            <button class="ui-btn ui-btn--primary" @click="goToTasks">내 작업 전체 보기</button>
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
              <button class="ui-btn ui-btn--primary" @click="goToTasks">내 작업에서 자세히 보기</button>
            </div>

            <div class="alert-list">
              <button
                v-for="alert in alerts.slice(0, 4)"
                :key="alert.id"
                class="alert-item"
                type="button"
                @click="highlightTask(alert.taskId)"
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
          <button class="ui-btn ui-btn--ghost" @click="goToTasks">내 작업 이동</button>
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
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