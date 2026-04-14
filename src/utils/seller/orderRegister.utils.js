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

/* 테스트·데모용 샘플 상품 목록. */
export const SAMPLE_PRODUCT_OPTIONS = [
  { sku: 'LB-AMP-30', productName: '루미에르 앰플 30ml', availableStock: 50, unitPrice: 45 },
  { sku: 'LB-CRM-100', productName: '비타민C 크림 100ml', availableStock: 12, unitPrice: 35 },
  { sku: 'LB-MSK-5P', productName: '콜라겐 마스크 5매입', availableStock: 80, unitPrice: 25 },
  { sku: 'LB-TNR-150', productName: '센서티브 토너 150ml', availableStock: 35, unitPrice: 30 },
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

export function buildManualOrderPayload(form = {}, { productOptions = [] } = {}) {
  const normalizedItems = (Array.isArray(form.items) ? form.items : [])
    .map((line, index) => normalizeProductLine(line, index))
    .filter((line) => line.sku && line.quantity > 0)
    .map((line) => ({
      sku: line.sku,
      quantity: line.quantity,
      productNameSnapshot: getOrderProductOption(line.sku, productOptions)?.productName ?? '',
    }))

  const orderDate = String(form.orderDate ?? '').trim()

  return {
    orderedAt: orderDate ? `${orderDate}T00:00:00` : new Date().toISOString().slice(0, 19),
    receiverName: String(form.recipient ?? '').trim(),
    receiverPhoneNo: String(form.contact ?? '').trim(),
    shippingAddress: {
      address1: String(form.address1 ?? '').trim(),
      address2: String(form.address2 ?? '').trim(),
      city: String(form.city ?? '').trim(),
      state: String(form.state ?? '').trim(),
      zipCode: String(form.zipCode ?? '').trim(),
    },
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

const ORDER_TEMPLATE_SAMPLE_ROW = {
  orderNo: 'ORD-20260321-001',
  orderDate: '2026-03-21',
  recipient: '홍길동',
  contact: '010-1234-5678',
  state: 'California',
  city: 'Los Angeles',
  zipCode: '90001',
  address: '123 Flower Ave',
  sku: 'LB-AMP-30',
  quantity: 1,
  requestNote: '',
}

export function buildOrderTemplateCsv(rows = []) {
  const normalizedRows = Array.isArray(rows) && rows.length ? rows : [ORDER_TEMPLATE_SAMPLE_ROW]
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

export function resolveTemplateDownloadFilename(
  contentDisposition = '',
  fallback = 'order_upload_template.xlsx',
) {
  const header = String(contentDisposition ?? '').trim()
  if (!header) return fallback

  const utf8Match = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim())
    } catch {
      return utf8Match[1].trim()
    }
  }

  const quotedMatch = header.match(/filename\s*=\s*"([^"]+)"/i)
  if (quotedMatch?.[1]) return quotedMatch[1].trim()

  const plainMatch = header.match(/filename\s*=\s*([^;]+)/i)
  if (plainMatch?.[1]) return plainMatch[1].trim()

  return fallback
}

function normalizeBulkValidationErrors(errors = []) {
  return (Array.isArray(errors) ? errors : [])
    .map((error) => {
      const row = Number(error?.row ?? 0)
      const message = String(error?.message ?? '').trim()

      return {
        row: Number.isFinite(row) && row > 0 ? row : 0,
        message,
      }
    })
    .filter((error) => error.row || error.message)
}

function normalizeBulkValidationCount(value, fallback = 0) {
  const normalized = Number(value)
  return Number.isFinite(normalized) && normalized >= 0 ? normalized : fallback
}

export function buildOrderUploadResultSummary(rows = [], fileName = '', validation = null) {
  const normalizedRows = Array.isArray(rows) ? rows : []
  const errors = normalizeBulkValidationErrors(validation?.errors)
  const totalRows = normalizeBulkValidationCount(validation?.totalRows, normalizedRows.length)
  const validRows = normalizeBulkValidationCount(
    validation?.validRows,
    Math.max(totalRows - errors.length, 0),
  )

  return {
    fileName: String(fileName ?? '').trim(),
    rowCount: normalizedRows.length,
    totalQuantity: normalizedRows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0),
    uniqueSkuCount: new Set(normalizedRows.map((row) => String(row.sku ?? '').trim()).filter(Boolean)).size,
    uniqueRecipientCount: new Set(
      normalizedRows.map((row) => String(row.recipient ?? '').trim()).filter(Boolean),
    ).size,
    firstOrderNo: normalizedRows[0]?.orderNo ?? '-',
    totalRows,
    validRows,
    errorCount: errors.length,
    errors,
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
