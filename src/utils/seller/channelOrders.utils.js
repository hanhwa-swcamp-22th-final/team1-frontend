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
