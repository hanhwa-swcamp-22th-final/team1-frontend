/**
 * 셀러 주문 등록 관련 유틸 모음.
 * 업로드 포맷과 API 기반 옵션 데이터를 화면 전용 형태로 정리한다.
 */
import { validateSku } from '@/utils/validate.js'

export const SELLER_ORDER_REGISTER_TABS = [
  { key: 'manual', label: '단건 주문 등록' },
  { key: 'bulk', label: '일괄 주문 등록' },
]

export const SELLER_BULK_ORDER_REGISTER_TABS = [
  { key: 'excel', label: '엑셀 업로드' },
  { key: 'shopify', label: 'Shopify 연동' },
]

export const ORDER_UPLOAD_REQUIRED_COLUMNS = [
  '주문번호',
  '주문일자',
  '수령인',
  '연락처',
  'State',
  'City',
  'Zip Code',
  '배송지',
  'SKU',
  '수량',
]

export const ORDER_PREVIEW_COLUMNS = [
  { key: 'orderNo', label: '주문번호', width: '150px' },
  { key: 'orderDate', label: '주문일자', width: '120px' },
  { key: 'recipient', label: '수령인', width: '100px' },
  { key: 'contact', label: '연락처', width: '140px' },
  { key: 'state', label: 'State', width: '120px' },
  { key: 'city', label: 'City', width: '120px' },
  { key: 'zipCode', label: 'Zip', width: '100px' },
  { key: 'address', label: '배송지' },
  { key: 'sku', label: 'SKU', width: '150px' },
  { key: 'quantity', label: '수량', width: '90px', align: 'right' },
  { key: 'requestNote', label: '요청사항', width: '180px' },
]

const ORDER_TEMPLATE_DOWNLOAD_COLUMNS = [
  '주문번호',
  '주문일자',
  '수령인',
  '연락처',
  'State',
  'City',
  'Zip Code',
  '배송지',
  'SKU',
  '수량',
  '요청사항',
]

function pad(value) {
  return String(value).padStart(2, '0')
}

