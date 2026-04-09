/**
 * Seller 대시보드 화면용 파생 데이터와 차트 가공 유틸.
 * API 응답만 기준으로 요약 정보를 계산한다.
 */
import { ASN_STATUS, ROUTE_NAMES } from '@/constants'
import { normalizeSellerAsnDetail } from '@/utils/seller/asnList.utils.js'
import { getSellerChannelMeta, getSellerChannelOrderStatusMeta } from '@/utils/seller/channelOrders.utils.js'
import { getSellerInventoryStatusMeta, normalizeSellerInventoryDetail } from '@/utils/seller/inventoryList.utils.js'
import { getSellerOrderStatusMeta, normalizeSellerOrderDetail } from '@/utils/seller/orderList.utils.js'

const numberFormatter = new Intl.NumberFormat('ko-KR')
const DASHBOARD_ACTIVITY_LIMIT = 5
const DASHBOARD_INBOUND_LIMIT = 4

const SELLER_DASHBOARD_ASN_STATUS_META = {
  [ASN_STATUS.SUBMITTED]: { label: '등록됨', tone: 'gold' },
  [ASN_STATUS.RECEIVED]: { label: '입고완료', tone: 'green' },
  [ASN_STATUS.CANCELLED]: { label: '취소됨', tone: 'red' },
}

const SELLER_DASHBOARD_INBOUND_ETA_META = {
  [ASN_STATUS.SUBMITTED]: { label: '도착 예정', tone: 'amber' },
  [ASN_STATUS.RECEIVED]: { label: '입고완료', tone: 'green' },
  [ASN_STATUS.CANCELLED]: { label: '일정 변경', tone: 'red' },
}

export const SELLER_DASHBOARD_PERIOD_OPTIONS = [
  { key: 'week', label: '주간' },
  { key: 'month', label: '월간' },
  { key: 'quarter', label: '분기' },
]

export const SELLER_DASHBOARD_TREND_SERIES = {
  week: { key: 'week', maxValue: 5, points: [] },
  month: { key: 'month', maxValue: 5, points: [] },
  quarter: { key: 'quarter', maxValue: 5, points: [] },
}

function formatNumber(value) {
  return numberFormatter.format(Math.max(0, Number(value) || 0))
}

function parseDashboardMetricValue(value) {
  const normalized = String(value ?? '').replace(/[^\d.-]/g, '')
  return Number(normalized || 0)
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function parseDateString(value) {
  const normalized = String(value ?? '').trim()
  if (!normalized) return null

  const parsed = new Date(normalized.replace(' ', 'T'))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatDateLabel(date, { includeTime = true } = {}) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '-'

  const monthDay = `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`
  if (!includeTime) return monthDay

  return `${monthDay} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatMonthLabel(date) {
  return `${date.getMonth() + 1}월`
}

function formatQuarterLabel(date) {
  return `Q${Math.floor(date.getMonth() / 3) + 1}`
}

function formatKoreanDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '-'
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

function getDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

function getQuarterKey(date) {
  return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`
}

function shiftDate(date, { days = 0, months = 0 } = {}) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)

  if (months) {
    next.setDate(1)
    next.setMonth(next.getMonth() + months)
  }

  if (days) {
    next.setDate(next.getDate() + days)
  }

  return next
}

