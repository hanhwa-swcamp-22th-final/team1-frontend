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
  Amazon: { label: 'Amazon', tone: 'amazon' },
  수동: { label: '수동', tone: 'manual' },
  엑셀: { label: '엑셀', tone: 'excel' },
}

export const SELLER_ORDER_PROGRESS_STEPS = [
  { key: 'RECEIVED', label: '접수' },
  { key: 'ALLOCATED', label: '할당' },
  { key: 'WAITING', label: '출고 대기' },
  { key: 'DISPATCHED', label: '출고 지시' },
  { key: 'COMPLETED', label: '출고 완료' },
]

export const SELLER_ORDER_LIST_COLUMNS = [
  { key: 'orderNo', label: '주문번호', width: '170px' },
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
    주문번호: row.orderNo ?? '',
    채널: getSellerOrderChannelMeta(row.channel).label,
    수령자: row.recipient ?? '',
    배송지: row.address ?? '',
    주문상품: row.itemsSummary ?? '',
    주문일시: row.orderedAt ?? '',
    상태: getSellerOrderStatusMeta(row.status).label,
    송장번호: row.trackingNo ?? '',
  }))
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

export function normalizeSellerOrderDetail(detail = {}, order = {}) {
  const items = Array.isArray(detail?.items)
    ? detail.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity ?? 0),
        unitPrice: Number(item.unitPrice ?? 0),
        amount: Number(item.amount ?? (Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0))),
      }))
    : []

  return {
    receiverPhone: detail?.receiverPhone ?? '-',
    state: detail?.state ?? '-',
    city: detail?.city ?? '-',
    zipCode: detail?.zipCode ?? '-',
    addressLine: detail?.addressLine ?? order.address ?? '-',
    shippingMethod: detail?.shippingMethod ?? '-',
    carrier: detail?.carrier ?? '-',
    memo: detail?.memo ?? '',
    items,
  }
}