function escapeCsvValue(value) {
  const normalized = String(value ?? '').replace(/"/g, '""')
  return `"${normalized}"`
}

function normalizeDateLike(value) {
  const parsed = value instanceof Date ? new Date(value) : new Date(String(value ?? '').trim())
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function normalizeProductOption(product = {}) {
  return {
    sku: String(product.sku ?? '').trim(),
    productName: String(product.productName ?? product.name ?? '').trim(),
    availableStock: Number(product.availableStock ?? product.stock ?? 0),
    unitPrice: Number(product.unitPrice ?? product.price ?? product.salePrice ?? 0),
  }
}

function normalizeProductLine(line = {}, index = 0) {
  const rawQuantity = Number(line.quantity ?? 1)

  return {
    id: line.id ?? `order-item-${index + 1}`,
    sku: String(line.sku ?? '').trim(),
    quantity: Number.isFinite(rawQuantity) ? rawQuantity : 1,
  }
}

export function normalizeOrderRegisterTab(tab = 'manual') {
  const normalizedTab = String(tab ?? '').trim()
  return SELLER_ORDER_REGISTER_TABS.some((item) => item.key === normalizedTab) ? normalizedTab : 'manual'
}

export function normalizeBulkOrderRegisterTab(tab = 'excel') {
  const normalizedTab = String(tab ?? '').trim()
  return SELLER_BULK_ORDER_REGISTER_TABS.some((item) => item.key === normalizedTab) ? normalizedTab : 'excel'
}

export function createOrderProductLine(lineId = 'order-item-1') {
  return {
    id: lineId,
    sku: '',
    quantity: 1,
  }
}

export function normalizeOrderProductOptions(products = []) {
  return (Array.isArray(products) ? products : [])
    .map(normalizeProductOption)
    .filter((product) => product.sku)
}

export function getOrderProductOption(sku = '', productOptions = []) {
  const normalizedSku = String(sku ?? '').trim()
  return normalizeOrderProductOptions(productOptions).find((item) => item.sku === normalizedSku) ?? null
}

export function buildOrderProductLineSummary(line = {}, productOptions = []) {
  const product = getOrderProductOption(line.sku, productOptions)
  const quantity = Math.max(1, Number(line.quantity ?? 1) || 1)
  const unitPrice = Number(product?.unitPrice ?? 0)
  const availableStock = Number(product?.availableStock ?? 0)
  const subtotal = unitPrice * quantity

  return {
    productName: product?.productName ?? '',
    availableStock,
    unitPrice,
    subtotal,
    isLowStock: Boolean(product) && availableStock <= 20,
  }
}

export function generateSellerOrderNumber(baseDate = new Date(), sequence = 1) {
  const date = normalizeDateLike(baseDate)
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const normalizedSequence = Math.max(1, Number(sequence ?? 1) || 1)

  return `ORD-${year}${month}${day}-${String(normalizedSequence).padStart(3, '0')}`
}

export function getMissingOrderUploadColumns(headers = []) {
  const normalizedHeaders = new Set(
    headers
      .map((header) => String(header).trim())
      .filter(Boolean),
  )

  return ORDER_UPLOAD_REQUIRED_COLUMNS.filter((header) => !normalizedHeaders.has(header))
}

export function mapOrderUploadRows(rows = []) {
  return rows.map((row, index) => ({
    id: `upload-order-${index + 1}`,
    orderNo: String(row['주문번호'] ?? '').trim(),
    orderDate: String(row['주문일자'] ?? '').trim(),
    recipient: String(row['수령인'] ?? '').trim(),
    contact: String(row['연락처'] ?? '').trim(),
    state: String(row.State ?? '').trim(),
    city: String(row.City ?? '').trim(),
    zipCode: String(row['Zip Code'] ?? '').trim(),
    address: String(row['배송지'] ?? '').trim(),
    sku: String(row.SKU ?? '').trim(),
    quantity: String(row['수량'] ?? '').trim(),
    requestNote: String(row['요청사항'] ?? '').trim(),
  }))
}

export function buildManualOrderPayload(form = {}, { baseDate = new Date(), productOptions = [] } = {}) {
  const normalizedItems = (Array.isArray(form.items) ? form.items : [])
    .map((line, index) => normalizeProductLine(line, index))
    .filter((line) => line.sku && line.quantity > 0)
    .map((line) => {
      const product = getOrderProductOption(line.sku, productOptions)
      const unitPrice = Number(product?.unitPrice ?? 0)

      return {
        sku: line.sku,
        productName: product?.productName ?? '',
        quantity: line.quantity,
        unitPrice,
        subtotal: unitPrice * line.quantity,
      }
    })

  const fallbackSku = String(form.sku ?? '').trim()
  const fallbackQuantity = Number(form.quantity ?? 0)
  const orderDate = String(form.orderDate ?? '').trim()
  const orderNo = Boolean(form.autoGenerateOrderNo)
    ? generateSellerOrderNumber(orderDate || baseDate)
    : String(form.orderNo ?? '').trim()

  return {
    orderNo,
    orderDate,
    salesChannel: String(form.salesChannel ?? '').trim(),
    autoGenerateOrderNo: Boolean(form.autoGenerateOrderNo),
    recipient: String(form.recipient ?? '').trim(),
    contact: String(form.contact ?? '').trim(),
    state: String(form.state ?? '').trim(),
    city: String(form.city ?? '').trim(),
    zipCode: String(form.zipCode ?? '').trim(),
    postalCode: String(form.zipCode ?? form.postalCode ?? '').trim(),
    address1: String(form.address1 ?? '').trim(),
    address2: String(form.address2 ?? '').trim(),
    sku: normalizedItems[0]?.sku ?? fallbackSku,
    quantity: normalizedItems[0]?.quantity ?? fallbackQuantity,
    items: normalizedItems,
    memo: String(form.memo ?? '').trim(),
  }
}

export function buildBulkOrderPayload(rows = []) {
  return rows.map((row) => ({
    orderNo: String(row.orderNo ?? '').trim(),
    orderDate: String(row.orderDate ?? '').trim(),
    recipient: String(row.recipient ?? '').trim(),
    contact: String(row.contact ?? '').trim(),
    state: String(row.state ?? '').trim(),
    city: String(row.city ?? '').trim(),
    zipCode: String(row.zipCode ?? '').trim(),
    address: String(row.address ?? '').trim(),
    sku: String(row.sku ?? '').trim(),
    quantity: Number(row.quantity ?? 0),
    requestNote: String(row.requestNote ?? '').trim(),
  }))
}

export function buildOrderTemplateCsv(rows = []) {
  const normalizedRows = Array.isArray(rows) ? rows : []
  const lines = [
    ORDER_TEMPLATE_DOWNLOAD_COLUMNS.map(escapeCsvValue).join(','),
    ...normalizedRows.map((row) => (
      [
        row.orderNo,
        row.orderDate,
        row.recipient,
        row.contact,
        row.state,
        row.city,
        row.zipCode,
        row.address,
        row.sku,
        row.quantity,
        row.requestNote,
      ]
        .map(escapeCsvValue)
        .join(',')
    )),
  ]

  return lines.join('\n')
}

export function buildOrderUploadResultSummary(rows = [], fileName = '') {
  const normalizedRows = Array.isArray(rows) ? rows : []

  return {
    fileName: String(fileName ?? '').trim(),
    rowCount: normalizedRows.length,
    totalQuantity: normalizedRows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0),
    uniqueSkuCount: new Set(normalizedRows.map((row) => String(row.sku ?? '').trim()).filter(Boolean)).size,
    uniqueRecipientCount: new Set(
      normalizedRows.map((row) => String(row.recipient ?? '').trim()).filter(Boolean),
    ).size,
    firstOrderNo: normalizedRows[0]?.orderNo ?? '-',
  }
}

export function buildChannelImportPreviewMessage(channelLabel = '', syncWindow = '', pendingOrders = 0) {
  const normalizedChannelLabel = String(channelLabel ?? '').trim() || '채널'
  const normalizedWindow = String(syncWindow ?? '').trim() || '최근 7일'
  const normalizedCount = Math.max(0, Number(pendingOrders ?? 0) || 0)

  return `${normalizedWindow} 기준 미등록 ${normalizedChannelLabel} 주문 ${normalizedCount}건을 가져올 준비가 완료되었습니다.`
}

export function validateOrderForm(form = {}, productOptions = []) {
  const errors = {
    orderNo: '',
    orderDate: '',
    recipient: '',
    contact: '',
    state: '',
    city: '',
    zipCode: '',
    address1: '',
    sku: '',
    quantity: '',
    items: '',
  }

  if (!Boolean(form.autoGenerateOrderNo) && !String(form.orderNo ?? '').trim()) {
    errors.orderNo = '주문번호를 입력하세요.'
  }
  if (!form.orderDate) errors.orderDate = '주문일자를 선택하세요.'
  if (!String(form.recipient ?? '').trim()) errors.recipient = '수령인을 입력하세요.'
  if (!String(form.contact ?? '').trim()) errors.contact = '연락처를 입력하세요.'
  if (!String(form.state ?? '').trim()) errors.state = 'State를 선택하세요.'
  if (!String(form.city ?? '').trim()) errors.city = 'City를 입력하세요.'
  if (!String(form.zipCode ?? '').trim()) errors.zipCode = 'Zip Code를 입력하세요.'
  if (!String(form.address1 ?? '').trim()) errors.address1 = '기본 배송지를 입력하세요.'

  const normalizedItems = (Array.isArray(form.items) ? form.items : []).map((line, index) =>
    normalizeProductLine(line, index),
  )
  const validItems = normalizedItems.filter((line) => line.sku && line.quantity > 0)
  const firstLine = normalizedItems[0] ?? { sku: form.sku, quantity: form.quantity }
  const invalidSkuLine = normalizedItems.find((line) => !String(line.sku ?? '').trim() || !validateSku(line.sku))
  const invalidQuantityLine = normalizedItems.find((line) => !line.quantity || Number(line.quantity) < 1)
  const sku = String((invalidSkuLine ?? firstLine).sku ?? '').trim()

  if (!validItems.length && !sku) {
    errors.items = '주문 상품을 1개 이상 추가하세요.'
  }

  if (!sku) {
    errors.sku = 'SKU를 선택하세요.'
  } else if (!validateSku(sku)) {
    errors.sku = 'SKU 형식이 올바르지 않습니다.'
  } else if (productOptions.length && !getOrderProductOption(sku, productOptions)) {
    errors.sku = '유효한 SKU를 선택하세요.'
  }

  if (invalidQuantityLine || !firstLine.quantity || Number(firstLine.quantity) < 1) {
    errors.quantity = '수량은 1 이상이어야 합니다.'
  }

  return errors
}