function getNormalizedBaseDate(baseDate = new Date()) {
  const parsed = baseDate instanceof Date ? new Date(baseDate) : parseDateString(baseDate)
  const normalized = parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date()
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function getRecommendedMaxValue(maxValue) {
  const safeMax = Math.max(1, Number(maxValue) || 0)

  if (safeMax <= 5) return 5
  if (safeMax <= 10) return 10

  const magnitude = 10 ** Math.floor(Math.log10(safeMax))
  return Math.ceil(safeMax / magnitude) * magnitude
}

function getAsnStatusMeta(status) {
  return SELLER_DASHBOARD_ASN_STATUS_META[status] ?? { label: status ?? '-', tone: 'default' }
}

function getInboundEtaMeta(status) {
  return SELLER_DASHBOARD_INBOUND_ETA_META[status] ?? { label: '확인 필요', tone: 'default' }
}

function getDashboardOutboundStage(status) {
  if (['RECEIVED', 'NEW'].includes(status)) return 'pending'
  if (['WAITING', 'ALLOCATED', 'DISPATCHED', 'READY', 'SHIPPED'].includes(status)) return 'progress'
  if (['COMPLETED', 'DELIVERED'].includes(status)) return 'completed'
  return 'ignored'
}

function normalizeDashboardOrderStatus(status) {
  if (['NEW', 'RECEIVED'].includes(status)) return 'RECEIVED'
  if (['READY', 'WAITING'].includes(status)) return 'WAITING'
  if (['ALLOCATED'].includes(status)) return 'ALLOCATED'
  if (['SHIPPED', 'DISPATCHED'].includes(status)) return 'DISPATCHED'
  if (['DELIVERED', 'COMPLETED'].includes(status)) return 'COMPLETED'
  return status
}

function normalizeChannelLabel(channel) {
  if (!channel) return '-'
  if (['Amazon', '수동', '엑셀'].includes(channel)) return channel
  return getSellerChannelMeta(channel).label
}

function inferOrderQuantity(itemsSummary = '', items = []) {
  if (Array.isArray(items) && items.length) {
    return String(items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0))
  }

  const normalized = String(itemsSummary ?? '')
  const multiplied = [...normalized.matchAll(/×\s*(\d+)/g)]

  if (multiplied.length) {
    const total = multiplied.reduce((sum, match) => sum + Number(match[1] || 0), 0)
    return String(total)
  }

  const bundled = normalized.match(/외\s*(\d+)건/)
  if (bundled) return String(Number(bundled[1]) + 1)

  return '1'
}

function buildDashboardOrderRows(orderRows = [], channelOrderRows = []) {
  const localOrders = (Array.isArray(orderRows) ? orderRows : []).map((row) => ({
    id: row.id ?? row.orderId ?? row.orderNo,
    code: row.orderNo,
    channelLabel: normalizeChannelLabel(row.channel),
    orderedAt: row.orderedAt ?? row.orderDate ?? row.createdAt,
    itemsSummary: row.itemsSummary ?? '',
    quantity: inferOrderQuantity(row.itemsSummary, row.detail?.items),
    statusMeta: getSellerOrderStatusMeta(row.status),
    stage: getDashboardOutboundStage(row.status),
    order: {
      ...row,
      orderNo: row.orderNo,
      channel: normalizeChannelLabel(row.channel),
      status: normalizeDashboardOrderStatus(row.status),
    },
    orderDetail: row.detail ? normalizeSellerOrderDetail(row.detail, row) : null,
  }))

  const syncedOrders = (Array.isArray(channelOrderRows) ? channelOrderRows : []).map((row) => ({
    id: row.id ?? row.orderId ?? row.channelOrderNo,
    code: row.conkOrderNo || row.channelOrderNo,
    channelLabel: normalizeChannelLabel(row.channel),
    orderedAt: row.orderedAt ?? row.createdAt,
    itemsSummary: row.itemsSummary ?? '',
    quantity: inferOrderQuantity(row.itemsSummary, row.items),
    statusMeta: getSellerChannelOrderStatusMeta(row.status),
    stage: getDashboardOutboundStage(row.status),
    order: {
      id: row.id,
      orderNo: row.conkOrderNo || row.channelOrderNo,
      channel: normalizeChannelLabel(row.channel),
      recipient: row.recipient,
      address: row.address ?? '-',
      itemsSummary: row.itemsSummary,
      orderedAt: row.orderedAt ?? row.createdAt,
      status: normalizeDashboardOrderStatus(row.status),
      trackingNo: row.trackingNo ?? '',
      canCancel: false,
      detail: row.detail ?? null,
    },
    orderDetail: row.detail ? normalizeSellerOrderDetail(row.detail, row) : null,
  }))

  return [...localOrders, ...syncedOrders]
}

