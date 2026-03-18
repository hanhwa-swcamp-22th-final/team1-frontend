<script setup>
import { computed, onMounted, onBeforeUnmount, onActivated, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

// 입고 관리 화면 브레드크럼
const breadcrumb = [{ label: 'WH Worker' }, { label: '입고 관리' }]
const route = useRoute()
const STORAGE_KEY = 'wh-worker-shared-state-v2'

// 입고 관리 목업용 작업 데이터 (대기/진행중/완료 상태 풍성하게 추가)
const INBOUND_TASKS_SEED = Object.freeze([
  // --- 대기 (5건) ---
  {
    id: 'IB-2026-0312-01',
    type: '검수&적재',
    sellerCompany: '어반셀러코리아',
    refNo: 'ASN-240312-A01',
    assignedBinCount: 3,
    totalQty: 170,
    status: '대기',
    notes: '오늘 아침 입고 건입니다. 작업자는 본인에게 사전 배정된 Bin 범위 내 건만 확인합니다.',
    flow: ['검수', '적재'],
    activeStep: '검수',
    asnStatus: '입고예정',
    stockActivation: false,
    completedAt: '',
    bins: [
      { id: 'A-01', location: 'ZONE-A · RACK-01 · BIN-01', designatedBinCode: 'A-01-01', sku: 'SKU-UV-1001', plannedQty: 50, inspectedQty: '', inspectNote: '', statusInspect: '대기', confirmBinCode: '', putQty: '', statusPut: '대기' },
      { id: 'A-02', location: 'ZONE-A · RACK-01 · BIN-02', designatedBinCode: 'A-01-02', sku: 'SKU-UV-1002', plannedQty: 60, inspectedQty: '', inspectNote: '', statusInspect: '대기', confirmBinCode: '', putQty: '', statusPut: '대기' },
      { id: 'A-03', location: 'ZONE-A · RACK-02 · BIN-01', designatedBinCode: 'A-02-01', sku: 'SKU-UV-1003', plannedQty: 60, inspectedQty: '', inspectNote: '', statusInspect: '대기', confirmBinCode: '', putQty: '', statusPut: '대기' },
    ],
  },
  {
    id: 'IB-2026-0312-03',
    type: '검수&적재',
    sellerCompany: '메가뷰티랩',
    refNo: 'ASN-240312-D11',
    assignedBinCount: 4,
    totalQty: 126,
    status: '대기',
    notes: '화장품 카테고리 신규 입고 건입니다. 모든 Bin이 검수 대기 상태입니다.',
    flow: ['검수', '적재'],
    activeStep: '검수',
    asnStatus: '입고예정',
    stockActivation: false,
    completedAt: '',
    bins: [
      { id: 'D-01', location: 'ZONE-D · RACK-01 · BIN-01', designatedBinCode: 'D-01-01', sku: 'SKU-MB-4101', plannedQty: 30, inspectedQty: '', inspectNote: '', statusInspect: '대기', confirmBinCode: '', putQty: '', statusPut: '대기' },
      { id: 'D-02', location: 'ZONE-D · RACK-01 · BIN-02', designatedBinCode: 'D-01-02', sku: 'SKU-MB-4102', plannedQty: 28, inspectedQty: '', inspectNote: '', statusInspect: '대기', confirmBinCode: '', putQty: '', statusPut: '대기' },
      { id: 'D-03', location: 'ZONE-D · RACK-02 · BIN-01', designatedBinCode: 'D-02-01', sku: 'SKU-MB-4103', plannedQty: 32, inspectedQty: '', inspectNote: '', statusInspect: '대기', confirmBinCode: '', putQty: '', statusPut: '대기' },
      { id: 'D-04', location: 'ZONE-D · RACK-02 · BIN-02', designatedBinCode: 'D-02-02', sku: 'SKU-MB-4104', plannedQty: 36, inspectedQty: '', inspectNote: '', statusInspect: '대기', confirmBinCode: '', putQty: '', statusPut: '대기' },
    ],
  },
  {
    id: 'IB-2026-0312-06',
    type: '검수&적재',
    sellerCompany: '펫피아',
    refNo: 'ASN-240312-P01',
    assignedBinCount: 2,
    totalQty: 85,
    status: '대기',
    notes: '반려동물 용품 긴급 입고 건입니다. 신속한 검수가 필요합니다.',
    flow: ['검수', '적재'],
    activeStep: '검수',
    asnStatus: '입고예정',
    stockActivation: false,
    completedAt: '',
    bins: [
      { id: 'P-01', location: 'ZONE-P · RACK-04 · BIN-01', designatedBinCode: 'P-04-01', sku: 'SKU-PT-8001', plannedQty: 45, inspectedQty: '', inspectNote: '', statusInspect: '대기', confirmBinCode: '', putQty: '', statusPut: '대기' },
      { id: 'P-02', location: 'ZONE-P · RACK-04 · BIN-02', designatedBinCode: 'P-04-02', sku: 'SKU-PT-8002', plannedQty: 40, inspectedQty: '', inspectNote: '', statusInspect: '대기', confirmBinCode: '', putQty: '', statusPut: '대기' },
    ],
  },
  {
    id: 'IB-2026-0312-07',
    type: '검수&적재',
    sellerCompany: '스마트테크',
    refNo: 'ASN-240312-T05',
    assignedBinCount: 1,
    totalQty: 15,
    status: '대기',
    notes: '고가 전자기기 입고. 파손 여부 꼼꼼히 확인 바랍니다.',
    flow: ['검수', '적재'],
    activeStep: '검수',
    asnStatus: '입고예정',
    stockActivation: false,
    completedAt: '',
    bins: [
      { id: 'T-01', location: 'ZONE-T · RACK-01 · BIN-05', designatedBinCode: 'T-01-05', sku: 'SKU-ST-9901', plannedQty: 15, inspectedQty: '', inspectNote: '', statusInspect: '대기', confirmBinCode: '', putQty: '', statusPut: '대기' },
    ],
  },
  {
    id: 'IB-2026-0312-08',
    type: '검수&적재',
    sellerCompany: '베이비슈',
    refNo: 'ASN-240312-B12',
    assignedBinCount: 3,
    totalQty: 150,
    status: '대기',
    notes: '유아용품 정기 입고 건.',
    flow: ['검수', '적재'],
    activeStep: '검수',
    asnStatus: '입고예정',
    stockActivation: false,
    completedAt: '',
    bins: [
      { id: 'B-11', location: 'ZONE-B · RACK-05 · BIN-01', designatedBinCode: 'B-05-01', sku: 'SKU-BB-1101', plannedQty: 50, inspectedQty: '', inspectNote: '', statusInspect: '대기', confirmBinCode: '', putQty: '', statusPut: '대기' },
      { id: 'B-12', location: 'ZONE-B · RACK-05 · BIN-02', designatedBinCode: 'B-05-02', sku: 'SKU-BB-1102', plannedQty: 50, inspectedQty: '', inspectNote: '', statusInspect: '대기', confirmBinCode: '', putQty: '', statusPut: '대기' },
      { id: 'B-13', location: 'ZONE-B · RACK-05 · BIN-03', designatedBinCode: 'B-05-03', sku: 'SKU-BB-1103', plannedQty: 50, inspectedQty: '', inspectNote: '', statusInspect: '대기', confirmBinCode: '', putQty: '', statusPut: '대기' },
    ],
  },

  // --- 진행중 (5건) ---
  {
    id: 'IB-2026-0312-02',
    type: '검수&적재',
    sellerCompany: '푸드라인컴퍼니',
    refNo: 'ASN-240312-B04',
    assignedBinCount: 2,
    totalQty: 80,
    status: '진행중',
    notes: '검수는 일부 완료되었고 현재 적재 단계로 넘어간 작업입니다.',
    flow: ['검수', '적재'],
    activeStep: '적재',
    asnStatus: '검수완료',
    stockActivation: false,
    completedAt: '',
    bins: [
      { id: 'B-01', location: 'ZONE-B · RACK-03 · BIN-02', designatedBinCode: 'B-03-02', sku: 'SKU-FD-2001', plannedQty: 40, inspectedQty: '40', inspectNote: '', statusInspect: '완료', confirmBinCode: 'B-03-02', putQty: '40', statusPut: '완료' },
      { id: 'B-02', location: 'ZONE-B · RACK-03 · BIN-03', designatedBinCode: 'B-03-03', sku: 'SKU-FD-2002', plannedQty: 40, inspectedQty: '38', inspectNote: '박스 1개 파손 확인', statusInspect: '완료', confirmBinCode: '', putQty: '', statusPut: '대기' },
    ],
  },
  {
    id: 'IB-2026-0312-04',
    type: '검수&적재',
    sellerCompany: '헬시바스켓',
    refNo: 'ASN-240312-E07',
    assignedBinCount: 3,
    totalQty: 92,
    status: '진행중',
    notes: '검수 단계에서 일부 Bin이 완료된 상태입니다.',
    flow: ['검수', '적재'],
    activeStep: '검수',
    asnStatus: '검수중',
    stockActivation: false,
    completedAt: '',
    bins: [
      { id: 'E-01', location: 'ZONE-E · RACK-01 · BIN-01', designatedBinCode: 'E-01-01', sku: 'SKU-HB-5201', plannedQty: 30, inspectedQty: '30', inspectNote: '', statusInspect: '완료', confirmBinCode: '', putQty: '', statusPut: '대기' },
      { id: 'E-02', location: 'ZONE-E · RACK-01 · BIN-02', designatedBinCode: 'E-01-02', sku: 'SKU-HB-5202', plannedQty: 32, inspectedQty: '31', inspectNote: '1개 수량 차이 확인 필요', statusInspect: '진행중', confirmBinCode: '', putQty: '', statusPut: '대기' },
      { id: 'E-03', location: 'ZONE-E · RACK-02 · BIN-01', designatedBinCode: 'E-02-01', sku: 'SKU-HB-5203', plannedQty: 30, inspectedQty: '', inspectNote: '', statusInspect: '대기', confirmBinCode: '', putQty: '', statusPut: '대기' },
    ],
  },
  {
    id: 'IB-2026-0312-09',
    type: '검수&적재',
    sellerCompany: '오피스존',
    refNo: 'ASN-240312-O02',
    assignedBinCount: 2,
    totalQty: 200,
    status: '진행중',
    notes: '사무용품 대량 입고. 검수 진행 중.',
    flow: ['검수', '적재'],
    activeStep: '검수',
    asnStatus: '검수중',
    stockActivation: false,
    completedAt: '',
    bins: [
      { id: 'O-01', location: 'ZONE-O · RACK-02 · BIN-01', designatedBinCode: 'O-02-01', sku: 'SKU-OZ-7701', plannedQty: 100, inspectedQty: '100', inspectNote: '', statusInspect: '완료', confirmBinCode: '', putQty: '', statusPut: '대기' },
      { id: 'O-02', location: 'ZONE-O · RACK-02 · BIN-02', designatedBinCode: 'O-02-02', sku: 'SKU-OZ-7702', plannedQty: 100, inspectedQty: '', inspectNote: '', statusInspect: '대기', confirmBinCode: '', putQty: '', statusPut: '대기' },
    ],
  },
  {
    id: 'IB-2026-0312-10',
    type: '검수&적재',
    sellerCompany: '캠핑크루',
    refNo: 'ASN-240312-C05',
    assignedBinCount: 3,
    totalQty: 45,
    status: '진행중',
    notes: '캠핑용품 적재 진행 중.',
    flow: ['검수', '적재'],
    activeStep: '적재',
    asnStatus: '검수완료',
    stockActivation: false,
    completedAt: '',
    bins: [
      { id: 'C-05', location: 'ZONE-C · RACK-04 · BIN-01', designatedBinCode: 'C-04-01', sku: 'SKU-CP-2201', plannedQty: 15, inspectedQty: '15', inspectNote: '', statusInspect: '완료', confirmBinCode: 'C-04-01', putQty: '15', statusPut: '완료' },
      { id: 'C-06', location: 'ZONE-C · RACK-04 · BIN-02', designatedBinCode: 'C-04-02', sku: 'SKU-CP-2202', plannedQty: 15, inspectedQty: '15', inspectNote: '', statusInspect: '완료', confirmBinCode: 'C-04-02', putQty: '15', statusPut: '완료' },
      { id: 'C-07', location: 'ZONE-C · RACK-04 · BIN-03', designatedBinCode: 'C-04-03', sku: 'SKU-CP-2203', plannedQty: 15, inspectedQty: '15', inspectNote: '', statusInspect: '완료', confirmBinCode: '', putQty: '', statusPut: '대기' },
    ],
  },
  {
    id: 'IB-2026-0312-11',
    type: '검수&적재',
    sellerCompany: '데일리스니커즈',
    refNo: 'ASN-240312-S08',
    assignedBinCount: 1,
    totalQty: 24,
    status: '진행중',
    notes: '신발 단일 품목. 수량 확인 중.',
    flow: ['검수', '적재'],
    activeStep: '검수',
    asnStatus: '검수중',
    stockActivation: false,
    completedAt: '',
    bins: [
      { id: 'S-01', location: 'ZONE-S · RACK-01 · BIN-08', designatedBinCode: 'S-01-08', sku: 'SKU-SN-6601', plannedQty: 24, inspectedQty: '12', inspectNote: '나머지 12개 찾는 중', statusInspect: '진행중', confirmBinCode: '', putQty: '', statusPut: '대기' },
    ],
  },

  // --- 완료 (5건) ---
  {
    id: 'IB-2026-0311-05',
    type: '검수&적재',
    sellerCompany: '리빙하우스',
    refNo: 'ASN-240311-C09',
    assignedBinCount: 2,
    totalQty: 55,
    status: '완료',
    notes: '적재까지 완료되어 재고 관리에서 조회 가능한 작업입니다.',
    flow: ['검수', '적재'],
    activeStep: '적재 완료',
    asnStatus: '보관중',
    stockActivation: true,
    completedAt: '2026-03-12 09:12',
    bins: [
      { id: 'C-01', location: 'ZONE-C · RACK-01 · BIN-01', designatedBinCode: 'C-01-01', sku: 'SKU-LV-3301', plannedQty: 25, inspectedQty: '25', inspectNote: '', statusInspect: '완료', confirmBinCode: 'C-01-01', putQty: '25', statusPut: '완료' },
      { id: 'C-02', location: 'ZONE-C · RACK-01 · BIN-02', designatedBinCode: 'C-01-02', sku: 'SKU-LV-3302', plannedQty: 30, inspectedQty: '30', inspectNote: '', statusInspect: '완료', confirmBinCode: 'C-01-02', putQty: '30', statusPut: '완료' },
    ],
  },
  {
    id: 'IB-2026-0311-12',
    type: '검수&적재',
    sellerCompany: '북앤스토리',
    refNo: 'ASN-240311-B02',
    assignedBinCount: 1,
    totalQty: 40,
    status: '완료',
    notes: '도서 입고 완료.',
    flow: ['검수', '적재'],
    activeStep: '적재 완료',
    asnStatus: '보관중',
    stockActivation: true,
    completedAt: '2026-03-12 10:05',
    bins: [
      { id: 'B-21', location: 'ZONE-B · RACK-02 · BIN-05', designatedBinCode: 'B-02-05', sku: 'SKU-BK-0001', plannedQty: 40, inspectedQty: '40', inspectNote: '', statusInspect: '완료', confirmBinCode: 'B-02-05', putQty: '40', statusPut: '완료' },
    ],
  },
  {
    id: 'IB-2026-0311-13',
    type: '검수&적재',
    sellerCompany: '그린가든',
    refNo: 'ASN-240311-G01',
    assignedBinCount: 3,
    totalQty: 90,
    status: '완료',
    notes: '원예용품 입고 및 재고 반영 완료.',
    flow: ['검수', '적재'],
    activeStep: '적재 완료',
    asnStatus: '보관중',
    stockActivation: true,
    completedAt: '2026-03-12 11:30',
    bins: [
      { id: 'G-01', location: 'ZONE-G · RACK-01 · BIN-01', designatedBinCode: 'G-01-01', sku: 'SKU-GR-3001', plannedQty: 30, inspectedQty: '30', inspectNote: '', statusInspect: '완료', confirmBinCode: 'G-01-01', putQty: '30', statusPut: '완료' },
      { id: 'G-02', location: 'ZONE-G · RACK-01 · BIN-02', designatedBinCode: 'G-01-02', sku: 'SKU-GR-3002', plannedQty: 30, inspectedQty: '30', inspectNote: '', statusInspect: '완료', confirmBinCode: 'G-01-02', putQty: '30', statusPut: '완료' },
      { id: 'G-03', location: 'ZONE-G · RACK-01 · BIN-03', designatedBinCode: 'G-01-03', sku: 'SKU-GR-3003', plannedQty: 30, inspectedQty: '30', inspectNote: '', statusInspect: '완료', confirmBinCode: 'G-01-03', putQty: '30', statusPut: '완료' },
    ],
  },
  {
    id: 'IB-2026-0311-14',
    type: '검수&적재',
    sellerCompany: '토이월드',
    refNo: 'ASN-240311-W03',
    assignedBinCount: 2,
    totalQty: 60,
    status: '완료',
    notes: '장난감 입고 완료.',
    flow: ['검수', '적재'],
    activeStep: '적재 완료',
    asnStatus: '보관중',
    stockActivation: true,
    completedAt: '2026-03-12 13:15',
    bins: [
      { id: 'W-01', location: 'ZONE-W · RACK-03 · BIN-01', designatedBinCode: 'W-03-01', sku: 'SKU-TW-1201', plannedQty: 30, inspectedQty: '30', inspectNote: '', statusInspect: '완료', confirmBinCode: 'W-03-01', putQty: '30', statusPut: '완료' },
      { id: 'W-02', location: 'ZONE-W · RACK-03 · BIN-02', designatedBinCode: 'W-03-02', sku: 'SKU-TW-1202', plannedQty: 30, inspectedQty: '30', inspectNote: '', statusInspect: '완료', confirmBinCode: 'W-03-02', putQty: '30', statusPut: '완료' },
    ],
  },
  {
    id: 'IB-2026-0311-15',
    type: '검수&적재',
    sellerCompany: '홈피트니스',
    refNo: 'ASN-240311-H04',
    assignedBinCount: 1,
    totalQty: 10,
    status: '완료',
    notes: '운동기구(소도구) 입고 완료.',
    flow: ['검수', '적재'],
    activeStep: '적재 완료',
    asnStatus: '보관중',
    stockActivation: true,
    completedAt: '2026-03-12 14:00',
    bins: [
      { id: 'H-01', location: 'ZONE-H · RACK-02 · BIN-04', designatedBinCode: 'H-02-04', sku: 'SKU-HF-4401', plannedQty: 10, inspectedQty: '10', inspectNote: '', statusInspect: '완료', confirmBinCode: 'H-02-04', putQty: '10', statusPut: '완료' },
    ],
  },
])

// 입고 작업 화면 상태
const tasks = ref(loadInboundTasks())
const selectedTaskId = ref(String(route.query.taskId || tasks.value[0]?.id || ''))
const inboundSubTab = ref('inspect')

// 좌측 목록에서 선택한 입고 작업 상세 데이터
const selectedTask = computed(() => tasks.value.find((task) => task.id === selectedTaskId.value) ?? null)

watch(
  () => route.query.taskId,
  (taskId) => {
    if (!taskId) return
    const matched = tasks.value.find((task) => task.id === String(taskId))
    if (!matched) return
    selectedTaskId.value = matched.id
    inboundSubTab.value = matched.status === '완료' ? 'done' : matched.activeStep === '적재' ? 'put' : 'inspect'
  },
  { immediate: true }
)

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
const totalInspectDoneCount = computed(() => tasks.value.reduce((sum, task) => sum + inspectDone(task), 0))
const totalPutDoneCount = computed(() => tasks.value.reduce((sum, task) => sum + putDone(task), 0))
const stockActivationCount = computed(() =>
  tasks.value.reduce((sum, task) => sum + task.bins.filter((bin) => bin.statusInspect === '완료' && bin.statusPut === '완료').length, 0)
)
const pendingInventoryCount = computed(() => totalPutDoneCount.value - stockActivationCount.value)

// 상단 요약 카드는 대시보드 카드와 같은 톤/구조를 사용
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
  {
    key: 'inventory',
    label: '재고 반영 Bin',
    value: `${stockActivationCount.value} Bin`,
    description: `적재 대기 ${pendingInventoryCount.value} Bin`,
    tone: 'gold',
  },
])

