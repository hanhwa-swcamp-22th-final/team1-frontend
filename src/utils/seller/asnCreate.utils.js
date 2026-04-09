/**
 * 셀러 ASN 등록 화면에서 사용하는 검증, payload 가공 유틸.
 */

export function createInitialAsnForm(asnNo = '') {
  return {
    asnNo: String(asnNo ?? '').trim(),
    warehouseId: '',
    expectedDate: '',
    shippingMethod: '',
    senderName: '',
    originCountry: '',
    senderAddress: '',
    senderPhone: '',
    note: '',
  }
}

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

export function createInitialAsnLineError() {
  return {
    sku: '',
    quantity: '',
    cartonCount: '',
  }
}

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

export function buildAsnDraftPendingMessage(asnNo = '') {
  const normalizedAsnNo = String(asnNo ?? '').trim()
  return normalizedAsnNo
    ? `${normalizedAsnNo} 임시저장 기능은 준비 중입니다.`
    : '임시저장 기능은 준비 중입니다.'
}

export function getAsnProductBySku(sku, productOptions = []) {
  const normalizedSku = String(sku ?? '').trim()
  return productOptions.find((product) => product.sku === normalizedSku) ?? null
}

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

  const hasAnyFilledLine = lineItems.some((line) => (
    Boolean(
      String(line.sku ?? '').trim()
      || String(line.quantity ?? '').trim()
      || String(line.cartonCount ?? '').trim()
    )
  ))

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

export function buildSellerAsnPayload(form = {}, lineItems = [], options = {}) {
  const normalizedItems = lineItems
    .filter((line) => String(line.sku ?? '').trim())
    .map((line) => ({
      sku: String(line.sku ?? '').trim(),
      productName: String(line.productName ?? '').trim(),
      quantity: Number(line.quantity ?? 0),
      cartons: Number(line.cartonCount ?? 0),
    }))

  const attachmentName = String(options.attachmentName ?? '').trim()

  return {
    asnNo: String(form.asnNo ?? '').trim(),
    warehouseId: String(form.warehouseId ?? '').trim(),
    expectedDate: String(form.expectedDate ?? '').trim(),
    shippingMethod: String(form.shippingMethod ?? '').trim(),
    senderName: String(form.senderName ?? '').trim(),
    originCountry: String(form.originCountry ?? '').trim(),
    senderAddress: String(form.senderAddress ?? '').trim(),
    senderPhone: String(form.senderPhone ?? '').trim(),
    note: String(form.note ?? '').trim(),
    attachmentName,
    detail: {
      items: normalizedItems,
    },
  }
}
