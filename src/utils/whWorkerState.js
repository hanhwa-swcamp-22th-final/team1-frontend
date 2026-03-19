export const WH_WORKER_STORAGE_KEY = 'wh-worker-shared-state-v2'
export const WH_WORKER_STATE_EVENT = 'wh-worker-state-updated'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function defaultInboundTasks() {
  return [
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
        {
          id: 'A-01',
          location: 'ZONE-A · RACK-01 · BIN-01',
          designatedBinCode: 'A-01-01',
          sku: 'SKU-UV-1001',
          plannedQty: 50,
          inspectedQty: '',
          inspectNote: '',
          statusInspect: '대기',
          confirmBinCode: '',
          putQty: '',
          statusPut: '대기',
        },
        {
          id: 'A-02',
          location: 'ZONE-A · RACK-01 · BIN-02',
          designatedBinCode: 'A-01-02',
          sku: 'SKU-UV-1002',
          plannedQty: 60,
          inspectedQty: '',
          inspectNote: '',
          statusInspect: '대기',
          confirmBinCode: '',
          putQty: '',
          statusPut: '대기',
        },
        {
          id: 'A-03',
          location: 'ZONE-A · RACK-02 · BIN-01',
          designatedBinCode: 'A-02-01',
          sku: 'SKU-UV-1003',
          plannedQty: 60,
          inspectedQty: '',
          inspectNote: '',
          statusInspect: '대기',
          confirmBinCode: '',
          putQty: '',
          statusPut: '대기',
        },
      ],
    },
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
        {
          id: 'B-01',
          location: 'ZONE-B · RACK-03 · BIN-02',
          designatedBinCode: 'B-03-02',
          sku: 'SKU-FD-2001',
          plannedQty: 40,
          inspectedQty: '40',
          inspectNote: '',
          statusInspect: '완료',
          confirmBinCode: 'B-03-02',
          putQty: '40',
          statusPut: '완료',
        },
        {
          id: 'B-02',
          location: 'ZONE-B · RACK-03 · BIN-03',
          designatedBinCode: 'B-03-03',
          sku: 'SKU-FD-2002',
          plannedQty: 40,
          inspectedQty: '38',
          inspectNote: '박스 1개 파손 확인',
          statusInspect: '완료',
          confirmBinCode: '',
          putQty: '',
          statusPut: '대기',
        },
      ],
    },
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
        {
          id: 'C-01',
          location: 'ZONE-C · RACK-01 · BIN-01',
          designatedBinCode: 'C-01-01',
          sku: 'SKU-LV-3301',
          plannedQty: 25,
          inspectedQty: '25',
          inspectNote: '',
          statusInspect: '완료',
          confirmBinCode: 'C-01-01',
          putQty: '25',
          statusPut: '완료',
        },
        {
          id: 'C-02',
          location: 'ZONE-C · RACK-01 · BIN-02',
          designatedBinCode: 'C-01-02',
          sku: 'SKU-LV-3302',
          plannedQty: 30,
          inspectedQty: '30',
          inspectNote: '',
          statusInspect: '완료',
          confirmBinCode: 'C-01-02',
          putQty: '30',
          statusPut: '완료',
        },
      ],
    },
  ]
}