function getTodayDateCounts(rows = [], baseDate = new Date()) {
  const countsByDate = rows.reduce((map, row) => {
    const parsed = parseDateString(row.orderedAt)
    if (!parsed) return map

    const key = getDateKey(parsed)
    map.set(key, (map.get(key) || 0) + 1)
    return map
  }, new Map())

  const today = getNormalizedBaseDate(baseDate)
  const todayDateKey = getDateKey(today)
  const previousDateKey = getDateKey(shiftDate(today, { days: -1 }))

  return {
    todayDateKey,
    latestCount: countsByDate.get(todayDateKey) || 0,
    previousCount: previousDateKey ? countsByDate.get(previousDateKey) || 0 : 0,
  }
}

function buildOrderTrendMeta(latestCount, previousCount) {
  if (!latestCount || previousCount <= 0) return {}

  const delta = Math.round(((latestCount - previousCount) / previousCount) * 100)
  if (delta > 0) return { trend: `▲ ${delta}%`, trendTone: 'up' }
  if (delta < 0) return { trend: `▼ ${Math.abs(delta)}%`, trendTone: 'down' }
  return {}
}

function buildTrendPeriodSeries(rows = [], period = 'month') {
  const parsedDates = rows
    .map((row) => parseDateString(row.orderedAt))
    .filter(Boolean)

  const latestDate = parsedDates.length
    ? new Date(Math.max(...parsedDates.map((date) => date.getTime())))
    : new Date()

  let buckets = []

  if (period === 'week') {
    buckets = Array.from({ length: 7 }, (_, index) => {
      const date = shiftDate(latestDate, { days: index - 6 })
      return {
        key: getDateKey(date),
        label: formatDateLabel(date, { includeTime: false }),
      }
    })
  } else if (period === 'quarter') {
    buckets = Array.from({ length: 4 }, (_, index) => {
      const date = shiftDate(latestDate, { months: (index - 3) * 3 })
      return {
        key: getQuarterKey(date),
        label: formatQuarterLabel(date),
      }
    })
  } else {
    buckets = Array.from({ length: 6 }, (_, index) => {
      const date = shiftDate(latestDate, { months: index - 5 })
      return {
        key: getMonthKey(date),
        label: formatMonthLabel(date),
      }
    })
  }

  const counts = parsedDates.reduce((map, date) => {
    const key = period === 'week'
      ? getDateKey(date)
      : period === 'quarter'
        ? getQuarterKey(date)
        : getMonthKey(date)

    map.set(key, (map.get(key) || 0) + 1)
    return map
  }, new Map())

  const points = buckets.map((bucket) => ({
    label: bucket.label,
    value: counts.get(bucket.key) || 0,
  }))

  return {
    key: period,
    maxValue: getRecommendedMaxValue(Math.max(...points.map((point) => point.value), 0)),
    points,
  }
}

