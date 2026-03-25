/**
 * 셀러 상품 등록 화면에서 사용하는 선택 옵션, 검증, payload 가공 유틸.
 */

// 상품 등록 화면에서 선택할 수 있는 카테고리 mock 옵션.
export const SELLER_PRODUCT_CATEGORY_OPTIONS = [
  { value: 'SKINCARE', label: '스킨케어' },
  { value: 'SERUM', label: '세럼/앰플' },
  { value: 'MASKPACK', label: '마스크팩' },
  { value: 'SUNCARE', label: '선케어' },
  { value: 'CLEANSING', label: '클렌징' },
]

// 통관 정보 영역에서 사용하는 HS 코드 mock 옵션.
export const SELLER_PRODUCT_HS_CODE_OPTIONS = [
  { value: '3304.99.9000', label: '3304.99.9000 - 기타 스킨케어 제품' },
  { value: '3304.99.5000', label: '3304.99.5000 - 세럼/앰플' },
  { value: '3307.90.0000', label: '3307.90.0000 - 마스크팩' },
]

// 원산지 선택 mock 옵션.
export const SELLER_PRODUCT_ORIGIN_OPTIONS = [
  { value: 'KR', label: '대한민국 (KR)' },
  { value: 'CN', label: '중국 (CN)' },
  { value: 'JP', label: '일본 (JP)' },
  { value: 'US', label: '미국 (US)' },
]

const PRODUCT_CATEGORY_LABEL_MAP = Object.fromEntries(
  SELLER_PRODUCT_CATEGORY_OPTIONS.map((option) => [option.value, option.label])
)

const PRODUCT_CATEGORY_VALUE_MAP = Object.fromEntries(
  SELLER_PRODUCT_CATEGORY_OPTIONS.map((option) => [option.label, option.value])
)

const PRODUCT_ORIGIN_LABEL_MAP = Object.fromEntries(
  SELLER_PRODUCT_ORIGIN_OPTIONS.map((option) => [option.value, option.label])
)

const PRODUCT_ORIGIN_VALUE_MAP = Object.fromEntries(
  SELLER_PRODUCT_ORIGIN_OPTIONS.map((option) => [option.label, option.value])
)

