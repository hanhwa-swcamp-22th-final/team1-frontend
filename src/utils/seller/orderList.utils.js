/**
 * 셀러 주문 목록 화면 표시 유틸.
 */

export const SELLER_ORDER_STATUS_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'RECEIVED', label: '접수됨' },
  { key: 'ALLOCATED', label: '할당완료' },
  { key: 'DISPATCHED', label: '출고지시됨' },
  { key: 'WAITING', label: '출고 대기중' },
  { key: 'COMPLETED', label: '출고완료' },
  { key: 'CANCELLED', label: '취소됨' },
]

export const SELLER_ORDER_CHANNEL_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'Amazon', label: 'Amazon' },
  { key: '수동', label: '수동' },
  { key: '엑셀', label: '엑셀' },
]

export const SELLER_ORDER_STATUS_META = {
  RECEIVED: { label: '접수됨', tone: 'blue' },
  ALLOCATED: { label: '할당완료', tone: 'indigo' },
  DISPATCHED: { label: '출고지시됨', tone: 'amber' },
  WAITING: { label: '출고 대기중', tone: 'gold' },
  COMPLETED: { label: '출고완료', tone: 'green' },
  CANCELLED: { label: '취소됨', tone: 'red' },
}

export const SELLER_ORDER_CHANNEL_META = {
  AMAZON: { label: 'Amazon', tone: 'amazon' },
  Amazon: { label: 'Amazon', tone: 'amazon' },
  SHOPIFY: { label: 'Shopify', tone: 'shopify' },
  수동: { label: '수동', tone: 'manual' },
  MANUAL: { label: '수동', tone: 'manual' },
  엑셀: { label: '엑셀', tone: 'excel' },
  EXCEL: { label: '엑셀', tone: 'excel' },
}

export const SELLER_ORDER_PROGRESS_STEPS = [
  { key: 'RECEIVED', label: '접수' },
  { key: 'ALLOCATED', label: '할당' },
  { key: 'WAITING', label: '출고 대기' },
  { key: 'DISPATCHED', label: '출고 지시' },
  { key: 'COMPLETED', label: '출고 완료' },
]

export const SELLER_ORDER_LIST_COLUMNS = [
  { key: 'orderId', label: '주문번호', width: '170px' },
  { key: 'channel', label: '채널', width: '100px' },
  { key: 'recipient', label: '수령자', width: '120px' },
  { key: 'address', label: '배송지', width: '190px' },
  { key: 'itemsSummary', label: '주문 상품', width: '220px' },
  { key: 'orderedAt', label: '주문일', width: '140px' },
  { key: 'status', label: '상태', width: '120px' },
  { key: 'trackingNo', label: '송장번호', width: '160px' },
  { key: 'actions', label: '관리', width: '90px', align: 'center' },
]

export function buildSellerOrderExportRows(rows = []) {
  return rows.map((row) => ({
    주문번호: row.orderId ?? row.id ?? '',
    채널: getSellerOrderChannelMeta(row.channel).label,
    수령자: row.recipient ?? '',
    배송지: row.address ?? '',
    주문상품: row.itemsSummary ?? '',
    주문일시: row.orderedAt ?? '',
    상태: getSellerOrderStatusMeta(row.status).label,
    송장번호: row.trackingNo ?? '',
  }))
}

export function buildSellerOrderListQuery(filters = {}) {
  const page = Number(filters.page ?? 0)
  const size = Number(filters.size ?? 10)

  return {
    page: Number.isFinite(page) && page >= 0 ? page : 0,
    size: Number.isFinite(size) && size > 0 ? size : 10,
    status: filters.status && filters.status !== 'all' ? filters.status : undefined,
  }
}

export function getSellerOrderStatusMeta(status) {
  return SELLER_ORDER_STATUS_META[status] ?? { label: status ?? '-', tone: 'default' }
}

export function getSellerOrderChannelMeta(channel) {
  return SELLER_ORDER_CHANNEL_META[channel] ?? { label: channel ?? '-', tone: 'default' }
}

export function getSellerOrderProgressStep(status) {
  const matchedStep = SELLER_ORDER_PROGRESS_STEPS.find((step) => step.key === status)
  return matchedStep?.key ?? 'RECEIVED'
}

function joinAddress(parts = []) {
  return parts
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(' ')
}

function resolveSellerOrderId(order = {}) {
  return String(order.orderId ?? order.orderNo ?? order.id ?? '').trim()
}

export function normalizeSellerOrderRow(row = {}) {
  const orderId = resolveSellerOrderId(row)
  const itemCount = Math.max(0, Number(row.itemCount ?? 0) || 0)

  return {
    ...row,
    id: orderId || String(row.id ?? '').trim(),
    orderId,
    channel: row.channel ?? row.orderChannel ?? '',
    recipient: row.recipient ?? row.receiverName ?? '',
    address: row.address ?? joinAddress([row.street1, row.street2]),
    itemsSummary: row.itemsSummary ?? (itemCount > 0 ? `상품 ${itemCount}건` : ''),
    trackingNo: row.trackingNo ?? '',
    canCancel: Boolean(row.canCancel),
  }
}

export function normalizeSellerOrderListPayload(payload = {}) {
  const rows = Array.isArray(payload?.orders) ? payload.orders : []

  return {
    orders: rows.map((row) => normalizeSellerOrderRow(row)),
    totalCount: Math.max(0, Number(payload?.totalCount ?? 0) || 0),
    page: Math.max(0, Number(payload?.page ?? 0) || 0),
    size: Math.max(0, Number(payload?.size ?? rows.length) || 0),
  }
}

export function normalizeSellerOrderDetail(detail = {}, order = {}) {
  const normalizedOrder = normalizeSellerOrderRow(order)
  const items = Array.isArray(detail?.items)
    ? detail.items.map((item) => ({
        sku: String(item.sku ?? '').trim(),
        productName: String(item.productName ?? '').trim(),
        quantity: Number(item.quantity ?? 0),
      }))
    : []

  return {
    orderId: String(detail?.orderId ?? normalizedOrder.orderId ?? '').trim(),
    orderedAt: detail?.orderedAt ?? normalizedOrder.orderedAt ?? '-',
    status: detail?.status ?? normalizedOrder.status ?? '-',
    orderChannel: detail?.orderChannel ?? normalizedOrder.channel ?? '-',
    receiverName: detail?.receiverName ?? normalizedOrder.recipient ?? '-',
    phone: detail?.phone ?? normalizedOrder.phone ?? '-',
    memo: detail?.memo ?? '',
    street1: detail?.street1 ?? normalizedOrder.street1 ?? normalizedOrder.address ?? '-',
    street2: detail?.street2 ?? normalizedOrder.street2 ?? '',
    state: detail?.state ?? normalizedOrder.state ?? '-',
    zip: detail?.zip ?? normalizedOrder.zip ?? '-',
    country: detail?.country ?? normalizedOrder.country ?? '-',
    canCancel: Boolean(detail?.canCancel ?? normalizedOrder.canCancel),
    items,
  }
}
