/**
 * 셀러 ASN 등록 화면에서 사용하는 로컬 mock 데이터와 검증 유틸.
 * UI 우선 단계라 API 없이도 폼 입력, 품목 라인 편집, 요약 계산을 확인할 수 있게 한다.
 */

// ASN 등록 화면에서 선택할 수 있는 mock 창고 목록.
export const SELLER_ASN_WAREHOUSE_OPTIONS = [
  { id: '1', name: 'NJ Warehouse', region: 'New Jersey', leadTime: '2일' },
  { id: '2', name: 'LA Warehouse', region: 'Los Angeles', leadTime: '3일' },
  { id: '3', name: 'TX Warehouse', region: 'Dallas', leadTime: '4일' },
]

// ASN 등록에서 사용하는 mock 입고 방식 옵션.
export const SELLER_ASN_INBOUND_TYPES = [
  { value: 'SEA', label: '해상 입고' },
  { value: 'AIR', label: '항공 입고' },
  { value: 'TRANSFER', label: '국내 이동 입고' },
]

// SKU 선택 시 자동으로 채워 넣을 mock 상품 정보.
export const SELLER_ASN_PRODUCT_OPTIONS = [
  { sku: 'KR-MASK-001', productName: '리페어 마스크팩 10입', unit: 'EA', brand: 'CONK Beauty', availableStock: 348 },
  { sku: 'KR-SNCK-012', productName: '한입 고구마 스낵', unit: 'BOX', brand: 'CONK Food', availableStock: 185 },
  { sku: 'KR-COSM-034', productName: '비타 세럼 앰플', unit: 'EA', brand: 'CONK Beauty', availableStock: 8 },
  { sku: 'KR-HOME-056', productName: '실리콘 조리도구 세트', unit: 'SET', brand: 'CONK Home', availableStock: 210 },
]

/**
 * 화면에서 새 ASN 번호처럼 보이게 만들기 위한 mock 번호 생성기.
 * 날짜와 순번만으로 고정 포맷을 맞춘다.
 */
export function buildMockAsnNumber(sequence = 1, date = '2026-03-18') {
  const normalizedDate = String(date).replaceAll('-', '')
  return `ASN-${normalizedDate}-${String(sequence).padStart(3, '0')}`
}

// ASN 기본 정보 폼의 초기 상태를 만든다.
export function createInitialAsnForm(sequence = 1) {
  return {
    asnNo: buildMockAsnNumber(sequence),
    warehouseId: '',
    expectedDate: '',
    shippingMethod: '',
    senderName: 'LUMIERE BEAUTY',
    originCountry: '',
    senderAddress: '',
    senderPhone: '',
    note: '',
  }
}

// 품목 라인 한 줄의 초기 상태를 만든다.
export function createInitialAsnLine(sequence = 1) {
  return {
    id: `asn-line-${sequence}`,
    sku: '',
    productName: '',
    availableStock: '',
    quantity: '',
    cartonCount: '',
  }
}

// 품목 라인 한 줄에 연결할 에러 상태 기본값.
export function createInitialAsnLineError() {
  return {
    sku: '',
    quantity: '',
    cartonCount: '',
  }
}

// ASN 기본 정보 영역에 표시할 필드 에러 기본값.
export function createInitialAsnFieldErrors() {
  return {
    warehouseId: '',
    expectedDate: '',
    shippingMethod: '',
    originCountry: '',
    senderAddress: '',
    senderPhone: '',
    lineItems: '',
  }
}

// 선택한 SKU에 해당하는 mock 상품 정보를 반환한다.
export function getAsnProductBySku(sku, productOptions = SELLER_ASN_PRODUCT_OPTIONS) {
  return productOptions.find((product) => product.sku === sku) ?? null
}

/**
 * 현재 품목 라인을 기준으로 요약 카드 수치를 계산한다.
 * 빈 SKU 라인은 SKU 수에 포함하지 않고, 수량/박스 수는 숫자만 누적한다.
 */
export function calculateAsnSummary(lineItems = []) {
  const skuSet = new Set()
  let totalQuantity = 0
  let totalCartons = 0

  lineItems.forEach((line) => {
    const normalizedSku = String(line.sku ?? '').trim()
    if (normalizedSku) skuSet.add(normalizedSku)

    totalQuantity += Number(line.quantity) > 0 ? Number(line.quantity) : 0
    totalCartons += Number(line.cartonCount) > 0 ? Number(line.cartonCount) : 0
  })

  return {
    skuCount: skuSet.size,
    totalQuantity,
    totalCartons,
  }
}

/**
 * ASN 등록 화면의 필수 입력값을 검사한다.
 * 기본 정보와 품목 라인 에러를 분리해서 화면에 바로 바인딩할 수 있게 한다.
 */
export function validateAsnForm(form = {}, lineItems = []) {
  const fieldErrors = createInitialAsnFieldErrors()
  const lineErrors = lineItems.map(() => createInitialAsnLineError())

  if (!String(form.warehouseId ?? '').trim()) {
    fieldErrors.warehouseId = '입고 창고를 선택하세요.'
  }

  if (!String(form.expectedDate ?? '').trim()) {
    fieldErrors.expectedDate = '예정 입고일을 선택하세요.'
  }

  if (!String(form.shippingMethod ?? '').trim()) {
    fieldErrors.shippingMethod = '운송 방법을 입력하세요.'
  }

  if (!String(form.originCountry ?? '').trim()) {
    fieldErrors.originCountry = '발송 국가를 입력하세요.'
  }

  if (!String(form.senderAddress ?? '').trim()) {
    fieldErrors.senderAddress = '주소를 입력하세요.'
  }

  if (!String(form.senderPhone ?? '').trim()) {
    fieldErrors.senderPhone = '연락처를 입력하세요.'
  }

  const hasAnyFilledLine = lineItems.some((line) => {
    return Boolean(
      String(line.sku ?? '').trim()
      || String(line.quantity ?? '').trim()
      || String(line.cartonCount ?? '').trim(),
    )
  })

  if (!lineItems.length || !hasAnyFilledLine) {
    fieldErrors.lineItems = 'SKU와 수량이 포함된 품목을 1개 이상 입력하세요.'
  }

  lineItems.forEach((line, index) => {
    if (!String(line.sku ?? '').trim()) {
      lineErrors[index].sku = 'SKU를 선택하세요.'
    }

    if (!line.quantity || Number(line.quantity) < 1) {
      lineErrors[index].quantity = '수량은 1 이상이어야 합니다.'
    }

    if (!line.cartonCount || Number(line.cartonCount) < 1) {
      lineErrors[index].cartonCount = '박스 수는 1 이상이어야 합니다.'
    }
  })

  return { fieldErrors, lineErrors }
}
