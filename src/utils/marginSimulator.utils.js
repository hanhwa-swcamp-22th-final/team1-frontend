/**
 * 셀러 마진 시뮬레이터 화면용 로컬 mock 데이터와 계산 유틸.
 * 상품, 채널, 운송 조건을 바꿨을 때 수익성과 비용 구성을 즉시 계산한다.
 */

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

// 마진 시뮬레이터에서 사용하는 채널 옵션.
export const SELLER_MARGIN_CHANNEL_OPTIONS = [
  { key: 'AMAZON', label: 'Amazon', defaultFeeRate: 15 },
  { key: 'SHOPIFY', label: 'Shopify', defaultFeeRate: 3.2 },
  { key: 'MANUAL', label: '수동', defaultFeeRate: 0 },
]

// 마진 시뮬레이터에서 사용하는 운송 방식 옵션.
export const SELLER_MARGIN_SHIPPING_OPTIONS = [
  { key: 'SEA', label: '해상' },
  { key: 'AIR', label: '항공' },
]

// 상품 기본값과 물류비 기준이 함께 들어있는 상품 mock 데이터.
export const SELLER_MARGIN_PRODUCT_OPTIONS = [
  {
    sku: 'LB-AMP-30',
    productName: '루미에르 앰플 30ml',
    defaultSalePrice: 34,
    declaredValue: 8.6,
    productCost: 6.8,
    packagingCost: 0.7,
    fulfillmentFee: 2.4,
    seaShippingCost: 1.5,
    airShippingCost: 3.8,
    storageUnitCost: 0.16,
  },
  {
    sku: 'LB-MSK-5P',
    productName: '콜라겐 마스크 5매입',
    defaultSalePrice: 18,
    declaredValue: 4.4,
    productCost: 3.1,
    packagingCost: 0.35,
    fulfillmentFee: 1.8,
    seaShippingCost: 0.95,
    airShippingCost: 2.3,
    storageUnitCost: 0.1,
  },
  {
    sku: 'LB-SUN-50',
    productName: 'UV 선크림 SPF50 50ml',
    defaultSalePrice: 28,
    declaredValue: 6.2,
    productCost: 5,
    packagingCost: 0.5,
    fulfillmentFee: 2.1,
    seaShippingCost: 1.25,
    airShippingCost: 3.1,
    storageUnitCost: 0.14,
  },
]

export function getMarginProductBySku(sku) {
  return SELLER_MARGIN_PRODUCT_OPTIONS.find((item) => item.sku === sku) ?? null
}

export function getMarginChannelByKey(channelKey) {
  return SELLER_MARGIN_CHANNEL_OPTIONS.find((item) => item.key === channelKey) ?? null
}

// 선택한 상품과 채널, 운송 모드에 맞는 기본 입력값을 만든다.
export function createInitialMarginForm() {
  const product = SELLER_MARGIN_PRODUCT_OPTIONS[0]
  const channel = SELLER_MARGIN_CHANNEL_OPTIONS[0]

  return {
    productSku: product.sku,
    salesChannel: channel.key,
    shippingMode: 'SEA',
    salePrice: product.defaultSalePrice,
    channelFeeRate: channel.defaultFeeRate,
    fulfillmentFee: product.fulfillmentFee,
    internationalShippingFee: product.seaShippingCost,
    otherCost: 120,
    monthlySalesQty: 200,
    storageUnitCost: product.storageUnitCost,
    declaredValue: product.declaredValue,
    dutyMode: 'rate',
    vatRate: 10,
    dutyRate: 8,
    dutyAmount: 0,
    productCost: product.productCost,
    packagingCost: product.packagingCost,
  }
}

// 선택한 상품과 운송 방식에 맞는 기본 국제 배송비를 반환한다.
export function getProductShippingCost(product, shippingMode) {
  if (!product) return 0
  return shippingMode === 'AIR' ? product.airShippingCost : product.seaShippingCost
}

/**
 * 시뮬레이터 입력값을 기반으로 예상 매출과 총 비용, 순이익, 마진율을 계산한다.
 * 기타 비용은 월 고정비로 가정하고, 나머지 비용은 수량 기준 변동비로 계산한다.
 */