// 우측 상세 패널 상단 요약 카드
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
  return { '검수': 1, '적재': 2, '적재 완료': 3 }[selectedTask.value.activeStep] ?? 1
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

// 현재 선택된 탭에 맞는 작업이 없으면 첫 번째 작업으로 자동 보정
watch(
  [selectedTask, filteredTaskCards, inboundSubTab],
  ([task, cards]) => {
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

// 초기 시드 데이터를 화면용 반응형 데이터로 복제
function cloneSeed(seed) {
  return JSON.parse(JSON.stringify(seed))
}

function loadInboundTasks() {
  if (typeof window === 'undefined') return cloneSeed(INBOUND_TASKS_SEED)
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    if (saved && Array.isArray(saved.inboundTasks)) return saved.inboundTasks
  } catch (error) {
    console.warn('shared inbound parse failed', error)
  }
  return cloneSeed(INBOUND_TASKS_SEED)
}


function refreshFromSharedState() {
  const currentId = selectedTaskId.value
  tasks.value = cloneSeed(loadInboundTasks())
  const matched = tasks.value.find((task) => task.id === currentId)
  if (matched) {
    selectedTaskId.value = matched.id
    inboundSubTab.value = matched.activeStep === '적재' || matched.activeStep === '작업 완료' ? 'put' : 'inspect'
    return
  }
  const first = tasks.value.find((task) => {
    if (inboundSubTab.value === 'inspect') return task.activeStep === '검수'
    return task.activeStep === '적재' || task.activeStep === '작업 완료'
  }) ?? tasks.value[0]
  selectedTaskId.value = first?.id ?? ''
  inboundSubTab.value = first?.activeStep === '적재' || first?.activeStep === '작업 완료' ? 'put' : 'inspect'
}

function handleSharedStateUpdate() {
  refreshFromSharedState()
}

function persistTasks() {
  if (typeof window === 'undefined') return
  let saved = {}
  try {
    saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null') || {}
  } catch (error) {
    saved = {}
  }
  saved.inboundTasks = cloneSeed(tasks.value)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  window.dispatchEvent(new CustomEvent('wh-worker-state-updated'))
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

// 완료 시점 기록용 현재 시간 문자열 생성
function nowStamp() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}

// 작업 상태 우선순위 기준 정렬
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
  tasks.value = cloneSeed(INBOUND_TASKS_SEED)
  inboundSubTab.value = 'inspect'
  selectedTaskId.value = tasks.value.find((task) => task.activeStep === '검수' && task.status !== '완료')?.id ?? ''
  persistTasks()
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

function saveInspect(bin) {
  const task = selectedTask.value
  if (!task) return

  const inspectedQty = String(bin.inspectedQty).trim()
  if (!inspectedQty) return

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
  if (!putQty || !confirmBinCode) return

  bin.statusPut = '완료'
  recomputeTask(task)
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
      if (!String(bin.inspectedQty).trim()) {
        bin.inspectedQty = String(bin.plannedQty)
      }
    }
    bin.statusPut = '완료'
  })

  recomputeTask(task)
  persistTasks()
}
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
      <div class="summary-grid summary-grid--five">
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

.summary-grid--five {
  grid-template-columns: repeat(5, minmax(0, 1fr));
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
  text-align: left;
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