export function buildSellerDashboardKpiCards({
  inventoryRows = [],
  orderRows = [],
  channelOrderRows = [],
  baseDate = new Date(),
} = {}) {
  const combinedOrders = buildDashboardOrderRows(orderRows, channelOrderRows)
  const { todayDateKey, latestCount, previousCount } = getTodayDateCounts(combinedOrders, baseDate)
  const latestRows = combinedOrders.filter((row) => {
    const parsed = parseDateString(row.orderedAt)
    return parsed && getDateKey(parsed) === todayDateKey
  })

  const channelSummary = latestRows.reduce((summary, row) => {
    summary.set(row.channelLabel, (summary.get(row.channelLabel) || 0) + 1)
    return summary
  }, new Map())

  const channelSummaryText = [...channelSummary.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([label, count]) => `${label} ${count}`)
    .join(' · ')

  const pendingCount = combinedOrders.filter((row) => row.stage === 'pending').length
  const progressCount = combinedOrders.filter((row) => row.stage === 'progress').length
  const completedCount = combinedOrders.filter((row) => row.stage === 'completed').length

  const normalizedInventoryRows = Array.isArray(inventoryRows) ? inventoryRows : []
  const availableStock = normalizedInventoryRows.reduce((sum, row) => sum + Number(row.availableStock || 0), 0)
  const allocatedStock = normalizedInventoryRows.reduce((sum, row) => sum + Number(row.allocatedStock || 0), 0)
  const lowStockCount = normalizedInventoryRows.filter((row) => ['LOW', 'OUT'].includes(row.status)).length
  const warningCount = normalizedInventoryRows.filter((row) => row.status === 'LOW').length
  const outCount = normalizedInventoryRows.filter((row) => row.status === 'OUT').length
  const orderTrendMeta = buildOrderTrendMeta(latestCount, previousCount)

  return [
    {
      key: 'available-stock',
      label: '가용 재고 총 수량',
      value: formatNumber(availableStock),
      subtext: `총 ${formatNumber(normalizedInventoryRows.length)} SKU · 할당재고 ${formatNumber(allocatedStock)}개 제외`,
      tone: 'gold',
      routeName: ROUTE_NAMES.SELLER_INVENTORY,
    },
    {
      key: 'new-orders',
      label: '금일 신규 주문',
      value: formatNumber(latestCount),
      subtext: channelSummaryText || '오늘 신규 주문 없음',
      tone: 'green',
      routeName: ROUTE_NAMES.SELLER_ORDER_LIST,
      ...orderTrendMeta,
    },
    {
      key: 'outbound-status',
      label: '출고 처리 현황',
      value: `${formatNumber(pendingCount)} · ${formatNumber(progressCount)} · ${formatNumber(completedCount)}`,
      subtext: '대기 · 진행 · 완료',
      tone: 'blue',
      routeName: ROUTE_NAMES.SELLER_ORDER_LIST,
    },
    {
      key: 'low-stock',
      label: '재고 부족 알림 SKU',
      value: formatNumber(lowStockCount),
      subtext: `재고부족 ${formatNumber(warningCount)} · 품절 ${formatNumber(outCount)}`,
      tone: 'amber',
      routeName: ROUTE_NAMES.SELLER_INVENTORY,
    },
  ]
}

export function buildSellerDashboardTrendSeries({
  orderRows = [],
  channelOrderRows = [],
} = {}) {
  const combinedOrders = buildDashboardOrderRows(orderRows, channelOrderRows)

  return {
    week: buildTrendPeriodSeries(combinedOrders, 'week'),
    month: buildTrendPeriodSeries(combinedOrders, 'month'),
    quarter: buildTrendPeriodSeries(combinedOrders, 'quarter'),
  }
}

export function getSellerDashboardTrendSeries(period = 'month') {
  return SELLER_DASHBOARD_TREND_SERIES[period] ?? SELLER_DASHBOARD_TREND_SERIES.month
}

export function buildSellerDashboardStockRatio({
  inventoryRows = [],
} = {}) {
  const normalizedInventoryRows = Array.isArray(inventoryRows) ? inventoryRows : []
  const availableStock = normalizedInventoryRows.reduce((sum, row) => sum + Number(row.availableStock || 0), 0)
  const allocatedStock = normalizedInventoryRows.reduce((sum, row) => sum + Number(row.allocatedStock || 0), 0)
  const inboundExpected = normalizedInventoryRows.reduce((sum, row) => sum + Number(row.inboundExpected || 0), 0)
  const total = Math.max(availableStock + allocatedStock + inboundExpected, 1)

  const availableShare = Math.round((availableStock / total) * 100)
  const allocatedShare = Math.round((allocatedStock / total) * 100)
  const inboundShare = Math.max(0, 100 - availableShare - allocatedShare)

  return [
    { key: 'available', label: '가용재고', value: availableShare, color: '#F5A623' },
    { key: 'allocated', label: '할당재고', value: allocatedShare, color: '#4C74FF' },
    { key: 'inbound', label: '입고예정', value: inboundShare, color: '#7B859A' },
  ]
}