function defaultOutboundTasks() {
  return [
    {
      id: 'OB-2026-0312-01',
      type: '피킹&패킹',
      sellerCompany: '어반셀러코리아',
      refNo: 'PICK-240312-701',
      assignedBinCount: 3,
      totalQty: 170,
      status: '대기',
      notes: '배정된 Bin 범위만 피킹합니다. 대기 상태 작업이 우선 노출됩니다.',
      flow: ['피킹', '포장'],
      activeStep: '피킹',
      orderStatus: '피킹대기',
      stockDeduction: false,
      completedAt: '',
      bins: [
        {
          id: '1',
          location: 'ZONE-A · RACK-01 · BIN-01',
          binCode: 'A-01',
          sku: 'SKU-UV-1001',
          orderedQty: 60,
          pickedQty: '',
          pickNote: '',
          statusPick: '대기',
          packedQty: '',
          statusPack: '대기',
        },
        {
          id: '2',
          location: 'ZONE-A · RACK-01 · BIN-02',
          binCode: 'A-02',
          sku: 'SKU-UV-1002',
          orderedQty: 50,
          pickedQty: '',
          pickNote: '',
          statusPick: '대기',
          packedQty: '',
          statusPack: '대기',
        },
        {
          id: '3',
          location: 'ZONE-A · RACK-02 · BIN-01',
          binCode: 'A-03',
          sku: 'SKU-UV-1003',
          orderedQty: 60,
          pickedQty: '',
          pickNote: '',
          statusPick: '대기',
          packedQty: '',
          statusPack: '대기',
        },
      ],
    },
    {
      id: 'OB-2026-0312-02',
      type: '피킹&패킹',
      sellerCompany: '모던키친랩',
      refNo: 'PICK-240312-715',
      assignedBinCount: 2,
      totalQty: 80,
      status: '진행중',
      notes: '피킹이 완료되어 현재 포장 단계로 넘어간 작업입니다.',
      flow: ['피킹', '포장'],
      activeStep: '포장',
      orderStatus: '피킹완료',
      stockDeduction: false,
      completedAt: '',
      bins: [
        {
          id: '1',
          location: 'ZONE-B · RACK-03 · BIN-02',
          binCode: 'B-01',
          sku: 'SKU-FD-2001',
          orderedQty: 40,
          pickedQty: '40',
          pickNote: '',
          statusPick: '완료',
          packedQty: '40',
          statusPack: '완료',
        },
        {
          id: '2',
          location: 'ZONE-B · RACK-03 · BIN-03',
          binCode: 'B-02',
          sku: 'SKU-FD-2002',
          orderedQty: 40,
          pickedQty: '40',
          pickNote: '',
          statusPick: '완료',
          packedQty: '',
          statusPack: '대기',
        },
      ],
    },
    {
      id: 'OB-2026-0311-09',
      type: '피킹&패킹',
      sellerCompany: '펫프렌즈셀렉트',
      refNo: 'PICK-240311-688',
      assignedBinCount: 2,
      totalQty: 9,
      status: '완료',
      notes: '포장과 송장 부착이 완료되어 출고 대기 구역으로 이동된 건입니다.',
      flow: ['피킹', '포장'],
      activeStep: '작업 완료',
      orderStatus: '출고완료',
      stockDeduction: true,
      completedAt: '2026-03-12 10:40',
      bins: [
        {
          id: '1',
          location: 'ZONE-D · RACK-01 · BIN-03',
          binCode: 'D-01',
          sku: 'SKU-PF-9101',
          orderedQty: 4,
          pickedQty: '4',
          pickNote: '',
          statusPick: '완료',
          packedQty: '4',
          statusPack: '완료',
        },
        {
          id: '2',
          location: 'ZONE-D · RACK-01 · BIN-04',
          binCode: 'D-02',
          sku: 'SKU-PF-9102',
          orderedQty: 5,
          pickedQty: '5',
          pickNote: '',
          statusPick: '완료',
          packedQty: '5',
          statusPack: '완료',
        },
      ],
    },
  ]
}

function defaultAlerts() {
  return [
    {
      id: 'ALT-01',
      taskId: 'IB-2026-0312-02',
      level: '주의',
      title: '검수 수량 불일치',
      description: 'SKU-FD-2002가 예정 40개 대비 38개로 확인되었습니다.',
      time: '09:18',
    },
    {
      id: 'ALT-02',
      taskId: 'OB-2026-0312-02',
      level: '확인',
      title: '포장 대기',
      description: '피킹 완료 후 일부 주문이 아직 포장 전입니다.',
      time: '10:05',
    },
    {
      id: 'ALT-03',
      taskId: 'IB-2026-0312-01',
      level: '안내',
      title: '입고 예정 작업 신규 배정',
      description: '오전 입고 작업이 작업자에게 새로 배정되었습니다.',
      time: '10:22',
    },
    {
      id: 'ALT-04',
      taskId: 'OB-2026-0312-01',
      level: '주의',
      title: '출고 우선순위 높음',
      description: '당일 마감 주문 포함 건으로 우선 처리 권장입니다.',
      time: '11:10',
    },
  ]
}

export function createDefaultWorkerState() {
  return {
    inboundTasks: defaultInboundTasks(),
    outboundTasks: defaultOutboundTasks(),
    alerts: defaultAlerts(),
  }
}

function saveState(state) {
  if (typeof window === 'undefined') return clone(state)
  const safeState = clone(state)
  window.localStorage.setItem(WH_WORKER_STORAGE_KEY, JSON.stringify(safeState))
  window.dispatchEvent(new CustomEvent(WH_WORKER_STATE_EVENT))
  return safeState
}

export function loadWorkerState() {
  const defaults = createDefaultWorkerState()
  if (typeof window === 'undefined') return defaults

  try {
    const parsed = JSON.parse(window.localStorage.getItem(WH_WORKER_STORAGE_KEY) || 'null') || {}
    return {
      inboundTasks:
        Array.isArray(parsed.inboundTasks) && parsed.inboundTasks.length
          ? parsed.inboundTasks
          : defaults.inboundTasks,
      outboundTasks:
        Array.isArray(parsed.outboundTasks) && parsed.outboundTasks.length
          ? parsed.outboundTasks
          : defaults.outboundTasks,
      alerts:
        Array.isArray(parsed.alerts) && parsed.alerts.length
          ? parsed.alerts
          : defaults.alerts,
    }
  } catch (error) {
    console.warn('wh worker state parse failed', error)
    return defaults
  }
}