// 상품 등록 폼의 초기 상태를 만든다.
export function createInitialProductForm() {
  return {
    sku: '',
    productName: '',
    category: '',
    brand: 'LUMIERE BEAUTY',
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

// 화면에 바로 바인딩할 필드별 에러 기본값.
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

// 임시저장 준비중 상태에서 공통으로 보여줄 안내 문구를 만든다.
export function buildProductDraftPendingMessage(productLabel = '') {
  const normalizedProductLabel = String(productLabel ?? '').trim()

  return normalizedProductLabel
    ? `${normalizedProductLabel} 임시저장 기능은 준비 중입니다.`
    : '임시저장 기능은 준비 중입니다.'
}

// 숫자 필드를 양수로만 인정한다.
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

/**
 * 길이, 너비, 높이를 기준으로 부피중량을 계산한다.
 * 입력값이 모두 양수일 때만 고정 소수점 3자리 수치를 반환한다.
 */
export function buildVolumeWeight(length, width, height, divisor = 139) {
  const normalizedLength = toPositiveNumber(length)
  const normalizedWidth = toPositiveNumber(width)
  const normalizedHeight = toPositiveNumber(height)

  if (!normalizedLength || !normalizedWidth || !normalizedHeight) return ''

  return Number(((normalizedLength * normalizedWidth * normalizedHeight) / divisor).toFixed(3))
}

/**
 * 상품 등록 화면의 필수값을 검사한다.
 * 현재 단계에서는 저장 대신 화면 검증과 성공 메시지 흐름만 확인한다.
 */
export function validateProductForm(form = {}) {
  const errors = createInitialProductErrors()

  if (!String(form.sku ?? '').trim()) {
    errors.sku = 'SKU를 입력하세요.'
  }

  if (!String(form.productName ?? '').trim()) {
    errors.productName = '상품명을 입력하세요.'
  }

  if (!String(form.category ?? '').trim()) {
    errors.category = '카테고리를 선택하세요.'
  }

  if (!toPositiveNumber(form.salePrice)) {
    errors.salePrice = '판매가는 0보다 커야 합니다.'
  }

  if (!toPositiveNumber(form.weight)) {
    errors.weight = '중량을 입력하세요.'
  }

  if (!toPositiveNumber(form.length)) {
    errors.length = '길이를 입력하세요.'
  }

  if (!toPositiveNumber(form.width)) {
    errors.width = '너비를 입력하세요.'
  }

  if (!toPositiveNumber(form.height)) {
    errors.height = '높이를 입력하세요.'
  }

  if (!String(form.originCountry ?? '').trim()) {
    errors.originCountry = '원산지를 선택하세요.'
  }

  if (!toPositiveNumber(form.customsValue)) {
    errors.customsValue = '신고가를 입력하세요.'
  }

  return errors
}

/**
 * 상품 목록 row/detail을 등록 화면 form 구조로 되돌린다.
 * 등록 화면 재사용으로 수정 모드를 구성할 때 사용한다.
 */
export function buildProductFormFromProduct(product = {}) {
  const dimensions = parseProductDimensions(product.detail?.dimensions)
  const normalizedCategory = String(product.category ?? '').trim()
  const normalizedOrigin = String(product.detail?.originCountry ?? '').trim()

  return {
    sku: String(product.sku ?? '').trim(),
    productName: String(product.productName ?? '').trim(),
    category: PRODUCT_CATEGORY_VALUE_MAP[normalizedCategory] ?? normalizedCategory,
    brand: String(product.detail?.brand ?? '').trim() || 'LUMIERE BEAUTY',
    description: String(product.detail?.description ?? '').trim(),
    salePrice: String(product.salePrice ?? ''),
    costPrice: String(product.costPrice ?? ''),
    weight: String(product.detail?.unitWeightLbs ?? ''),
    length: dimensions.length,
    width: dimensions.width,
    height: dimensions.height,
    hsCode: String(product.detail?.hsCode ?? '').trim(),
    originCountry: PRODUCT_ORIGIN_VALUE_MAP[normalizedOrigin] ?? normalizedOrigin,
    customsValue: String(product.detail?.customsValue ?? ''),
    barcode: String(product.detail?.barcode ?? '').trim() === '미등록'
      ? ''
      : String(product.detail?.barcode ?? '').trim(),
    asin: String(product.detail?.asin ?? '').trim(),
    isActive: product.status !== 'INACTIVE',
    lowStockAlert: Boolean(product.detail?.lowStockAlert ?? true),
    amazonSync: Boolean(product.detail?.amazonSync ?? false),
    stockAlertThreshold: Number(product.detail?.stockAlertThreshold ?? 10),
    minOrderQuantity: Number(product.detail?.minOrderQuantity ?? 1),
  }
}

/**
 * 상품 등록 폼을 seller product 저장 payload로 정규화한다.
 * mock-server 저장 단계라 화면 입력값과 목록 row/detail이 모두 만들어지도록 가공한다.
 */
export function buildSellerProductPayload(form = {}, { imageNames = [] } = {}) {
  const normalizedLength = toPositiveNumber(form.length)
  const normalizedWidth = toPositiveNumber(form.width)
  const normalizedHeight = toPositiveNumber(form.height)
  const normalizedCategory = String(form.category ?? '').trim()
  const normalizedOrigin = String(form.originCountry ?? '').trim()

  return {
    sku: String(form.sku ?? '').trim(),
    productName: String(form.productName ?? '').trim(),
    category: normalizedCategory,
    categoryLabel: PRODUCT_CATEGORY_LABEL_MAP[normalizedCategory] ?? normalizedCategory ?? '미분류',
    brand: String(form.brand ?? '').trim() || 'LUMIERE BEAUTY',
    description: String(form.description ?? '').trim(),
    salePrice: toPositiveNumber(form.salePrice),
    costPrice: toNonNegativeNumber(form.costPrice),
    weight: toPositiveNumber(form.weight),
    length: normalizedLength,
    width: normalizedWidth,
    height: normalizedHeight,
    dimensions: `${normalizedLength} x ${normalizedWidth} x ${normalizedHeight} in`,
    hsCode: String(form.hsCode ?? '').trim() || '3304.99.9000',
    originCountry: normalizedOrigin,
    originCountryLabel: PRODUCT_ORIGIN_LABEL_MAP[normalizedOrigin] ?? normalizedOrigin ?? '미등록',
    customsValue: toPositiveNumber(form.customsValue),
    barcode: String(form.barcode ?? '').trim(),
    asin: String(form.asin ?? '').trim(),
    isActive: Boolean(form.isActive),
    lowStockAlert: Boolean(form.lowStockAlert),
    amazonSync: Boolean(form.amazonSync),
    stockAlertThreshold: Math.max(0, Math.trunc(toNonNegativeNumber(form.stockAlertThreshold))),
    minOrderQuantity: Math.max(1, Math.trunc(toPositiveNumber(form.minOrderQuantity) || 1)),
    imageNames: Array.isArray(imageNames)
      ? imageNames
          .map((name) => String(name ?? '').trim())
          .filter(Boolean)
          .slice(0, 3)
      : [],
  }
}