export function buildSellerDashboardRecentActivityRows({
  orderRows = [],
  channelOrderRows = [],
  asnRows = [],
  inventoryRows = [],
} = {}) {
  const orderActivities = buildDashboardOrderRows(orderRows, channelOrderRows).map((row) => {
    const orderedAt = parseDateString(row.orderedAt)

    return {
      id: `activity-order-${row.id}`,
      type: '주문',
      typeTone: 'gold',
      code: row.code,
      target: row.itemsSummary,
      quantity: row.quantity,
      statusLabel: row.statusMeta.label,
      statusTone: row.statusMeta.tone,
      occurredAt: formatDateLabel(orderedAt),
      routeName: ROUTE_NAMES.SELLER_ORDER_LIST,
      order: row.order,
      orderDetail: row.orderDetail,
      sortAt: orderedAt?.getTime() || 0,
    }
  })

  const asnActivities = (Array.isArray(asnRows) ? asnRows : []).map((row) => {
    const createdAt = parseDateString(`${row.createdAt ?? row.expectedDate ?? ''} 09:00`)
    const statusMeta = getAsnStatusMeta(row.status)

    return {
      id: `activity-asn-${row.id ?? row.asnNo}`,
      type: 'ASN',
      typeTone: 'blue',
      code: row.asnNo,
      target: row.warehouseName,
      quantity: formatNumber(row.totalQuantity),
      statusLabel: statusMeta.label,
      statusTone: statusMeta.tone,
      occurredAt: formatDateLabel(createdAt, { includeTime: false }),
      routeName: ROUTE_NAMES.SELLER_ASN_LIST,
      sortAt: createdAt?.getTime() || 0,
    }
  })

  const inventoryActivities = (Array.isArray(inventoryRows) ? inventoryRows : [])
    .filter((row) => row.status !== 'NORMAL')
    .map((row) => {
      const occurredAt = parseDateString(`${row.lastInboundDate ?? ''} 08:00`)
      const statusMeta = getSellerInventoryStatusMeta(row.status)

      return {
        id: `activity-inventory-${row.id ?? row.sku}`,
        type: '재고',
        typeTone: 'default',
        code: row.sku,
        target: row.productName,
        quantity: formatNumber(row.availableStock),
        statusLabel: statusMeta.label,
        statusTone: statusMeta.tone,
        occurredAt: formatDateLabel(occurredAt, { includeTime: false }),
        routeName: ROUTE_NAMES.SELLER_INVENTORY,
        sortAt: occurredAt?.getTime() || 0,
      }
    })

  return [...orderActivities, ...asnActivities, ...inventoryActivities]
    .sort((left, right) => right.sortAt - left.sortAt)
    .slice(0, DASHBOARD_ACTIVITY_LIMIT)
    .map(({ sortAt, ...row }) => row)
}

export function buildSellerDashboardInboundRows({
  asnRows = [],
  inventoryRows = [],
} = {}) {
  const inboundScheduleBySku = (Array.isArray(asnRows) ? asnRows : [])
    .reduce((map, row) => {
      const detail = row.detail ? normalizeSellerAsnDetail(row.detail, row) : null
      const expectedDate = parseDateString(row.expectedDate)

      if (!detail?.items?.length) return map

      detail.items.forEach((item) => {
        if (map.has(item.sku)) return

        map.set(item.sku, {
          asnNo: row.asnNo,
          status: row.status,
          expectedDate,
          quantity: Number(item.quantity ?? 0),
        })
      })

      return map
    }, new Map())

  return (Array.isArray(inventoryRows) ? inventoryRows : [])
    .filter((row) => Number(row.inboundExpected) > 0 || inboundScheduleBySku.has(row.sku))
    .map((row) => {
      const schedule = inboundScheduleBySku.get(row.sku)
      const expectedDate = schedule?.expectedDate ?? parseDateString(row.expectedDate)
      const etaMeta = getInboundEtaMeta(schedule?.status ?? row.status)
      const inventoryDetail = row.detail ? normalizeSellerInventoryDetail(row.detail, row) : null
      const expectedQty = Number(schedule?.quantity ?? row.inboundExpected ?? 0)

      return {
        id: `inbound-${row.id ?? row.sku}`,
        period: formatKoreanDate(expectedDate),
        sku: row.sku,
        productName: row.productName,
        expectedQty: formatNumber(expectedQty),
        etaLabel: etaMeta.label,
        etaTone: etaMeta.tone,
        inventory: { ...row, inboundExpected: expectedQty },
        inventoryDetail: schedule?.asnNo && inventoryDetail
          ? { ...inventoryDetail, nextInboundAsnNo: schedule.asnNo }
          : inventoryDetail,
        routeName: ROUTE_NAMES.SELLER_ASN_LIST,
        sortAt: expectedDate?.getTime() ?? -1,
        sortQty: expectedQty,
      }
    })
    .sort((left, right) => {
      if (left.sortAt !== right.sortAt) return right.sortAt - left.sortAt
      return right.sortQty - left.sortQty
    })
    .slice(0, DASHBOARD_INBOUND_LIMIT)
    .map(({ sortAt, sortQty, ...row }) => row)
}

