/**
 * 셀러 ASN 목록 화면 표시 유틸.
 */
import { ASN_STATUS } from '@/constants/index.js'

export const SELLER_ASN_LIST_COLUMNS = [
  { key: 'asnNo', label: 'ASN 번호', width: '170px' },
  { key: 'warehouseName', label: '목적 창고', width: '140px' },
  { key: 'expectedDate', label: '입고 예정일', width: '120px' },
  { key: 'skuCount', label: 'SKU 수', width: '90px', align: 'right' },
  { key: 'totalQuantity', label: '총 입고 수량', width: '110px', align: 'right' },
  { key: 'referenceNo', label: '참조 번호', width: '130px' },
  { key: 'createdAt', label: '등록일', width: '110px' },
  { key: 'status', label: '상태', width: '100px' },
  { key: 'actions', label: '관리', width: '150px', align: 'center' },
]

export function normalizeSellerAsnDetail(detail = {}, row = {}) {
  const items = Array.isArray(detail?.items)
    ? detail.items.map((item) => ({
        sku: item.sku ?? '',
        productName: item.productName ?? '',
        quantity: Number(item.quantity ?? 0),
        cartons: Number(item.cartons ?? item.cartonCount ?? 0),
      }))
    : []

  return {
    supplierName: detail?.supplierName ?? detail?.senderName ?? row.senderName ?? '-',
    originCountry: detail?.originCountry ?? row.originCountry ?? '-',
    originPort: detail?.originPort ?? detail?.senderAddress ?? row.senderAddress ?? '-',
    transportMode: detail?.transportMode ?? detail?.shippingMethod ?? row.shippingMethod ?? '-',
    incoterms: detail?.incoterms ?? '-',
    bookingNo: detail?.bookingNo ?? '-',
    carrier: detail?.carrier ?? '-',
    arrivalWindow: detail?.arrivalWindow ?? row.expectedDate ?? '-',
    documents: Array.isArray(detail?.documents) ? detail.documents : [],
    items,
    totalCartons: items.reduce((sum, item) => sum + Number(item.cartons ?? 0), 0),
  }
}

export function getSellerAsnKpi(rows = []) {
  return {
    total: rows.length,
    submitted: rows.filter((row) => row.status === ASN_STATUS.SUBMITTED).length,
    received: rows.filter((row) => row.status === ASN_STATUS.RECEIVED).length,
    cancelled: rows.filter((row) => row.status === ASN_STATUS.CANCELLED).length,
  }
}

export function buildSellerAsnExportRows(rows = []) {
  return rows.map((row) => ({
    ASN번호: row.asnNo ?? '',
    목적창고: row.warehouseName ?? '',
    입고예정일: row.expectedDate ?? '',
    SKU수: Number(row.skuCount ?? 0),
    총입고수량: Number(row.totalQuantity ?? 0),
    참조번호: row.referenceNo ?? '',
    등록일: row.createdAt ?? '',
    상태: row.status ?? '',
    메모: row.note ?? '',
  }))
}
