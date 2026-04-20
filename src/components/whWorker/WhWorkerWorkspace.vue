<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { getWhWorkerTasks, updateWhWorkerTask } from '@/api/wms'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  view: {
    type: String,
    required: true,
    validator: (value) => ['myWork', 'inboundManage', 'outboundManage'].includes(value),
  },
})

const loading = ref(false)
const workerRecords = ref([])
const toastVisible = ref(false)
const toastMessage = ref('')
let toastTimer = null
const auth = useAuthStore()

const tabs = reactive({
  inboundWork: '검수',
  outboundWork: '피킹',
  inboundManage: '전체',
  outboundManage: '전체',
  inboundException: '검수',
  outboundException: '피킹',
  inboundExceptionFilter: '전체',
  outboundExceptionFilter: '전체',
})

const search = reactive({
  inboundManage: '',
  outboundManage: '',
  inboundException: '',
  outboundException: '',
  inboundHistory: '',
  outboundHistory: '',
})

const modal = reactive({
  mode: '',
  task: null,
  actualQty: '',
  actualBin: '',
  exceptionType: '',
  reason: '',
})

const viewMeta = computed(() => ({
  myWork: {
    title: '내 작업',
    desc: '나에게 배정된 작업을 바로 열어서 검수·적재·피킹·패킹을 처리합니다.',
    chip: `오늘 배정 ${assignedTasks.value.length}건`,
  },
  inboundManage: {
    title: '입고관리',
    desc: '완료된 입고 작업을 검색하고, 잘못 처리된 건을 수정하며 예외를 다시 확인합니다.',
    chip: `완료 입고 ${completedInboundTasks.value.length}건`,
  },
  outboundManage: {
    title: '출고관리',
    desc: '완료된 출고 작업을 검색하고, 잘못 처리된 건을 수정하며 예외를 다시 확인합니다.',
    chip: `완료 출고 ${completedOutboundTasks.value.length}건`,
  },
}[props.view]))

const breadcrumb = computed(() => [{ label: 'CONK' }, { label: 'WH Worker' }, { label: viewMeta.value.title }])

watch(
  () => tabs.inboundException,
  (value) => {
    const allowed = value === '검수'
      ? ['전체', '수량 불일치', '파손', '누락', '오입고']
      : ['전체', 'Bin 불일치', '적재 수량 불일치', '위치 혼선']
    if (!allowed.includes(tabs.inboundExceptionFilter)) tabs.inboundExceptionFilter = '전체'
  }
)

watch(
  () => tabs.outboundException,
  (value) => {
    const allowed = value === '피킹'
      ? ['전체', '수량 부족', '수량 초과', '재고 불일치', '상품 없음']
      : ['전체', '패킹 불일치', '누락', '오포장']
    if (!allowed.includes(tabs.outboundExceptionFilter)) tabs.outboundExceptionFilter = '전체'
  }
)

onMounted(loadTasks)

function resolveWorkerTaskId() {
  return auth.user?.workerCode || auth.user?.id || ''
}

