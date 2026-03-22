/**
 * 셀러 상품 등록 화면에서 사용하는 로컬 mock 데이터와 검증 유틸.
 * UI 우선 단계라 저장 없이도 입력 흐름과 자동 계산을 확인할 수 있게 한다.
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

// 숫자 필드를 양수로만 인정한다.
function toPositiveNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0
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
