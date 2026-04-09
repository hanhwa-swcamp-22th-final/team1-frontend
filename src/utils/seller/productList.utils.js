/**
 * 셀러 상품 목록 화면 표시 유틸.
 */

export const SELLER_PRODUCT_STATUS_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'ACTIVE', label: '판매중' },
  { key: 'LOW_STOCK', label: '재고부족' },
  { key: 'OUT_OF_STOCK', label: '품절' },
  { key: 'INACTIVE', label: '비활성' },
]

export const SELLER_PRODUCT_STATUS_META = {
  ACTIVE: { label: '판매중', tone: 'green' },
  LOW_STOCK: { label: '재고부족', tone: 'amber' },
  OUT_OF_STOCK: { label: '품절', tone: 'red' },
  INACTIVE: { label: '비활성', tone: 'blue' },
}

export const SELLER_PRODUCT_LIST_COLUMNS = [
  { key: 'image', label: '이미지', width: '72px', align: 'center' },
  { key: 'sku', label: 'SKU', width: '130px' },
  { key: 'productName', label: '상품명', width: '220px' },
  { key: 'warehouseName', label: '보관 창고', width: '110px' },
  { key: 'salePrice', label: '판매가', width: '110px' },
  { key: 'costPrice', label: '원가', width: '110px' },
  { key: 'stock', label: '가용 / 할당', width: '130px' },
  { key: 'status', label: '상태', width: '110px' },
  { key: 'actions', label: '관리', width: '140px', align: 'center' },
]

export function buildSellerProductExportRows(rows = []) {
  return rows.map((row) => ({
    SKU: row.sku ?? '',
    상품명: row.productName ?? '',
    카테고리: row.category ?? '',
    보관창고: row.warehouseName ?? '',
    판매가USD: Number(row.salePrice ?? 0),
    원가USD: Number(row.costPrice ?? 0),
    가용재고: Number(row.availableStock ?? 0),
    할당재고: Number(row.allocatedStock ?? 0),
    상태: getSellerProductStatusMeta(row.status).label,
  }))
}

export function getSellerProductStatusMeta(status) {
  return SELLER_PRODUCT_STATUS_META[status] ?? { label: status ?? '-', tone: 'default' }
}

export function normalizeSellerProductDetail(detail = {}, product = {}) {
  const salePrice = Number(product.salePrice ?? 0)
  const costPrice = Number(product.costPrice ?? 0)
  const totalStock = Number(product.availableStock ?? 0) + Number(product.allocatedStock ?? 0)
  const marginAmount = Number((salePrice - costPrice).toFixed(2))
  const marginRate = salePrice > 0 ? Number((((salePrice - costPrice) / salePrice) * 100).toFixed(1)) : 0

  return {
    brand: detail?.brand ?? '',
    barcode: detail?.barcode ?? '',
    originCountry: detail?.originCountry ?? '',
    hsCode: detail?.hsCode ?? '',
    customsValue: detail?.customsValue ?? 0,
    unitWeightLbs: detail?.unitWeightLbs ?? 0,
    dimensions: detail?.dimensions ?? '',
    leadTimeDays: detail?.leadTimeDays ?? 0,
    shelfLifeMonths: detail?.shelfLifeMonths ?? 0,
    description: detail?.description ?? '',
    memo: detail?.memo ?? '',
    keywords: Array.isArray(detail?.keywords) ? detail.keywords : [],
    totalStock,
    marginAmount,
    marginRate,
    lowStockAlert: Boolean(detail?.lowStockAlert),
    amazonSync: Boolean(detail?.amazonSync),
    stockAlertThreshold: Number(detail?.stockAlertThreshold ?? 0),
    minOrderQuantity: Number(detail?.minOrderQuantity ?? 1),
    imageNames: Array.isArray(detail?.imageNames) ? detail.imageNames : [],
    asin: detail?.asin ?? '',
  }
}