async function loadTasks() {
  loading.value = true
  try {
    const workerAccountId = resolveWorkerTaskId()
    if (!workerAccountId) {
      workerRecords.value = []
      toast('작업자 계정 정보를 확인할 수 없습니다.')
      return
    }

    const { data } = await getWhWorkerTasks({ workerAccountId })
    workerRecords.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('WH Worker 데이터 로드 실패', error)
    workerRecords.value = []
    toast('창고작업자 데이터를 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

function parseNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isNaN(number) ? null : number
}

function toText(value) {
  return value === null || value === undefined ? '' : String(value)
}

function nowStamp() {
  const date = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function outboundActiveStage(step) {
  if (step === '포장 검수') return '패킹'
  if (step === '작업 완료') return '패킹'
  return '피킹'
}

function isInboundInspectDone(bin) {
  return bin.statusInspect === '완료' || parseNumber(bin.inspectedQty) !== null
}

function isInboundPutDone(bin) {
  return bin.statusPut === '완료' || parseNumber(bin.putQty) !== null
}

function isOutboundPickDone(bin) {
  return bin.statusPick === '완료' || parseNumber(bin.pickedQty) !== null
}

function getOutboundOrderNo(record, bin) {
  if (bin.orderNo) return bin.orderNo
  const matchedOrder = record.packOrders.find((order) => {
    if (bin.orderNo && order.orderNo) return order.orderNo === bin.orderNo
    return order.sku === bin.sku
  })
  return matchedOrder?.orderNo || ''
}

function getOutboundOrderLines(record, targetOrder) {
  return record.packOrders.filter((item) => item.orderNo === targetOrder.orderNo)
}

function getOutboundBinsForOrderLine(record, order) {
  const orderMatchedBins = record.bins.filter((bin) => order.orderNo && bin.orderNo && bin.orderNo === order.orderNo)
  if (orderMatchedBins.length) return orderMatchedBins
  return record.bins.filter((bin) => bin.sku === order.sku)
}

function isOutboundOrderReadyForPack(record, targetOrder) {
  const orderLines = getOutboundOrderLines(record, targetOrder)
  if (!orderLines.length) return false

  return orderLines.every((orderLine) => {
    const lineBins = getOutboundBinsForOrderLine(record, orderLine)
    if (!lineBins.length) return false
    return lineBins.every(isOutboundPickDone)
  })
}

function inferStageExceptionType(kind, stage, qty, actualQty, reason, targetBin = '', actualBin = '') {
  if (kind === '입고' && stage === '검수') {
    if (reason && ['파손', '누락', '오입고', '수량 불일치'].some((item) => reason.includes(item))) {
      return ['수량 불일치', '파손', '누락', '오입고'].find((item) => reason.includes(item)) || ''
    }
    if (actualQty !== null && actualQty !== qty) return '수량 불일치'
    return ''
  }
  if (kind === '입고' && stage === '적재') {
    if (actualBin && targetBin && actualBin !== targetBin) return 'Bin 불일치'
    if (actualQty !== null && actualQty !== qty) return '적재 수량 불일치'
    return ''
  }
  if (kind === '출고' && stage === '피킹') {
    if (reason && reason.includes('상품 없음')) return '상품 없음'
    if (actualQty !== null && actualQty < qty) return '수량 부족'
    if (actualQty !== null && actualQty > qty) return '수량 초과'
    if (actualQty !== null && actualQty !== qty) return '재고 불일치'
    return ''
  }
  if (kind === '출고' && stage === '패킹') {
    if (reason && reason.includes('오포장')) return '오포장'
    if (reason && reason.includes('누락')) return '누락'
    if (actualQty !== null && actualQty !== qty) return '패킹 불일치'
    return ''
  }
  return ''
}

function buildFlatTask(base) {
  const exceptionType = base.exceptionType || inferStageExceptionType(
    base.kind,
    base.stage,
    base.qty,
    base.actualQty,
    base.reason,
    base.targetBin,
    base.actualBin
  )
  const hasException = !!exceptionType || (
    base.stage === '적재'
      ? ((base.actualQty !== null && base.actualQty !== base.qty) || (!!base.actualBin && !!base.targetBin && base.actualBin !== base.targetBin))
      : (base.actualQty !== null && base.actualQty !== base.qty)
  )
  return {
    edited: false,
    note: '',
    ...base,
    exceptionType,
    hasException,
  }
}

function normalizeWorkerStage(stage) {
  return ({
    검수: 'INSPECTION',
    적재: 'PUTAWAY',
    피킹: 'PICKING',
    패킹: 'PACKING',
  })[stage] || stage
}

function parseDetailKey(detailKey = '') {
  const [orderId = '', skuId = '', locationId = ''] = String(detailKey).split('::')
  return { orderId, skuId, locationId }
}

function parseInboundDetailKey(detailKey = '') {
  const [asnId = '', skuId = '', locationId = ''] = String(detailKey).split('::')
  return { asnId, skuId, locationId }
}

function buildWorkerTaskPayload(task, overrides = {}) {
  const workerAccountId = resolveWorkerTaskId()
  const basePayload = {
    workerAccountId,
    stage: normalizeWorkerStage(task.stage),
    actualQuantity: overrides.actualQuantity ?? task.actualQty ?? task.qty ?? 0,
    actualBin: overrides.actualBin ?? task.actualBin ?? '',
    exceptionType: overrides.exceptionType ?? task.exceptionType ?? '',
    issueNote: overrides.issueNote ?? task.reason ?? '',
    orderId: '',
    asnId: '',
    skuId: task.sku ?? '',
    locationId: task.locationId ?? '',
  }

  if (task.kind === '입고') {
    const parsed = parseInboundDetailKey(task.sourceId)
    return {
      ...basePayload,
      asnId: parsed.asnId,
      skuId: parsed.skuId || basePayload.skuId,
      locationId: parsed.locationId || basePayload.locationId,
      orderId: '',
    }
  }

  const parsed = parseDetailKey(task.sourceId)
  return {
    ...basePayload,
    orderId: parsed.orderId || task.orderNo || '',
    skuId: parsed.skuId || basePayload.skuId,
    locationId: parsed.locationId || basePayload.locationId,
    asnId: '',
  }
}

function compareTaskOrder(a, b) {
  const aAssigned = a.assigned ? 0 : 1
  const bAssigned = b.assigned ? 0 : 1
  if (aAssigned !== bAssigned) return aAssigned - bAssigned
  const statusOrder = { 대기: 0, 진행중: 1, 완료: 2 }
  const statusDiff = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
  if (statusDiff !== 0) return statusDiff
  return (a.routeOrder ?? 0) - (b.routeOrder ?? 0)
}

const taskCollections = computed(() => {
  const rows = []
  workerRecords.value.forEach((record) => {
    if (record.category === 'INBOUND') {
      record.bins.forEach((bin, index) => {
        const plannedQty = parseNumber(bin.plannedQty) ?? 0
        const inspectedQty = parseNumber(bin.inspectedQty)
        const putQty = parseNumber(bin.putQty)
        const inspectDone = isInboundInspectDone(bin)
        const inspectStatus = inspectDone
          ? '완료'
          : record.status === '진행중'
            ? '진행중'
            : '대기'

        rows.push(buildFlatTask({
          id: `${record.id}::inspect::${bin.id}`,
          parentId: record.id,
          sourceId: bin.id,
          sourceType: 'bin',
          locationId: bin.location,
          kind: '입고',
          stage: '검수',
          status: inspectStatus,
          seller: record.sellerCompany,
          warehouseName: record.warehouseName,
          docNo: record.refNo,
          pickNo: '',
          orderNo: '',
          bin: bin.designatedBinCode || bin.location,
          sku: bin.sku,
          qty: plannedQty,
          expectedQty: plannedQty,
          actualQty: inspectedQty,
          targetBin: bin.designatedBinCode || '',
          actualBin: '',
          reason: toText(bin.inspectNote),
          exceptionType: toText(bin.inspectExceptionType),
          assigned: !inspectDone && record.status !== '완료',
          completedAt: toText(bin.statusInspectAt || record.completedAt),
          edited: !!bin.inspectEdited,
          note: record.notes || '',
          routeOrder: bin.routeOrder ?? index + 1,
        }))

        const putBaseQty = inspectedQty ?? plannedQty
        const putDone = isInboundPutDone(bin)
        const putReady = inspectDone
        const putStatus = putDone
          ? '완료'
          : putReady
            ? '진행중'
            : '대기'
        const putVisible = record.status === '완료' || putReady || putDone || toText(bin.confirmedBinCode) || !!bin.putExceptionType || !!bin.putNote

        if (putVisible) {
          rows.push(buildFlatTask({
            id: `${record.id}::put::${bin.id}`,
            parentId: record.id,
            sourceId: bin.id,
            sourceType: 'bin',
            locationId: bin.location,
            kind: '입고',
            stage: '적재',
            status: putStatus,
            seller: record.sellerCompany,
            warehouseName: record.warehouseName,
            docNo: record.refNo,
            pickNo: '',
            orderNo: '',
            bin: bin.designatedBinCode || bin.location,
            sku: bin.sku,
            qty: putBaseQty,
            expectedQty: putBaseQty,
            actualQty: putQty,
            targetBin: bin.designatedBinCode || '',
            actualBin: toText(bin.confirmedBinCode),
            reason: toText(bin.putNote),
            exceptionType: toText(bin.putExceptionType),
            assigned: putReady && !putDone && record.status !== '완료',
            completedAt: toText(bin.statusPutAt || record.completedAt),
            edited: !!bin.putEdited,
            note: record.notes || '',
            routeOrder: bin.routeOrder ?? index + 1,
          }))
        }
      })
      return
    }

    record.bins.forEach((bin, index) => {
      const orderedQty = parseNumber(bin.orderedQty) ?? 0
      const pickedQty = parseNumber(bin.pickedQty)
      const pickDone = isOutboundPickDone(bin)
      const pickStatus = pickDone
        ? '완료'
        : record.status === '진행중'
          ? '진행중'
          : '대기'

      rows.push(buildFlatTask({
        id: `${record.id}::pick::${bin.id}`,
        parentId: record.id,
        sourceId: bin.id,
        sourceType: 'bin',
        locationId: bin.location,
        kind: '출고',
        stage: '피킹',
        status: pickStatus,
        seller: record.sellerCompany,
        warehouseName: record.warehouseName,
        docNo: record.refNo,
        pickNo: record.refNo,
        orderNo: getOutboundOrderNo(record, bin),
        bin: bin.binCode || bin.location,
        sku: bin.sku,
        qty: orderedQty,
        expectedQty: orderedQty,
        actualQty: pickedQty,
        targetBin: bin.binCode || '',
        actualBin: '',
        reason: toText(bin.pickReason),
        exceptionType: toText(bin.pickExceptionType),
        assigned: !pickDone && record.status !== '완료',
        completedAt: toText(bin.statusPickAt || record.completedAt),
        edited: !!bin.pickEdited,
        note: record.notes || '',
        routeOrder: bin.routeOrder ?? index + 1,
      }))
    })

    record.packOrders.forEach((order, index) => {
      const packQty = parseNumber(order.actualPickedQty) ?? parseNumber(order.orderedQty) ?? 0
      const verifiedQty = parseNumber(order.verifiedQty)
      const packDone = order.statusPack === '완료' || verifiedQty !== null || record.status === '완료'
      const packReady = isOutboundOrderReadyForPack(record, order)
      const packStatus = packDone
        ? '완료'
        : packReady
          ? '진행중'
          : '대기'
      const packVisible = record.status === '완료' || packReady || packDone || !!order.packReason || !!order.packExceptionType

      if (packVisible) {
        rows.push(buildFlatTask({
          id: `${record.id}::pack::${order.id}`,
          parentId: record.id,
          sourceId: order.id,
          sourceType: 'pack',
          locationId: parseDetailKey(order.id).locationId,
          kind: '출고',
          stage: '패킹',
          status: packStatus,
          seller: record.sellerCompany,
          warehouseName: record.warehouseName,
          docNo: record.refNo,
          pickNo: record.refNo,
          orderNo: order.orderNo,
          bin: '-',
          sku: order.sku,
          qty: packQty,
          expectedQty: packQty,
          actualQty: verifiedQty,
          targetBin: '',
          actualBin: '',
          reason: toText(order.packReason),
          exceptionType: toText(order.packExceptionType),
          assigned: packReady && !packDone && record.status !== '완료',
          completedAt: toText(order.statusPackAt || record.completedAt),
          edited: !!order.packEdited,
          note: record.notes || '',
          routeOrder: index + 1,
        }))
      }
    })
  })

  rows.sort(compareTaskOrder)

  const assignedTasks = []
  const completedInboundTasks = []
  const completedOutboundTasks = []
  const exceptionEntries = []
  const seedLogsByParent = {}
  const summary = {
    total: 0,
    waiting: 0,
    inProgress: 0,
    withException: 0,
  }

  rows.forEach((task) => {
    if (task.assigned) {
      assignedTasks.push(task)
      summary.total += 1
      if (task.status === '대기') summary.waiting += 1
      if (task.status === '진행중') summary.inProgress += 1
      if (task.hasException) summary.withException += 1
    }

    if (task.kind === '입고' && task.status === '완료') {
      completedInboundTasks.push(task)
    }

    if (task.kind === '출고' && task.status === '완료') {
      completedOutboundTasks.push(task)
    }

    if (task.status === '완료' && task.hasException) {
      const exceptionEntry = buildExceptionEntryFromRow(task)
      if (exceptionEntry) exceptionEntries.push(exceptionEntry)
    }

    if (task.status === '완료' && (task.edited || task.hasException)) {
      if (!seedLogsByParent[task.parentId]) seedLogsByParent[task.parentId] = []
      seedLogsByParent[task.parentId].push(buildSeedLogFromTask(task))
    }
  })

  exceptionEntries.sort((a, b) => (b.time || '').localeCompare(a.time || ''))

  return {
    flatTasks: rows,
    assignedTasks,
    completedInboundTasks,
    completedOutboundTasks,
    exceptionEntries,
    seedLogsByParent,
    summary,
  }
})

const assignedTasks = computed(() => taskCollections.value.assignedTasks)
const completedInboundTasks = computed(() => taskCollections.value.completedInboundTasks)
const completedOutboundTasks = computed(() => taskCollections.value.completedOutboundTasks)

const summaryCards = computed(() => {
  const summary = taskCollections.value.summary
  return [
    ['오늘 배정 작업', summary.total],
    ['대기', summary.waiting],
    ['진행중', summary.inProgress],
    ['예외 포함', summary.withException],
  ]
})

const inboundWorkTasks = computed(() => assignedTasks.value.filter((task) => task.kind === '입고' && task.stage === tabs.inboundWork))
const outboundWorkTasks = computed(() => assignedTasks.value.filter((task) => task.kind === '출고' && task.stage === tabs.outboundWork))

function matchText(values, keyword) {
  if (!keyword) return true
  return values
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(keyword.toLowerCase()))
}

const inboundManageRows = computed(() => completedInboundTasks.value
  .filter((task) => tabs.inboundManage === '전체' ? true : task.stage === tabs.inboundManage)
  .filter((task) => matchText([task.docNo, task.seller, task.bin, task.sku, task.stage, task.reason], search.inboundManage)))

const outboundManageRows = computed(() => completedOutboundTasks.value
  .filter((task) => tabs.outboundManage === '전체' ? true : task.stage === tabs.outboundManage)
  .filter((task) => matchText([task.pickNo, task.orderNo, task.seller, task.bin, task.sku, task.stage, task.reason], search.outboundManage)))

function buildExceptionEntryFromRow(task) {
  if (!task.hasException || task.actualQty === null) return null
  return {
    taskId: task.id,
    area: task.kind,
    stage: task.stage,
    type: task.exceptionType || inferStageExceptionType(task.kind, task.stage, task.qty, task.actualQty, task.reason, task.targetBin, task.actualBin),
    seller: task.seller,
    docNo: task.docNo,
    pickNo: task.pickNo,
    orderNo: task.orderNo,
    bin: task.bin,
    sku: task.sku,
    content: task.kind === '입고'
      ? (task.stage === '검수'
        ? `예정 ${task.qty} / 실검수 ${task.actualQty}`
        : `지정 BIN ${task.targetBin || task.bin} / 실제 입력 BIN ${task.actualBin || '-'}${task.actualQty !== task.qty ? ` · 기준 ${task.qty} / 실제 ${task.actualQty}` : ''}`)
      : (task.stage === '피킹'
        ? `예정 ${task.qty} / 실제 ${task.actualQty}`
        : `주문 ${task.qty} / 패킹 ${task.actualQty}`),
    reason: task.reason || '사유 미입력',
    time: task.completedAt || nowStamp(),
  }
}

function buildSeedLogFromTask(task) {
  return {
    area: task.kind,
    stage: task.stage,
    kind: task.hasException ? '예외 등록' : '완료건 수정',
    docLabel: task.kind === '입고' ? task.docNo : `${task.pickNo}${task.orderNo ? ` · ${task.orderNo}` : ''}`,
    seller: task.seller,
    target: task.stage === '패킹' ? `주문 ${task.orderNo} · ${task.sku}` : `Bin ${task.bin} · ${task.sku}`,
    message: task.hasException
      ? `${task.stage} ${task.actualQty ?? task.qty}/${task.qty}EA 처리 · ${task.exceptionType || '예외'}`
      : `수량 ${task.actualQty ?? task.qty}EA 기준으로 수정됨`,
    reason: task.reason || '사유 미입력',
    time: task.completedAt || nowStamp(),
  }
}

const exceptionEntries = computed(() => taskCollections.value.exceptionEntries)

const inboundExceptionRows = computed(() => exceptionEntries.value
  .filter((entry) => entry.area === '입고' && entry.stage === tabs.inboundException)
  .filter((entry) => tabs.inboundExceptionFilter === '전체' ? true : entry.type === tabs.inboundExceptionFilter)
  .filter((entry) => matchText([entry.docNo, entry.seller, entry.bin, entry.sku, entry.type, entry.reason], search.inboundException)))

const outboundExceptionRows = computed(() => exceptionEntries.value
  .filter((entry) => entry.area === '출고' && entry.stage === tabs.outboundException)
  .filter((entry) => tabs.outboundExceptionFilter === '전체' ? true : entry.type === tabs.outboundExceptionFilter)
  .filter((entry) => matchText([entry.pickNo, entry.orderNo, entry.seller, entry.bin, entry.sku, entry.type, entry.reason], search.outboundException)))

function seedLogsFromRecord(record) {
  return taskCollections.value.seedLogsByParent[record.id] || []
}

const historyEntries = computed(() => {
  const logs = workerRecords.value.flatMap((record) => {
    if (Array.isArray(record.workerLogs) && record.workerLogs.length) return record.workerLogs
    return seedLogsFromRecord(record)
  })
  return logs.slice().sort((a, b) => (b.time || '').localeCompare(a.time || ''))
})

const inboundHistoryRows = computed(() => historyEntries.value
  .filter((log) => log.area === '입고')
  .filter((log) => log.kind !== '작업 완료')
  .filter((log) => matchText([log.kind, log.stage, log.docLabel, log.seller, log.target, log.message, log.reason, log.time], search.inboundHistory)))

const outboundHistoryRows = computed(() => historyEntries.value
  .filter((log) => log.area === '출고')
  .filter((log) => log.kind !== '작업 완료')
  .filter((log) => matchText([log.kind, log.stage, log.docLabel, log.seller, log.target, log.message, log.reason, log.time], search.outboundHistory)))

const inboundExceptionFilters = computed(() => tabs.inboundException === '검수'
  ? ['전체', '수량 불일치', '파손', '누락', '오입고']
  : ['전체', 'Bin 불일치', '적재 수량 불일치', '위치 혼선'])

const outboundExceptionFilters = computed(() => tabs.outboundException === '피킹'
  ? ['전체', '수량 부족', '수량 초과', '재고 불일치', '상품 없음']
  : ['전체', '패킹 불일치', '누락', '오포장'])

function statusClass(status) {
  return status === '완료' ? 'done' : status === '진행중' ? 'progress' : 'wait'
}

function historyBadgeClass(kind) {
  return ['검수 완료', '적재 완료', '피킹 완료', '패킹 완료', '예외 해제'].includes(kind)
    ? 'done'
    : (kind.includes('예외') ? 'exception' : 'edited')
}

function resetSearch(key) {
  search[key] = ''
}

function openProcessModal(task) {
  modal.mode = 'process'
  modal.task = task
  modal.actualQty = task.actualQty ?? task.qty
  modal.actualBin = task.actualBin || task.targetBin || task.bin || ''
  modal.exceptionType = task.exceptionType || ''
  modal.reason = task.reason || ''
}

function openEditModal(task) {
  modal.mode = 'edit'
  modal.task = task
  modal.actualQty = task.actualQty ?? task.qty
  modal.actualBin = task.actualBin || task.targetBin || task.bin || ''
  modal.exceptionType = task.exceptionType || (task.hasException ? '정상' : '')
  modal.reason = ''
}

function closeModal() {
  modal.mode = ''
  modal.task = null
  modal.actualQty = ''
  modal.actualBin = ''
  modal.exceptionType = ''
  modal.reason = ''
}

const editModeHasExistingException = computed(() => modal.mode === 'edit' && !!modal.task?.hasException)
const modalAllowsEmptySelection = computed(() => !editModeHasExistingException.value)

const modalOptions = computed(() => {
  if (!modal.task) return []

  let options = []
  if (modal.task.kind === '입고' && modal.task.stage === '검수') options = ['수량 불일치', '파손', '누락', '오입고']
  else if (modal.task.kind === '입고' && modal.task.stage === '적재') options = ['Bin 불일치', '적재 수량 불일치', '위치 혼선']
  else if (modal.task.kind === '출고' && modal.task.stage === '피킹') options = ['수량 부족', '수량 초과', '재고 불일치', '상품 없음']
  else if (modal.task.kind === '출고' && modal.task.stage === '패킹') options = ['패킹 불일치', '누락', '오포장']

  return editModeHasExistingException.value ? ['정상', ...options] : options
})

function toast(message) {
  toastMessage.value = message
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 2200)
}

function cloneRecord(record) {
  return JSON.parse(JSON.stringify(record))
}

function appendLog(record, payload) {
  const next = Array.isArray(record.workerLogs) ? record.workerLogs.slice() : []
  next.unshift({ time: nowStamp(), ...payload })
  record.workerLogs = next.slice(0, 30)
}

async function saveModal() {
  if (!modal.task) return
  if (modal.mode === 'process') {
    await saveProcessModal()
    return
  }
  await saveEditModal()
}

async function persistRecord(record, task, payloadOverrides = {}) {
  await updateWhWorkerTask(record.id, buildWorkerTaskPayload(task, payloadOverrides))
  const index = workerRecords.value.findIndex((item) => item.id === record.id)
  if (index !== -1) workerRecords.value.splice(index, 1, record)
}

async function saveProcessModal() {
  const task = modal.task
  const actual = Number(modal.actualQty || 0)
  const reason = modal.reason.trim()
  const selectedType = modal.exceptionType
  const actualBin = modal.actualBin.trim()
  const binMismatch = task.kind === '입고' && task.stage === '적재' && actualBin !== (task.targetBin || task.bin)
  const qtyMismatch = actual !== task.qty
  const hasManualException = !!selectedType
  const requiresType = (task.kind === '입고' && task.stage === '검수') || (task.kind === '출고' && task.stage === '피킹')

  if (requiresType && qtyMismatch && !selectedType) {
    toast('예외가 있으면 예외 유형을 선택해야 합니다.')
    return
  }
  if ((qtyMismatch || binMismatch || hasManualException) && !reason) {
    toast('예외나 불일치가 있으면 사유를 입력해야 합니다.')
    return
  }

  const record = cloneRecord(workerRecords.value.find((item) => item.id === task.parentId))
  if (!record) return
  const now = nowStamp()
  const hasException = qtyMismatch || binMismatch || hasManualException

  let shouldSwitchInboundToPut = false
  let shouldSwitchOutboundToPack = false

  if (task.kind === '입고') {
    const bin = record.bins.find((item) => item.id === task.sourceId)
    if (!bin) return
    if (task.stage === '검수') {
      bin.inspectedQty = String(actual)
      bin.inspectNote = reason
      bin.inspectExceptionType = selectedType || ''
      bin.statusInspect = '완료'
      bin.statusInspectAt = now

      const allInspected = record.bins.every(isInboundInspectDone)
      record.status = '진행중'
      record.activeStep = allInspected ? '적재' : '검수'
      record.asnStatus = allInspected ? '검수완료' : '입고검수중'
      shouldSwitchInboundToPut = true
    } else {
      bin.putQty = String(actual)
      bin.confirmedBinCode = actualBin
      bin.putNote = reason
      bin.putExceptionType = selectedType || ''
      bin.statusPut = '완료'
      bin.statusPutAt = now
      const allPutDone = record.bins.every(isInboundPutDone)
      record.status = allPutDone ? '완료' : '진행중'
      record.activeStep = allPutDone ? '적재 완료' : '적재'
      record.asnStatus = allPutDone ? '보관중' : '적재중'
      if (allPutDone) {
        record.stockActivation = true
        record.completedAt = now
      }
    }
  } else {
    if (task.stage === '피킹') {
      const bin = record.bins.find((item) => item.id === task.sourceId)
      if (!bin) return
      bin.pickedQty = String(actual)
      bin.pickReason = reason
      bin.pickExceptionType = selectedType || ''
      bin.statusPick = '완료'
      bin.statusPickAt = now

      const impactedOrders = record.packOrders.filter((order) => {
        if (bin.orderNo && order.orderNo) return order.orderNo === bin.orderNo
        return order.sku === bin.sku
      })
      impactedOrders.forEach((order) => {
        order.actualPickedQty = actual
      })

      const allPicked = record.bins.every(isOutboundPickDone)
      shouldSwitchOutboundToPack = impactedOrders.some((order) => isOutboundOrderReadyForPack(record, order))
      record.status = '진행중'
      record.activeStep = allPicked ? '패킹' : '피킹'
      record.orderStatus = allPicked ? '패킹대기' : '피킹중'
    } else {
      const order = record.packOrders.find((item) => item.id === task.sourceId)
      if (!order) return
      order.verifiedQty = String(actual)
      order.packReason = reason
      order.packExceptionType = selectedType || ''
      order.statusPack = '완료'
      order.statusPackAt = now
      const allPacked = record.packOrders.every((item) => parseNumber(item.verifiedQty) !== null || item.statusPack === '완료')
      record.status = allPacked ? '완료' : '진행중'
      record.activeStep = allPacked ? '작업 완료' : '패킹'
      record.orderStatus = allPacked ? '출고완료' : '패킹중'
      if (allPacked) {
        record.stockDeduction = true
        record.completedAt = now
      }
    }
  }

  const nextStageLabel = shouldSwitchInboundToPut ? '적재' : (shouldSwitchOutboundToPack ? '패킹' : '')

  if (hasException) {
    const exceptionType = selectedType || inferStageExceptionType(
      task.kind,
      task.stage,
      task.qty,
      actual,
      reason,
      task.targetBin,
      actualBin
    )
    const message = task.kind === '입고'
      ? (task.stage === '검수'
        ? `예정 ${task.qty} / 실검수 ${actual}`
        : `지정 BIN ${task.targetBin || task.bin} / 실제 입력 BIN ${actualBin || '-'}${actual !== task.qty ? ` · 기준 ${task.qty} / 실제 ${actual}` : ''}`)
      : (task.stage === '피킹'
        ? `예정 ${task.qty} / 실제 ${actual}`
        : `주문 ${task.qty} / 패킹 ${actual}`)

    appendLog(record, {
      area: task.kind,
      stage: task.stage,
      kind: '예외 등록',
      docLabel: task.kind === '입고' ? task.docNo : `${task.pickNo}${task.orderNo ? ` · ${task.orderNo}` : ''}`,
      seller: task.seller,
      target: task.stage === '패킹' ? `${task.sku}` : `Bin ${task.bin} · ${task.sku}`,
      message: exceptionType ? `${message}` : message,
      reason: reason || '사유 미입력',
    })
  } else {
    appendLog(record, {
      area: task.kind,
      stage: task.stage,
      kind: `${task.stage} 완료`,
      docLabel: task.kind === '입고' ? task.docNo : `${task.pickNo}${task.orderNo ? ` · ${task.orderNo}` : ''}`,
      seller: task.seller,
      target: task.stage === '패킹' ? `${task.sku}` : `Bin ${task.bin} · ${task.sku}`,
      message: `${task.stage} 단계 ${actual}EA 처리${nextStageLabel ? ` · 다음 단계 ${nextStageLabel} 생성` : ''}`,
      reason: reason || '정상 처리',
    })
  }

  await persistRecord(record, task, {
    actualQuantity: actual,
    actualBin,
    exceptionType: selectedType || '',
    issueNote: reason,
  })

  if (shouldSwitchInboundToPut) {
    tabs.inboundWork = '적재'
    if (hasException) {
      tabs.inboundException = '검수'
      tabs.inboundExceptionFilter = '전체'
    }
  }

  if (shouldSwitchOutboundToPack) {
    tabs.outboundWork = '패킹'
    if (hasException) {
      tabs.outboundException = '피킹'
      tabs.outboundExceptionFilter = '전체'
    }
  }

  closeModal()
  toast(nextStageLabel ? `${task.kind} ${task.stage} 완료 · ${nextStageLabel} 작업으로 이동되었습니다.` : `${task.kind} ${task.stage} 작업이 완료되었습니다.`)
}

function syncDownstreamAfterEdit(record, task, beforeQty, nextQty) {
  if (task.kind === '입고' && task.stage === '검수') {
    const bin = record.bins.find((item) => item.id === task.sourceId)
    if (!bin) return

    const currentPutQty = parseNumber(bin.putQty)
    const putAlreadyDone = bin.statusPut === '완료' || currentPutQty !== null

    if (putAlreadyDone && currentPutQty === beforeQty) {
      bin.putQty = String(nextQty)
      if (bin.statusPut === '완료') bin.putEdited = true
    }
    return
  }

  if (task.kind === '출고' && task.stage === '피킹') {
    record.packOrders
      .filter((order) => order.sku === task.sku)
      .forEach((order) => {
        const currentPickedQty = parseNumber(order.actualPickedQty)
        const currentVerifiedQty = parseNumber(order.verifiedQty)
        const packAlreadyDone = order.statusPack === '완료' || currentVerifiedQty !== null

        if (currentPickedQty === null || currentPickedQty === beforeQty) {
          order.actualPickedQty = nextQty
        }
        if (packAlreadyDone && currentVerifiedQty === beforeQty) {
          order.verifiedQty = String(nextQty)
          if (order.statusPack === '완료') order.packEdited = true
        }
      })
  }
}

async function saveEditModal() {
  const task = modal.task
  const actual = Number(modal.actualQty || 0)
  const reason = modal.reason.trim()
  const selectedType = modal.exceptionType
  const actualBin = modal.actualBin.trim()
  if (!reason) {
    toast('완료건 수정 시에는 사유 입력이 필수입니다.')
    return
  }

  const record = cloneRecord(workerRecords.value.find((item) => item.id === task.parentId))
  if (!record) return
  const before = {
    actualQty: task.actualQty,
    actualBin: task.actualBin,
    hadException: task.hasException,
  }
  const beforeQty = parseNumber(task.actualQty) ?? task.qty
  const now = nowStamp()

  if (task.kind === '입고') {
    const bin = record.bins.find((item) => item.id === task.sourceId)
    if (!bin) return
    if (task.stage === '검수') {
      bin.inspectedQty = String(actual)
      bin.inspectNote = reason
      bin.inspectExceptionType = selectedType === '정상' ? '' : (selectedType || '')
      bin.statusInspect = '완료'
      bin.inspectEdited = true
      bin.statusInspectAt = now
      syncDownstreamAfterEdit(record, task, beforeQty, actual)
    } else {
      bin.putQty = String(actual)
      bin.confirmedBinCode = actualBin
      bin.putNote = reason
      bin.putExceptionType = selectedType === '정상' ? '' : (selectedType || '')
      bin.statusPut = '완료'
      bin.putEdited = true
      bin.statusPutAt = now
    }
  } else {
    if (task.stage === '피킹') {
      const bin = record.bins.find((item) => item.id === task.sourceId)
      if (!bin) return
      bin.pickedQty = String(actual)
      bin.pickReason = reason
      bin.pickExceptionType = selectedType === '정상' ? '' : (selectedType || '')
      bin.statusPick = '완료'
      bin.pickEdited = true
      bin.statusPickAt = now
      record.packOrders.filter((order) => order.sku === bin.sku).forEach((order) => {
        order.actualPickedQty = actual
      })
      syncDownstreamAfterEdit(record, task, beforeQty, actual)
    } else {
      const order = record.packOrders.find((item) => item.id === task.sourceId)
      if (!order) return
      order.verifiedQty = String(actual)
      order.packReason = reason
      order.packExceptionType = selectedType === '정상' ? '' : (selectedType || '')
      order.statusPack = '완료'
      order.packEdited = true
      order.statusPackAt = now
    }
  }

  const forcedNormal = before.hadException && selectedType === '정상'
  const inferredExceptionType = forcedNormal
    ? ''
    : (selectedType || inferStageExceptionType(task.kind, task.stage, task.qty, actual, reason, task.targetBin, actualBin))
  const hasException = forcedNormal
    ? false
    : (!!inferredExceptionType || (task.stage === '적재'
      ? (actual !== task.qty || actualBin !== (task.targetBin || task.bin))
      : actual !== task.qty))

  appendLog(record, {
    area: task.kind,
    stage: task.stage,
    kind: before.hadException ? (hasException ? '예외 수정' : '완료건 수정') : '완료건 수정',
    docLabel: task.kind === '입고' ? task.docNo : `${task.pickNo}${task.orderNo ? ` · ${task.orderNo}` : ''}`,
    seller: task.seller,
    target: task.stage === '패킹' ? `주문 ${task.orderNo} · ${task.sku}` : `Bin ${task.bin} · ${task.sku}`,
    message: `수량 ${before.actualQty ?? '-'} → ${actual}${task.stage === '적재' ? ` · BIN ${before.actualBin || '-'} → ${actualBin || '-'}` : ''}`,
    reason,
  })

  if (hasException) {
    appendLog(record, {
      area: task.kind,
      stage: task.stage,
      kind: before.hadException ? '예외 수정' : '예외 등록',
      docLabel: task.kind === '입고' ? task.docNo : `${task.pickNo}${task.orderNo ? ` · ${task.orderNo}` : ''}`,
      seller: task.seller,
      target: task.stage === '패킹' ? `주문 ${task.orderNo} · ${task.sku}` : `Bin ${task.bin} · ${task.sku}`,
      message: before.hadException
        ? `수정 전 ${before.actualQty ?? '-'}${before.actualBin ? ` / ${before.actualBin}` : ''} → ${actual}${task.stage === '적재' ? ` / ${actualBin || '-'}` : ''}`
        : `${task.stage} 예외가 다시 기록되었습니다.`,
      reason,
    })
  } else if (before.hadException) {
    appendLog(record, {
      area: task.kind,
      stage: task.stage,
      kind: '예외 해제',
      docLabel: task.kind === '입고' ? task.docNo : `${task.pickNo}${task.orderNo ? ` · ${task.orderNo}` : ''}`,
      seller: task.seller,
      target: task.stage === '패킹' ? `주문 ${task.orderNo} · ${task.sku}` : `Bin ${task.bin} · ${task.sku}`,
      message: '기존 예외가 정상으로 정정되어 예외 목록에서 제외되었습니다.',
      reason,
    })
  }

  await persistRecord(record, task, {
    actualQuantity: actual,
    actualBin,
    exceptionType: selectedType === '정상' ? '' : (selectedType || ''),
    issueNote: reason,
  })
  closeModal()
  toast(hasException ? '완료건 수정과 예외 반영이 저장되었습니다.' : (before.hadException ? '예외가 해제되어 정상으로 정정되었습니다.' : '완료건 수정이 저장되었습니다.'))
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" :loading="loading" title="WH Worker">
    <div class="worker-page">
      <div class="topbar">
        <div>
          <h2>{{ viewMeta.title }}</h2>
          <p>{{ viewMeta.desc }}</p>
        </div>
        <div class="status-chip">{{ viewMeta.chip }}</div>
      </div>

      <section v-if="view === 'myWork'">
        <div class="cards4">
          <div v-for="([label, value], index) in summaryCards" :key="`${label}-${index}`" class="stat">
            <div class="label">{{ label }}</div>
            <div class="value">{{ value }}</div>
          </div>
        </div>

        <div class="two-col" style="margin-top: 18px">
          <div class="panel">
            <div class="panel-head">
              <div class="panel-title">
                <h3>입고 작업</h3>
                <p>나에게 배정된 입고 작업을 바로 처리합니다.</p>
              </div>
              <div class="tabs">
                <button class="tab" :class="{ active: tabs.inboundWork === '검수' }" @click="tabs.inboundWork = '검수'">검수</button>
                <button class="tab" :class="{ active: tabs.inboundWork === '적재' }" @click="tabs.inboundWork = '적재'">적재</button>
              </div>
            </div>
            <div class="panel-body">
              <div v-if="inboundWorkTasks.length" class="task-list">
                <div v-for="task in inboundWorkTasks" :key="task.id" class="task-card">
                  <div class="task-top">
                    <div>
                      <div class="title-row">
                        <strong>{{ task.docNo }}</strong>
                        <span class="badge" :class="statusClass(task.status)">{{ task.status }}</span>
                        <span v-if="task.hasException" class="badge exception">예외</span>
                        <span v-if="task.edited" class="badge edited">수정됨</span>
                      </div>
                      <div class="task-meta" style="margin-top: 8px">
                        <span>{{ task.seller }}</span>
                        <span>Bin {{ task.bin }}</span>
                        <span>{{ task.sku }}</span>
                        <span>{{ task.qty }}EA</span>
                      </div>
                    </div>
                    <div class="task-side">
                      <div>{{ task.kind }} {{ task.stage }}</div>
                      <div v-if="task.completedAt">{{ task.completedAt }}</div>
                    </div>
                  </div>
                  <div class="btn-row">
                    <button class="btn primary" @click="openProcessModal(task)">시작</button>
                  </div>
                </div>
              </div>
              <div v-else class="empty">해당 단계의 입고 작업이 없습니다.</div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <div class="panel-title">
                <h3>출고 작업</h3>
                <p>나에게 배정된 출고 작업을 바로 처리합니다.</p>
              </div>
              <div class="tabs">
                <button class="tab" :class="{ active: tabs.outboundWork === '피킹' }" @click="tabs.outboundWork = '피킹'">피킹</button>
                <button class="tab" :class="{ active: tabs.outboundWork === '패킹' }" @click="tabs.outboundWork = '패킹'">패킹</button>
              </div>
            </div>
            <div class="panel-body">
              <div v-if="outboundWorkTasks.length" class="task-list">
                <div v-for="task in outboundWorkTasks" :key="task.id" class="task-card">
                  <div class="task-top">
                    <div>
                      <div class="title-row">
                        <strong>{{ task.stage === '패킹' ? task.orderNo : task.pickNo }}</strong>
                        <span class="badge" :class="statusClass(task.status)">{{ task.status }}</span>
                        <span v-if="task.hasException" class="badge exception">예외</span>
                        <span v-if="task.edited" class="badge edited">수정됨</span>
                      </div>
                      <div class="task-meta" style="margin-top: 8px">
                        <span>{{ task.seller }}</span>
                        <template v-if="task.stage === '패킹'">
                          <span>SKU {{ task.sku }}</span>
                          <span>{{ task.qty }}EA</span>
                          <span class="muted-inline">PICK {{ task.pickNo }}</span>
                        </template>
                        <template v-else>
                          <span>주문 {{ task.orderNo || '-' }}</span>
                          <span>{{ task.bin }}</span>
                          <span>{{ task.sku }}</span>
                          <span>{{ task.qty }}EA</span>
                        </template>
                      </div>
                    </div>
                    <div class="task-side">
                      <div>{{ task.kind }} {{ task.stage }}</div>
                      <div v-if="task.completedAt">{{ task.completedAt }}</div>
                    </div>
                  </div>
                  <div class="btn-row">
                    <button class="btn primary" @click="openProcessModal(task)">시작</button>
                  </div>
                </div>
              </div>
              <div v-else class="empty">해당 단계의 출고 작업이 없습니다.</div>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="view === 'inboundManage'">
        <div class="layout-manage">
          <div class="panel">
            <div class="panel-head">
              <div class="panel-title">
                <h3>완료된 입고 작업</h3>
                <p>완료된 ASN 작업을 검색하고 잘못 처리된 건을 수정합니다.</p>
              </div>
              <div class="tabs">
                <button class="tab" :class="{ active: tabs.inboundManage === '전체' }" @click="tabs.inboundManage = '전체'">전체</button>
                <button class="tab" :class="{ active: tabs.inboundManage === '검수' }" @click="tabs.inboundManage = '검수'">검수</button>
                <button class="tab" :class="{ active: tabs.inboundManage === '적재' }" @click="tabs.inboundManage = '적재'">적재</button>
              </div>
            </div>
            <div class="panel-body">
              <div class="searchbar">
                <input v-model="search.inboundManage" placeholder="ASN 번호, 셀러명, Bin, SKU, 상태로 검색" />
                <button class="btn" @click="resetSearch('inboundManage')">초기화</button>
              </div>
              <div class="helper">검색은 입고관리/출고관리에서만 제공됩니다. 완료건은 단계별로 다시 보고 수정할 수 있습니다.</div>
              <table>
                <thead>
                  <tr>
                    <th>상태</th>
                    <th>현재 단계</th>
                    <th>ASN</th>
                    <th>셀러</th>
                    <th>Bin</th>
                    <th>수량</th>
                    <th>예외</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!inboundManageRows.length">
                    <td colspan="8"><div class="empty">검색 조건에 맞는 입고 완료건이 없습니다.</div></td>
                  </tr>
                  <tr v-for="task in inboundManageRows" :key="task.id">
                    <td>
                      <span class="badge done">완료</span>
                      <span v-if="task.edited" class="badge edited inline-badge">수정됨</span>
                    </td>
                    <td>{{ task.stage }}</td>
                    <td>{{ task.docNo }}</td>
                    <td>{{ task.seller }}</td>
                    <td>{{ task.bin }}</td>
                    <td>{{ task.actualQty ?? task.qty }} / {{ task.qty }}</td>
                    <td><span v-if="task.hasException" class="badge exception">있음</span><template v-else>-</template></td>
                    <td><button class="btn" @click="openEditModal(task)">수정</button></td>
                  </tr>
                </tbody>
                </table>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <div class="panel-title">
                <h3>입고 예외</h3>
                <p>검수·적재 단계에서 발생한 예외를 단계별로 확인합니다.</p>
              </div>
              <div class="tabs">
                <button class="tab" :class="{ active: tabs.inboundException === '검수' }" @click="tabs.inboundException = '검수'; tabs.inboundExceptionFilter = '전체'">검수</button>
                <button class="tab" :class="{ active: tabs.inboundException === '적재' }" @click="tabs.inboundException = '적재'; tabs.inboundExceptionFilter = '전체'">적재</button>
              </div>
            </div>
            <div class="panel-body">
              <div class="searchbar">
                <input v-model="search.inboundException" placeholder="ASN / 셀러 / Bin / SKU / 예외유형 / 사유" />
                <button class="btn" @click="resetSearch('inboundException')">초기화</button>
              </div>
              <div class="helper">예외 분류는 자유 텍스트가 아니라 단계 + 사유 코드 기준으로 나뉩니다.</div>
              <div class="filter-row">
                <button v-for="item in inboundExceptionFilters" :key="item" class="filter-chip" :class="{ active: tabs.inboundExceptionFilter === item }" @click="tabs.inboundExceptionFilter = item">{{ item }}</button>
              </div>
              <div v-if="inboundExceptionRows.length" class="exception-list">
                <div v-for="entry in inboundExceptionRows" :key="entry.taskId" class="exception-card">
                  <div class="exception-top">
                    <div>
                      <strong>[{{ entry.stage }}] {{ entry.docNo }} · {{ entry.seller }}</strong>
                      <div class="exception-sub">Bin {{ entry.bin }} · {{ entry.sku }}</div>
                    </div>
                    <div class="exception-right">
                      <span class="badge exception">{{ entry.type }}</span>
                      <div class="exception-sub" style="margin-top: 8px">{{ entry.time }}</div>
                    </div>
                  </div>
                  <div class="line2"><span><strong>내용</strong> {{ entry.content }}</span></div>
                  <div class="line2"><span><strong>사유 코드</strong> {{ entry.type }}</span><span><strong>사유 메모</strong> {{ entry.reason }}</span></div>
                </div>
              </div>
              <div v-else class="empty">조건에 맞는 입고 예외가 없습니다.</div>
            </div>
          </div>
        </div>

        <div class="panel history-wrap">
          <div class="panel-head">
            <div class="panel-title">
              <h3>입고 처리 이력</h3>
              <p>예외 등록, 예외 해제, 완료건 수정 이력을 최근순으로 봅니다.</p>
            </div>
          </div>
          <div class="panel-body">
            <div class="searchbar">
              <input v-model="search.inboundHistory" placeholder="ASN / 셀러 / Bin / SKU / 단계 / 사유로 검색" />
              <button class="btn" @click="resetSearch('inboundHistory')">초기화</button>
            </div>
            <div v-if="inboundHistoryRows.length" class="history-list">
              <div v-for="log in inboundHistoryRows" :key="`${log.time}-${log.docLabel}-${log.kind}`" class="history-card">
                <div class="history-head">
                  <div class="title-row">
                    <span class="badge" :class="historyBadgeClass(log.kind)">{{ log.kind }}</span>
                    <strong>[{{ log.stage }}] {{ log.docLabel }}</strong>
                  </div>
                  <div class="history-sub">{{ log.time }}</div>
                </div>
                <div class="history-sub">{{ log.seller }} · {{ log.target }}</div>
                <div class="line2"><span><strong>내용</strong> {{ log.message }}</span></div>
                <div class="line2"><span><strong>사유</strong> {{ log.reason }}</span></div>
              </div>
            </div>
            <div v-else class="empty">{{ search.inboundHistory ? '조건에 맞는 입고 처리 이력이 없습니다.' : '최근 처리 이력이 없습니다.' }}</div>
          </div>
        </div>
      </section>

      <section v-else>
        <div class="layout-manage">
          <div class="panel">
            <div class="panel-head">
              <div class="panel-title">
                <h3>완료된 출고 작업</h3>
                <p>완료된 출고 작업을 검색하고 잘못 처리된 건을 수정합니다.</p>
              </div>
              <div class="tabs">
                <button class="tab" :class="{ active: tabs.outboundManage === '전체' }" @click="tabs.outboundManage = '전체'">전체</button>
                <button class="tab" :class="{ active: tabs.outboundManage === '피킹' }" @click="tabs.outboundManage = '피킹'">피킹</button>
                <button class="tab" :class="{ active: tabs.outboundManage === '패킹' }" @click="tabs.outboundManage = '패킹'">패킹</button>
              </div>
            </div>
            <div class="panel-body">
              <div class="searchbar">
                <input v-model="search.outboundManage" placeholder="PICK / ORDER / 셀러 / Bin / SKU / 상태로 검색" />
                <button class="btn" @click="resetSearch('outboundManage')">초기화</button>
              </div>
              <div class="helper">패킹은 주문 기준 최종 확인 단계입니다. 완료건도 단계별로 다시 찾아 수정할 수 있습니다.</div>
              <div class="table-scroll">
                <table class="completed-outbound-table">
                <thead>
                  <tr>
                    <th>상태</th>
                    <th>현재 단계</th>
                    <th>PICK</th>
                    <th>ORDER</th>
                    <th>셀러</th>
                    <th>기준</th>
                    <th>예외</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!outboundManageRows.length">
                    <td colspan="8"><div class="empty">검색 조건에 맞는 출고 완료건이 없습니다.</div></td>
                  </tr>
                  <tr v-for="task in outboundManageRows" :key="task.id">
                    <td>
                      <span class="badge done">완료</span>
                      <span v-if="task.edited" class="badge edited inline-badge">수정됨</span>
                    </td>
                    <td>{{ task.stage }}</td>
                    <td>{{ task.pickNo }}</td>
                    <td>{{ task.orderNo || '-' }}</td>
                    <td>{{ task.seller }}</td>
                    <td>
                      <template v-if="task.stage === '패킹'">
                        <div style="font-weight: 700">주문 {{ task.orderNo }}</div>
                        <div class="exception-sub">{{ task.sku }} · {{ task.actualQty ?? task.qty }}/{{ task.qty }}EA</div>
                      </template>
                      <template v-else>
                        <div style="font-weight: 700">Bin {{ task.bin }}</div>
                        <div class="exception-sub">{{ task.sku }} · {{ task.actualQty ?? task.qty }}/{{ task.qty }}EA</div>
                      </template>
                    </td>
                    <td><span v-if="task.hasException" class="badge exception">있음</span><template v-else>-</template></td>
                    <td><button class="btn" @click="openEditModal(task)">수정</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

          <div class="panel">
            <div class="panel-head">
              <div class="panel-title">
                <h3>출고 예외</h3>
                <p>피킹·패킹 단계 예외를 주문/위치 기준으로 다시 찾습니다.</p>
              </div>
              <div class="tabs">
                <button class="tab" :class="{ active: tabs.outboundException === '피킹' }" @click="tabs.outboundException = '피킹'; tabs.outboundExceptionFilter = '전체'">피킹</button>
                <button class="tab" :class="{ active: tabs.outboundException === '패킹' }" @click="tabs.outboundException = '패킹'; tabs.outboundExceptionFilter = '전체'">패킹</button>
              </div>
            </div>
            <div class="panel-body">
              <div class="searchbar">
                <input v-model="search.outboundException" placeholder="PICK / ORDER / 셀러 / Bin(피킹) / SKU / 예외유형 / 사유" />
                <button class="btn" @click="resetSearch('outboundException')">초기화</button>
              </div>
              <div class="helper">출고 예외도 단계 + 사유 코드 기준으로 나뉩니다. 사유 문장만 보고 자동 분류하지 않습니다.</div>
              <div class="filter-row">
                <button v-for="item in outboundExceptionFilters" :key="item" class="filter-chip" :class="{ active: tabs.outboundExceptionFilter === item }" @click="tabs.outboundExceptionFilter = item">{{ item }}</button>
              </div>
              <div v-if="outboundExceptionRows.length" class="exception-list">
                <div v-for="entry in outboundExceptionRows" :key="entry.taskId" class="exception-card">
                  <div class="exception-top">
                    <div>
                      <template v-if="entry.stage === '패킹'">
                        <strong>[{{ entry.stage }}] {{ entry.orderNo }}</strong>
                        <div class="exception-sub">{{ entry.seller }} · {{ entry.sku }} · {{ entry.content }}</div>
                      </template>
                      <template v-else>
                        <strong>[{{ entry.stage }}] {{ entry.pickNo }}</strong>
                        <div class="exception-sub">{{ entry.seller }} · Bin {{ entry.bin }} · {{ entry.sku }}</div>
                      </template>
                    </div>
                    <div class="exception-right">
                      <span class="badge exception">{{ entry.type }}</span>
                      <div class="exception-sub" style="margin-top: 8px">{{ entry.time }}</div>
                    </div>
                  </div>
                  <div class="line2"><span><strong>내용</strong> {{ entry.content }}</span></div>
                  <div class="line2"><span><strong>사유 코드</strong> {{ entry.type }}</span><span><strong>사유 메모</strong> {{ entry.reason }}</span></div>
                </div>
              </div>
              <div v-else class="empty">조건에 맞는 출고 예외가 없습니다.</div>
            </div>
          </div>
        </div>

        <div class="panel history-wrap">
          <div class="panel-head">
            <div class="panel-title">
              <h3>출고 처리 이력</h3>
              <p>예외 등록, 예외 해제, 완료건 수정 이력을 최근순으로 봅니다.</p>
            </div>
          </div>
          <div class="panel-body">
            <div class="searchbar">
              <input v-model="search.outboundHistory" placeholder="PICK / ORDER / 셀러 / SKU / 단계 / 사유로 검색" />
              <button class="btn" @click="resetSearch('outboundHistory')">초기화</button>
            </div>
            <div v-if="outboundHistoryRows.length" class="history-list">
              <div v-for="log in outboundHistoryRows" :key="`${log.time}-${log.docLabel}-${log.kind}`" class="history-card">
                <div class="history-head">
                  <div class="title-row">
                    <span class="badge" :class="historyBadgeClass(log.kind)">{{ log.kind }}</span>
                    <strong>[{{ log.stage }}] {{ log.docLabel }}</strong>
                  </div>
                  <div class="history-sub">{{ log.time }}</div>
                </div>
                <div class="history-sub">{{ log.seller }} · {{ log.target }}</div>
                <div class="line2"><span><strong>내용</strong> {{ log.message }}</span></div>
                <div class="line2"><span><strong>사유</strong> {{ log.reason }}</span></div>
              </div>
            </div>
            <div v-else class="empty">{{ search.outboundHistory ? '조건에 맞는 출고 처리 이력이 없습니다.' : '최근 처리 이력이 없습니다.' }}</div>
          </div>
        </div>
      </section>
    </div>

    <div class="modal-wrap" :class="{ show: !!modal.task }" @click.self="closeModal">
      <div class="modal">
        <div class="modal-head">
          <div>
            <h3>{{ modal.mode === 'edit' ? `${modal.task?.kind} ${editModeHasExistingException ? '예외 수정' : '완료건 수정'}` : `${modal.task?.kind} ${modal.task?.stage} 처리` }}</h3>
            <p id="modalSub" class="modal-sub">
              <template v-if="modal.task">
                <template v-if="modal.mode === 'edit'">
                  {{ modal.task.kind === '입고' ? `${modal.task.docNo} · ${modal.task.stage}` : `${modal.task.pickNo}${modal.task.orderNo ? ` · ${modal.task.orderNo}` : ''} · ${modal.task.stage}` }}
                </template>
                <template v-else>
                  {{ modal.task.kind === '입고' ? `${modal.task.docNo} · ${modal.task.seller} · ${modal.task.sku}` : (modal.task.stage === '패킹' ? `${modal.task.orderNo} · ${modal.task.seller} · ${modal.task.sku}` : `${modal.task.pickNo} · ${modal.task.seller} · ${modal.task.sku}`) }}
                </template>
              </template>
            </p>
          </div>
          <button class="btn ghost" @click="closeModal">닫기</button>
        </div>
        <div v-if="modal.task" class="modal-body">
          <div class="helper">
            <template v-if="modal.mode === 'edit'">
              완료된 작업도 수정 가능하지만 사유 입력은 필수입니다.
              <template v-if="editModeHasExistingException">예외 건은 예외 유형을 변경하거나 정상으로 정정할 수 있습니다.</template>
              <template v-else>예외 유형은 드롭다운 값 기준으로 다시 분류됩니다.</template>
            </template>
            <template v-else-if="modal.task.kind === '입고' && modal.task.stage === '적재'">적재 단계는 수량 재검수보다 위치 확인 중심입니다. 지정 Bin과 실제 적재 Bin을 확인하세요.</template>
            <template v-else-if="modal.task.kind === '출고' && modal.task.stage === '패킹'">패킹은 주문 기준 최종 수량 확인 단계입니다.</template>
            <template v-else>예외가 있으면 예외 유형을 선택하고 사유를 입력하세요. 예외 화면 분류는 드롭다운 선택값 기준으로 처리됩니다.</template>
          </div>

          <template v-if="modal.mode === 'process'">
            <div class="grid2">
              <div class="field">
                <label>{{ modal.task.kind === '입고' ? '문서 번호' : (modal.task.stage === '패킹' ? '주문 번호' : '문서 번호') }}</label>
                <input :value="modal.task.kind === '입고' ? modal.task.docNo : (modal.task.stage === '패킹' ? modal.task.orderNo : modal.task.pickNo)" disabled />
              </div>
              <div class="field">
                <label>{{ modal.task.kind === '입고' ? 'BIN 위치' : (modal.task.stage === '피킹' ? 'BIN 위치' : 'SKU') }}</label>
                <input :value="modal.task.kind === '입고' ? modal.task.bin : (modal.task.stage === '피킹' ? modal.task.bin : modal.task.sku)" disabled />
              </div>
            </div>
            <div class="grid2">
              <div class="field">
                <label>{{ modal.task.kind === '입고' && modal.task.stage === '적재' ? '기준 수량' : '예정 수량' }}</label>
                <input :value="modal.task.qty" disabled />
              </div>
              <div class="field">
                <label>{{ modal.task.kind === '입고' && modal.task.stage === '적재' ? '실 적재 수량' : '실제 수량' }}</label>
                <input v-model="modal.actualQty" min="0" type="number" />
              </div>
            </div>
          </template>

          <template v-else>
            <div v-if="modal.task.kind === '출고' && modal.task.stage === '패킹'" class="grid2">
              <div class="field">
                <label>주문 번호</label>
                <input :value="modal.task.orderNo" disabled />
              </div>
              <div class="field">
                <label>SKU</label>
                <input :value="modal.task.sku" disabled />
              </div>
            </div>
            <div class="grid2">
              <div class="field">
                <label>{{ modal.mode === 'edit' ? '현재 기준 수량' : '예정 수량' }}</label>
                <input :value="modal.task.qty" disabled />
              </div>
              <div class="field">
                <label>{{ modal.mode === 'edit' ? '수정할 수량' : (modal.task.kind === '입고' && modal.task.stage === '적재' ? '실 적재 수량' : '실제 수량') }}</label>
                <input v-model="modal.actualQty" min="0" type="number" />
              </div>
            </div>
          </template>

          <div v-if="modal.task.kind === '입고' && modal.task.stage === '적재'" class="grid2">
            <div class="field">
              <label>{{ modal.mode === 'edit' ? '지정 BIN' : '지정 BIN' }}</label>
              <input :value="modal.task.targetBin || modal.task.bin" disabled />
            </div>
            <div class="field">
              <label>{{ modal.mode === 'edit' ? '수정할 실제 적재 BIN' : '실제 적재 BIN' }}</label>
              <input v-model="modal.actualBin" />
            </div>
          </div>

          <div v-if="modalOptions.length" class="grid2">
            <div class="field">
              <label>예외 유형</label>
              <select v-model="modal.exceptionType">
                <option v-if="modalAllowsEmptySelection" value="">선택 안 함</option>
                <option v-for="option in modalOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </div>
            <div class="field">
              <label>{{ modal.mode === 'edit' ? '수정 사유' : '사유' }}</label>
              <textarea v-model="modal.reason" :placeholder="modal.mode === 'edit' ? '왜 수정하는지 입력하세요' : '예외 유형을 선택하면 사유를 입력하세요'" rows="3"></textarea>
              <small>{{ modal.mode === 'edit' ? '' : '예외 유형을 선택하거나 실제 수량이 다르면 사유 입력이 필요합니다.' }}</small>
            </div>
          </div>

          <div v-else class="field">
            <label>{{ modal.mode === 'edit' ? '수정 사유' : '사유' }}</label>
            <textarea v-model="modal.reason" :placeholder="modal.mode === 'edit' ? '왜 수정하는지 입력하세요' : '불일치 또는 수정이 있을 때 사유를 입력하세요'" rows="4"></textarea>
            <small v-if="modal.mode !== 'edit'">수량 불일치나 완료 후 수정 시 사유는 필수입니다.</small>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="closeModal">취소</button>
          <button class="btn primary" @click="saveModal">저장</button>
        </div>
      </div>
    </div>

    <div v-show="toastVisible" class="toast">{{ toastMessage }}</div>
  </AppLayout>
</template>

<style scoped>
.worker-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 18px 22px;
  box-shadow: var(--shadow-md);
}
.topbar h2 {
  margin: 0;
  font-size: 22px;
  color: var(--t1);
}
.topbar p,
.modal-sub {
  margin: 6px 0 0;
  color: var(--t3);
  font-size: 13px;
}
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 999px;
  background: var(--blue-pale);
  color: var(--blue);
  font-weight: 700;
  font-size: 13px;
}
.cards4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.stat,
.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: var(--shadow-md);
}
.stat {
  padding: 18px;
}
.label,
.exception-sub,
.history-sub,
.muted-inline {
  color: var(--t3);
}
.label {
  font-size: 13px;
}
.value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 800;
  color: var(--t1);
}
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.panel {
  overflow: hidden;
}
.panel-head {
  padding: 18px 18px 14px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.panel-title {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.panel-title h3 {
  margin: 0;
  font-size: 18px;
  color: var(--t1);
}
.panel-title p,
.section-note {
  margin: 0;
  color: var(--t3);
  font-size: 13px;
}
.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.tab,
.filter-chip,
.btn {
  border: 1px solid var(--border);
  background: #fff;
  color: var(--t2);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--ease-fast);
}
.tab {
  padding: 9px 14px;
  border-radius: 999px;
  font-size: 13px;
}
.tab:hover,
.filter-chip:hover,
.btn:hover {
  border-color: var(--border-dk);
}
.tab.active,
.filter-chip.active {
  color: #fff;
  background: linear-gradient(180deg, var(--blue) 0%, #335be1 100%);
  border-color: #335be1;
  box-shadow: 0 10px 22px rgba(76, 116, 255, 0.24), inset 0 0 0 1px rgba(255,255,255,.12);
  transform: translateY(-1px);
}
.panel-body {
  padding: 16px 18px 18px;
}
.task-list,
.exception-list,
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.task-card,
.exception-card,
.history-card {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px;
  display: grid;
  gap: 8px;
  background: #fff;
}
.task-top,
.exception-top,
.history-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}
.title-row,
.line2,
.btn-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.task-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--t3);
  font-size: 13px;
}
.task-side,
.exception-right {
  text-align: right;
  font-size: 12px;
  color: var(--t3);
}
.badge {
  display: inline-flex;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}
