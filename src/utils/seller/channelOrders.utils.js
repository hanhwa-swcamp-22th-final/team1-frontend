/**
 * 셀러 주문 연동 및 조회 화면 표시 유틸.
 */

export const SELLER_CHANNEL_SYNC_STATUS_META = {
  CONNECTED: { label: '연결됨', tone: 'green' },
  PLANNED: { label: 'Phase 2 예정', tone: 'gold' },
  DISCONNECTED: { label: '미연결', tone: 'red' },
}

export const SELLER_CHANNEL_META = {
  AMAZON: { label: 'Amazon', tone: 'gold' },
  SHOPIFY: { label: 'Shopify', tone: 'blue' },
  MANUAL: { label: '수동', tone: 'default' },
  QOO10: { label: 'Qoo10', tone: 'red' },
}

export const SELLER_CHANNEL_ORDER_STATUS_META = {
  NEW: { label: '신규', tone: 'blue' },
  PROCESSING: { label: '처리중', tone: 'amber' },
  READY: { label: '출고준비', tone: 'amber' },
  SHIPPED: { label: '출고완료', tone: 'green' },
  DELIVERED: { label: '배송완료', tone: 'purple' },
}

export const SELLER_CHANNEL_FILTER_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'AMAZON', label: 'Amazon' },
  { key: 'SHOPIFY', label: 'Shopify' },
  { key: 'MANUAL', label: '수동' },
  { key: 'QOO10', label: 'Qoo10' },
]

export const SELLER_CHANNEL_ORDER_COLUMNS = [
  { key: 'channel', label: '채널', width: '110px' },
  { key: 'channelOrderNo', label: '채널 주문번호', width: '150px' },
  { key: 'conkOrderNo', label: 'CONK 주문번호', width: '150px' },
  { key: 'recipient', label: '수령자', width: '130px' },
  { key: 'itemsSummary', label: '주문 상품' },
  { key: 'orderAmount', label: '주문 금액', width: '120px', align: 'right' },
  { key: 'orderedAt', label: '주문일', width: '140px' },
  { key: 'status', label: '처리 상태', width: '120px', align: 'center' },
]

export function getSellerChannelSyncStatusMeta(status) {
  return SELLER_CHANNEL_SYNC_STATUS_META[status] ?? { label: status ?? '-', tone: 'default' }
}

export function getSellerChannelMeta(channel) {
  return SELLER_CHANNEL_META[channel] ?? { label: channel ?? '-', tone: 'default' }
}

export function getSellerChannelOrderStatusMeta(status) {
  return SELLER_CHANNEL_ORDER_STATUS_META[status] ?? { label: status ?? '-', tone: 'default' }
}

function normalizeText(value, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function normalizeNumber(value, fallback = 0) {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : fallback
}

export function normalizeSellerChannelDateTime(value, fallback = '-') {
  const normalized = normalizeText(value)
  if (!normalized) return fallback

  return normalized.replace('T', ' ').slice(0, 16)
}

export function normalizeSellerChannelOrderRow(row = {}) {
  return {
    ...row,
    id: normalizeText(row.id ?? row.orderId),
    channel: normalizeText(row.channel, 'MANUAL').toUpperCase(),
    channelOrderNo: normalizeText(row.channelOrderNo),
    conkOrderNo: normalizeText(row.conkOrderNo ?? row.id ?? row.orderId),
    recipient: normalizeText(row.recipient),
    itemsSummary: normalizeText(row.itemsSummary),
    orderAmount: normalizeNumber(row.orderAmount),
    orderedAt: normalizeSellerChannelDateTime(row.orderedAt),
    status: normalizeText(row.status, 'NEW').toUpperCase(),
  }
}

export function normalizeSellerChannelOrderPage(payload = {}) {
  const itemsSource = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : []

  const items = itemsSource.map(normalizeSellerChannelOrderRow)

  return {
    items,
    total: normalizeNumber(payload?.total, items.length),
    page: normalizeNumber(payload?.page),
    size: normalizeNumber(payload?.size, items.length),
  }
}

export function buildSellerChannelOrderExportRows(rows = []) {
  return rows.map((row) => ({
    채널: getSellerChannelMeta(row.channel).label,
    채널주문번호: row.channelOrderNo ?? '',
    CONK주문번호: row.conkOrderNo ?? '',
    수령자: row.recipient ?? '',
    주문상품: row.itemsSummary ?? '',
    주문금액USD: Number(row.orderAmount ?? 0),
    주문일시: row.orderedAt ?? '',
    처리상태: getSellerChannelOrderStatusMeta(row.status).label,
  }))
}

// 채널별 고정 설명 문구 (BE가 내려주지 않으므로 FE에서 정의)
const SELLER_CHANNEL_CARD_DESCRIPTION = {
  SHOPIFY: 'Shopify 스토어와 연동하여 주문을 자동으로 동기화합니다.',
  AMAZON: 'Amazon 채널과 연동하여 주문을 통합 관리합니다.',
  MANUAL: '수동으로 주문을 입력하고 관리합니다.',
  QOO10: 'Qoo10 채널과 연동하여 주문을 통합 관리합니다.',
}

// syncStatus별 액션 버튼 목록 (BE가 내려주지 않으므로 FE에서 정의)
const SELLER_CHANNEL_CARD_ACTIONS = {
  CONNECTED: [
    { key: 'sync', label: '동기화', variant: 'primary', disabled: false },
    { key: 'import', label: '주문 가져오기', variant: 'ghost', disabled: false },
  ],
  DISCONNECTED: [
    { key: 'connect', label: '연동하기', variant: 'primary', disabled: false },
  ],
  NOT_CONFIGURED: [
    { key: 'connect', label: '연동하기', variant: 'primary', disabled: false },
  ],
  PLANNED: [],
}

export function getSellerChannelCardDescription(channelKey) {
  return SELLER_CHANNEL_CARD_DESCRIPTION[channelKey] ?? ''
}

export function getSellerChannelCardActions(syncStatus) {
  return (
    SELLER_CHANNEL_CARD_ACTIONS[syncStatus] ?? [
      { key: 'connect', label: '연동하기', variant: 'primary', disabled: false },
    ]
  )
}