export function calculateMarginResult(form = {}) {
  const salePrice = toNumber(form.salePrice)
  const feeRate = toNumber(form.channelFeeRate)
  const fulfillmentFee = toNumber(form.fulfillmentFee)
  const internationalShippingFee = toNumber(form.internationalShippingFee)
  const storageUnitCost = toNumber(form.storageUnitCost)
  const monthlySalesQty = Math.max(1, toNumber(form.monthlySalesQty))
  const declaredValue = toNumber(form.declaredValue)
  const vatRate = toNumber(form.vatRate)
  const dutyRate = toNumber(form.dutyRate)
  const dutyAmount = toNumber(form.dutyAmount)
  const productCost = toNumber(form.productCost)
  const packagingCost = toNumber(form.packagingCost)
  const otherCost = toNumber(form.otherCost)

  const revenue = salePrice * monthlySalesQty
  const channelFee = revenue * (feeRate / 100)
  const fulfillmentCost = fulfillmentFee * monthlySalesQty
  const shippingCost = internationalShippingFee * monthlySalesQty
  const storageCost = storageUnitCost * monthlySalesQty
  const productCostTotal = productCost * monthlySalesQty
  const packagingCostTotal = packagingCost * monthlySalesQty
  const declaredTotal = declaredValue * monthlySalesQty
  const customsDuty =
    form.dutyMode === 'amount'
      ? dutyAmount * monthlySalesQty
      : declaredTotal * (dutyRate / 100)
  const vatCost = (declaredTotal + customsDuty) * (vatRate / 100)

  const totalCost =
    channelFee +
    fulfillmentCost +
    shippingCost +
    storageCost +
    productCostTotal +
    packagingCostTotal +
    customsDuty +
    vatCost +
    otherCost

  const netProfit = revenue - totalCost
  const marginRate = revenue > 0 ? (netProfit / revenue) * 100 : 0

  const perUnitDuty = customsDuty / monthlySalesQty
  const perUnitVat = vatCost / monthlySalesQty
  const variableUnitCost =
    salePrice * (feeRate / 100) +
    fulfillmentFee +
    internationalShippingFee +
    storageUnitCost +
    productCost +
    packagingCost +
    perUnitDuty +
    perUnitVat
  const unitContribution = salePrice - variableUnitCost
  const breakEvenUnits = unitContribution > 0 ? Math.ceil(otherCost / unitContribution) : null

  const breakdown = [
    { key: 'channelFee', label: '채널 수수료', value: channelFee, tone: 'gold' },
    { key: 'fulfillmentCost', label: '풀필먼트 수수료', value: fulfillmentCost, tone: 'blue' },
    { key: 'shippingCost', label: '국제 배송비', value: shippingCost, tone: 'purple' },
    { key: 'storageCost', label: '보관비', value: storageCost, tone: 'green' },
    { key: 'productCost', label: '매입 원가', value: productCostTotal, tone: 'red' },
    { key: 'packagingCost', label: '포장비', value: packagingCostTotal, tone: 'amber' },
    { key: 'customsDuty', label: '관세', value: customsDuty, tone: 'blue' },
    { key: 'vatCost', label: '부가세', value: vatCost, tone: 'purple' },
    { key: 'otherCost', label: '기타 비용', value: otherCost, tone: 'default' },
  ]

  return {
    revenue,
    totalCost,
    netProfit,
    marginRate,
    breakEvenUnits,
    breakdown,
  }
}

// 현재 설정과 해상/항공 기준을 함께 비교할 수 있게 시나리오 카드를 만든다.
export function buildMarginScenarioCards(form = {}) {
  const product = getMarginProductBySku(form.productSku)

  const seaForm = {
    ...form,
    shippingMode: 'SEA',
    internationalShippingFee: getProductShippingCost(product, 'SEA'),
  }
  const airForm = {
    ...form,
    shippingMode: 'AIR',
    internationalShippingFee: getProductShippingCost(product, 'AIR'),
  }

  return [
    {
      key: 'SEA_BASE',
      label: '해상 기준',
      shippingLabel: '해상',
      ...calculateMarginResult(seaForm),
    },
    {
      key: 'CURRENT',
      label: '현재 설정',
      shippingLabel: form.shippingMode === 'AIR' ? '항공' : '해상',
      ...calculateMarginResult(form),
    },
    {
      key: 'AIR_BASE',
      label: '항공 기준',
      shippingLabel: '항공',
      ...calculateMarginResult(airForm),
    },
  ]
}
