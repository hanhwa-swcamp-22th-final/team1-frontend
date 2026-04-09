/**
 * 셀러 상품 등록 화면 검증, payload 가공 유틸.
 */

export function createInitialProductForm() {
  return {
    sku: '',
    productName: '',
    category: '',
    brand: '',
    description: '',
    salePrice: '',
    costPrice: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    hsCode: '',
    originCountry: '',
    customsValue: '',
    barcode: '',
    asin: '',
    isActive: true,
    lowStockAlert: true,
    amazonSync: false,
    stockAlertThreshold: 10,
    minOrderQuantity: 1,
  }
}

export function createInitialProductErrors() {
  return {
    sku: '',
    productName: '',
    category: '',
    salePrice: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    originCountry: '',
    customsValue: '',
  }
}

function toPositiveNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0
}

function toNonNegativeNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0
}

function parseProductDimensions(dimensions = '') {
  const matches = String(dimensions ?? '').match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i)

  if (!matches) {
    return { length: '', width: '', height: '' }
  }

  return {
    length: matches[1],
    width: matches[2],
    height: matches[3],
  }
}

export function buildVolumeWeight(length, width, height, divisor = 139) {
  const normalizedLength = toPositiveNumber(length)
  const normalizedWidth = toPositiveNumber(width)
  const normalizedHeight = toPositiveNumber(height)

  if (!normalizedLength || !normalizedWidth || !normalizedHeight) return ''

  return Number(((normalizedLength * normalizedWidth * normalizedHeight) / divisor).toFixed(3))
}

export function validateProductForm(form = {}) {
  const errors = createInitialProductErrors()

  if (!String(form.sku ?? '').trim()) errors.sku = 'SKU를 입력하세요.'
  if (!String(form.productName ?? '').trim()) errors.productName = '상품명을 입력하세요.'
  if (!String(form.category ?? '').trim()) errors.category = '카테고리를 선택하세요.'
  if (!toPositiveNumber(form.salePrice)) errors.salePrice = '판매가는 0보다 커야 합니다.'
  if (!toPositiveNumber(form.weight)) errors.weight = '중량을 입력하세요.'
  if (!toPositiveNumber(form.length)) errors.length = '길이를 입력하세요.'
  if (!toPositiveNumber(form.width)) errors.width = '너비를 입력하세요.'
  if (!toPositiveNumber(form.height)) errors.height = '높이를 입력하세요.'
  if (!String(form.originCountry ?? '').trim()) errors.originCountry = '원산지를 선택하세요.'
  if (!toPositiveNumber(form.customsValue)) errors.customsValue = '신고가를 입력하세요.'

  return errors
}

export function buildProductFormFromProduct(product = {}) {
  const dimensions = parseProductDimensions(product.detail?.dimensions)

  return {
    sku: String(product.sku ?? '').trim(),
    productName: String(product.productName ?? '').trim(),
    category: String(product.category ?? '').trim(),
    brand: String(product.detail?.brand ?? '').trim(),
    description: String(product.detail?.description ?? '').trim(),
    salePrice: String(product.salePrice ?? ''),
    costPrice: String(product.costPrice ?? ''),
    weight: String(product.detail?.unitWeightLbs ?? ''),
    length: dimensions.length,
    width: dimensions.width,
    height: dimensions.height,
    hsCode: String(product.detail?.hsCode ?? '').trim(),
    originCountry: String(product.detail?.originCountry ?? '').trim(),
    customsValue: String(product.detail?.customsValue ?? ''),
    barcode: String(product.detail?.barcode ?? '').trim(),
    asin: String(product.detail?.asin ?? '').trim(),
    isActive: product.status !== 'INACTIVE',
    lowStockAlert: Boolean(product.detail?.lowStockAlert ?? true),
    amazonSync: Boolean(product.detail?.amazonSync ?? false),
    stockAlertThreshold: Number(product.detail?.stockAlertThreshold ?? 10),
    minOrderQuantity: Number(product.detail?.minOrderQuantity ?? 1),
  }
}

export function buildSellerProductPayload(form = {}, { imageNames = [] } = {}) {
  const normalizedLength = toPositiveNumber(form.length)
  const normalizedWidth = toPositiveNumber(form.width)
  const normalizedHeight = toPositiveNumber(form.height)

  return {
    sku: String(form.sku ?? '').trim(),
    productName: String(form.productName ?? '').trim(),
    category: String(form.category ?? '').trim(),
    brand: String(form.brand ?? '').trim(),
    description: String(form.description ?? '').trim(),
    salePrice: toPositiveNumber(form.salePrice),
    costPrice: toNonNegativeNumber(form.costPrice),
    weight: toPositiveNumber(form.weight),
    length: normalizedLength,
    width: normalizedWidth,
    height: normalizedHeight,
    dimensions: `${normalizedLength} x ${normalizedWidth} x ${normalizedHeight} in`,
    hsCode: String(form.hsCode ?? '').trim(),
    originCountry: String(form.originCountry ?? '').trim(),
    customsValue: toPositiveNumber(form.customsValue),
    barcode: String(form.barcode ?? '').trim(),
    asin: String(form.asin ?? '').trim(),
    isActive: Boolean(form.isActive),
    lowStockAlert: Boolean(form.lowStockAlert),
    amazonSync: Boolean(form.amazonSync),
    stockAlertThreshold: Math.max(0, Math.trunc(toNonNegativeNumber(form.stockAlertThreshold))),
    minOrderQuantity: Math.max(1, Math.trunc(toPositiveNumber(form.minOrderQuantity) || 1)),
    imageNames: Array.isArray(imageNames)
      ? imageNames.map((name) => String(name ?? '').trim()).filter(Boolean).slice(0, 3)
      : [],
  }
}
