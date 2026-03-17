<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const router = useRouter()

const OVERVIEW_FILTERS = ['전체', '대기', '진행중', '완료']

const WORKER_TASKS_SEED = Object.freeze([
  {
    id: 'IB-2026-0312-01',
    type: '검수&적재',
    sellerCompany: '어반셀러코리아',
    refNo: 'ASN-240312-A01',
    assignedBinCount: 3,
    totalQty: 170,
    status: '대기',
    notes:
      '오늘 아침 입고 건입니다. 작업자는 본인에게 사전 배정된 Bin 범위 내 건만 확인합니다.',
    activeStep: '검수',
    flow: ['검수', '적재'],
    referenceStatus: '입고예정',
    completedAt: '',
    bins: [
      { sku: 'SKU-UV-1001', plannedQty: 50, inspectedQty: '', putQty: '', statusInspect: '대기', statusPut: '대기' },
      { sku: 'SKU-UV-1002', plannedQty: 60, inspectedQty: '', putQty: '', statusInspect: '대기', statusPut: '대기' },
      { sku: 'SKU-UV-1003', plannedQty: 60, inspectedQty: '', putQty: '', statusInspect: '대기', statusPut: '대기' },
    ],
  }
]);

const ALERTS_SEED = Object.freeze([
  {
    id: 'ALT-01',
    taskId: 'IB-2026-0312-02',
    level: '주의',
    title: '검수 수량 불일치',
    description: 'SKU-FD-2002가 예정 40개 대비 38개로 확인되었습니다.',
    time: '09:18',
  }
]);

const tasks = ref(cloneSeed(WORKER_TASKS_SEED))
const alerts = ref(cloneSeed(ALERTS_SEED))
const overviewFilter = ref('전체')

const highlightedTaskId = ref(tasks.value[0]?.id ?? '')

const breadcrumb = [{ label: 'WH Worker' }, { label: '통합 대시보드' }]

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
</script>


<template>
  <AppLayout>
    <h1>통합 대시보드</h1>
    <p>창고 작업자 / 통합 대시보드</p>
  </AppLayout>
</template>

