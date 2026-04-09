/**
 * 셀러 재고 목록 화면 표시 유틸.
 */

export const SELLER_INVENTORY_STATUS_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'NORMAL', label: '정상' },
  { key: 'LOW', label: '부족' },
  { key: 'OUT', label: '품절' },
]

export const SELLER_INVENTORY_STATUS_META = {
  NORMAL: { label: '정상', tone: 'green' },
  LOW: { label: '재고부족', tone: 'amber' },
  OUT: { label: '품절', tone: 'red' },
}

export const SELLER_INVENTORY_LIST_COLUMNS = [
  { key: 'sku', label: 'SKU', width: '130px' },
  { key: 'productName', label: '상품명', width: '220px' },
  { key: 'warehouseName', label: '창고', width: '110px' },
  { key: 'availableStock', label: '가용재고', width: '110px', align: 'right' },
  { key: 'allocatedStock', label: '할당재고', width: '110px', align: 'right' },
  { key: 'totalStock', label: '총재고', width: '110px', align: 'right' },
  { key: 'inboundExpected', label: '입고예정', width: '110px', align: 'right' },
  { key: 'lastInboundDate', label: '최근 입고일', width: '130px' },
  { key: 'warningThreshold', label: '경고 임계치', width: '120px', align: 'right' },
  { key: 'status', label: '상태', width: '120px' },
]

export function buildSellerInventoryExportRows(rows = []) {
  return rows.map((row) => ({
    SKU: row.sku ?? '',
    상품명: row.productName ?? '',
    창고: row.warehouseName ?? '',
    가용재고: Number(row.availableStock ?? 0),
    할당재고: Number(row.allocatedStock ?? 0),
    총재고: Number(row.totalStock ?? 0),
    입고예정: Number(row.inboundExpected ?? 0),
    최근입고일: row.lastInboundDate ?? '',
    경고임계치: Number(row.warningThreshold ?? 0),
    상태: getSellerInventoryStatusMeta(row.status).label,
  }))
}

export function getSellerInventoryStatusMeta(status) {
  return SELLER_INVENTORY_STATUS_META[status] ?? { label: status ?? '-', tone: 'default' }
}

export function normalizeSellerInventoryDetail(detail = {}, row = {}) {
  const totalStock = Number(row.totalStock ?? 0)
  const availableStock = Number(row.availableStock ?? 0)
  const allocatedStock = Number(row.allocatedStock ?? 0)
  const availableRate = totalStock > 0 ? Number(((availableStock / totalStock) * 100).toFixed(1)) : 0
  const allocatedRate = totalStock > 0 ? Number(((allocatedStock / totalStock) * 100).toFixed(1)) : 0

  return {
    locationCode: detail?.locationCode ?? '',
    safetyStockDays: detail?.safetyStockDays ?? 0,
    coverageDays: detail?.coverageDays ?? 0,
    turnoverRate: detail?.turnoverRate ?? '',
    lastCycleCount: detail?.lastCycleCount ?? '',
    nextInboundAsnNo: detail?.nextInboundAsnNo ?? '',
    salesChannel: detail?.salesChannel ?? '',
    memo: detail?.memo ?? '',
    availableRate,
    allocatedRate,
  }
}