export function updateWorkerState(patch) {
  const current = loadWorkerState()
  return saveState({
    ...current,
    ...clone(patch),
  })
}

export function resetWorkerState() {
  return saveState(createDefaultWorkerState())
}

export function addWorkerStateListeners(handler) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', handler)
  window.addEventListener(WH_WORKER_STATE_EVENT, handler)
  return () => {
    window.removeEventListener('storage', handler)
    window.removeEventListener(WH_WORKER_STATE_EVENT, handler)
  }
}

export function nowStamp() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}

export function createWorkerTaskSummaries(state = loadWorkerState()) {
  const inbound = state.inboundTasks.map((task) => ({
    id: task.id,
    type: '검수&적재',
    sellerCompany: task.sellerCompany,
    refNo: task.refNo,
    assignedBinCount: task.assignedBinCount,
    totalQty: task.totalQty,
    status: task.status,
    currentStep: task.status === '완료' ? '작업 완료' : task.activeStep,
    steps: [
      { key: '검수', label: '검수' },
      { key: '적재', label: '적재' },
      { key: '작업 완료', label: '작업 완료' },
    ],
    referenceStatus: task.asnStatus,
    note: task.notes,
  }))

  const outbound = state.outboundTasks.map((task) => ({
    id: task.id,
    type: '피킹&패킹',
    sellerCompany: task.sellerCompany,
    refNo: task.refNo,
    assignedBinCount: task.assignedBinCount,
    totalQty: task.totalQty,
    status: task.status,
    currentStep: task.status === '완료' ? '작업 완료' : task.activeStep,
    steps: [
      { key: '피킹', label: '피킹' },
      { key: '포장', label: '포장' },
      { key: '작업 완료', label: '작업 완료' },
    ],
    referenceStatus: task.orderStatus,
    note: task.notes,
  }))

  return [...inbound, ...outbound].sort((a, b) => {
    const statusRank = { 대기: 0, 진행중: 1, 완료: 2 }
    const typeRank = { '검수&적재': 0, '피킹&패킹': 1 }
    return (
      (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99) ||
      (typeRank[a.type] ?? 99) - (typeRank[b.type] ?? 99) ||
      a.id.localeCompare(b.id)
    )
  })
}

export function createWorkerAlerts(state = loadWorkerState()) {
  return clone(state.alerts)
}

export function createWorkerDashboardTasks(state = loadWorkerState()) {
  const inbound = state.inboundTasks.map((task) => ({
    id: task.id,
    type: '검수&적재',
    sellerCompany: task.sellerCompany,
    refNo: task.refNo,
    assignedBinCount: task.assignedBinCount,
    totalQty: task.totalQty,
    status: task.status,
    notes: task.notes,
    activeStep: task.activeStep,
    flow: task.flow,
    referenceStatus: task.asnStatus,
    completedAt: task.completedAt,
    bins: task.bins,
  }))

  const outbound = state.outboundTasks.map((task) => ({
    id: task.id,
    type: '피킹&패킹',
    sellerCompany: task.sellerCompany,
    refNo: task.refNo,
    assignedBinCount: task.assignedBinCount,
    totalQty: task.totalQty,
    status: task.status,
    notes: task.notes,
    activeStep: task.activeStep,
    flow: ['피킹', '포장', '작업 완료'],
    referenceStatus: task.orderStatus,
    completedAt: task.completedAt,
    packOrders: task.bins.map((bin, index) => ({
      orderNo: `${task.refNo}-${index + 1}`,
      statusPick: bin.statusPick,
      statusPack: bin.statusPack,
    })),
  }))

  return [...inbound, ...outbound].sort((a, b) => {
    const statusRank = { 대기: 0, 진행중: 1, 완료: 2 }
    const typeRank = { '검수&적재': 0, '피킹&패킹': 1 }
    return (
      (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99) ||
      (typeRank[a.type] ?? 99) - (typeRank[b.type] ?? 99) ||
      a.refNo.localeCompare(b.refNo)
    )
  })
}

export function createInventoryRows(state = loadWorkerState()) {
  const rows = []

  state.inboundTasks.forEach((task) => {
    task.bins.forEach((bin) => {
      const reflected = task.stockActivation && bin.statusPut === '완료'
      rows.push({
        refNo: task.refNo,
        sellerCompany: task.sellerCompany,
        sku: bin.sku,
        location: bin.designatedBinCode,
        inspectedQty: Number(bin.inspectedQty || 0),
        putQty: Number(bin.putQty || 0),
        stockStatus: reflected ? '반영 완료' : '반영 대기',
        reflected,
        updatedAt: task.completedAt || '',
      })
    })
  })

  return rows
}