.badge.wait {
  background: var(--gold-pale);
  color: #9a6700;
}
.badge.progress {
  background: var(--blue-pale);
  color: var(--blue);
}
.badge.done {
  background: var(--green-pale);
  color: var(--green);
}
.badge.exception {
  background: var(--red-pale);
  color: var(--red);
}
.badge.edited {
  background: var(--blue-pale);
  color: #4338ca;
}
.inline-badge {
  margin-left: 6px;
}
.btn {
  padding: 9px 12px;
  border-radius: 12px;
  font-size: 13px;
}
.btn.primary {
  border-color: transparent;
  background: var(--blue);
  color: #fff;
}
.btn.ghost {
  color: var(--t3);
}
.searchbar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  margin-bottom: 14px;
}
.searchbar input,
.field input,
.field select,
.field textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 11px 12px;
  font: inherit;
  background: #fff;
  color: var(--t1);
}
.field select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 42px;
  background-image: linear-gradient(45deg, transparent 50%, #6b7280 50%), linear-gradient(135deg, #6b7280 50%, transparent 50%);
  background-position: calc(100% - 18px) calc(50% - 3px), calc(100% - 12px) calc(50% - 3px);
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
}
.searchbar input:focus,
.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: #93c5fd;
  box-shadow: 0 0 0 4px rgba(76, 116, 255, .1);
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.filter-chip {
  border-radius: 999px;
  padding: 7px 11px;
  font-size: 12px;
}
.table-scroll {
  width: 100%;
  overflow-x: auto;
}
.completed-outbound-table th,
.completed-outbound-table td,
.completed-outbound-table .exception-sub,
.completed-outbound-table .badge,
.completed-outbound-table button {
  white-space: nowrap;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th,
td {
  padding: 12px 10px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: top;
}
th {
  color: var(--t3);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.layout-manage {
  display: grid;
  grid-template-columns: 1.1fr .9fr;
  gap: 18px;
}
.history-wrap {
  margin-top: 18px;
}
.helper {
  padding: 12px 14px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  color: #475569;
  font-size: 13px;
  margin-bottom: 14px;
}
.modal-wrap {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, .45);
  display: none;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}
.modal-wrap.show {
  display: flex;
}
.modal {
  width: min(760px, 100%);
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 30px 60px rgba(15, 23, 42, .18);
  overflow: hidden;
}
.modal-head {
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.modal-head h3 {
  margin: 0;
  font-size: 20px;
}
.modal-body {
  padding: 20px 22px;
  display: grid;
  gap: 16px;
}
.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.field label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}
.field small {
  display: block;
  margin-top: 6px;
  color: var(--t3);
}
.modal-foot {
  padding: 16px 22px 22px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.empty {
  padding: 28px 16px;
  text-align: center;
  color: var(--t3);
  border: 1px dashed var(--border);
  border-radius: 16px;
}
.toast {
  position: fixed;
  right: 20px;
  bottom: 20px;
  background: #111827;
  color: #fff;
  padding: 12px 14px;
  border-radius: 14px;
  box-shadow: var(--shadow-md);
  z-index: 1100;
  font-size: 13px;
  font-weight: 700;
}
@media (max-width: 1280px) {
  .layout-manage {
    grid-template-columns: 1fr;
  }
  .cards4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 980px) {
  .two-col,
  .grid2,
  .cards4 {
    grid-template-columns: 1fr;
  }
}
</style>