export function buildSellerDashboardTrendChart(points = [], { maxValue = 500 } = {}) {
  const normalizedPoints = Array.isArray(points) ? points : []
  const left = 110
  const right = 660
  const top = 36
  const baseline = 180
  const chartHeight = baseline - top
  const denominator = Math.max(Number(maxValue) || 0, 1)
  const step = normalizedPoints.length > 1 ? (right - left) / (normalizedPoints.length - 1) : 0

  const chartPoints = normalizedPoints.map((point, index) => {
    const normalizedValue = Math.max(0, Number(point.value) || 0)
    const x = left + (step * index)
    const y = baseline - ((normalizedValue / denominator) * chartHeight)

    return {
      x: Math.round(x),
      y: Math.round(y),
      label: point.label,
      value: normalizedValue,
    }
  })

  const linePoints = chartPoints.map((point) => `${point.x},${point.y}`).join(' ')
  const firstPoint = chartPoints[0]
  const lastPoint = chartPoints[chartPoints.length - 1]
  const areaPoints = chartPoints.length
    ? `${linePoints} ${lastPoint.x},${baseline} ${firstPoint.x},${baseline}`
    : ''
  const yLabels = Array.from({ length: 5 }, (_, index) => {
    const value = denominator - ((denominator / 5) * index)
    const y = 24 + (40 * index)

    return {
      value: Math.round(value),
      y,
    }
  })

  return {
    linePoints,
    areaPoints,
    points: chartPoints,
    xLabels: chartPoints.map((point) => ({
      label: point.label,
      x: point.x,
    })),
    yLabels,
  }
}

export function buildSellerDashboardDonutSegments(items = [], circumference = 377) {
  const normalizedItems = Array.isArray(items) ? items : []
  let offset = 0

  return normalizedItems.map((item) => {
    const value = Math.max(0, Number(item.value) || 0)
    const segmentLength = Number(((value / 100) * circumference).toFixed(2))
    const segment = {
      ...item,
      dasharray: `${segmentLength} ${circumference}`,
      dashoffset: Number((-offset).toFixed(2)),
    }

    offset += segmentLength
    return segment
  })
}

export function buildSellerDashboardViewState({
  kpiCards = [],
  trendSeries = null,
  recentActivityRows = [],
  inboundRows = [],
  isLoading = false,
  errorMessage = '',
} = {}) {
  const normalizedErrorMessage = String(errorMessage ?? '').trim()
  const normalizedTrendPoints = Array.isArray(trendSeries?.points) ? trendSeries.points : []
  const hasKpiData = (Array.isArray(kpiCards) ? kpiCards : []).some((card) => {
    return parseDashboardMetricValue(card?.value) > 0
  })
  const hasTrendData = normalizedTrendPoints.some((point) => Number(point?.value || 0) > 0)
  const hasRecentActivity = Array.isArray(recentActivityRows) && recentActivityRows.length > 0
  const hasInboundRows = Array.isArray(inboundRows) && inboundRows.length > 0
  const hasError = Boolean(normalizedErrorMessage)
  const hasContent = hasKpiData || hasTrendData || hasRecentActivity || hasInboundRows

  return {
    isLoading: Boolean(isLoading),
    hasError,
    errorMessage: normalizedErrorMessage,
    isEmpty: !isLoading && !hasError && !hasContent,
    hasKpiData,
    hasTrendData,
    hasRecentActivity,
    hasInboundRows,
  }
}
