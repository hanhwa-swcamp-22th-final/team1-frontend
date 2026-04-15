/**
 * 셀러 마진 시뮬레이터 계산 유틸.
 * 정적 mock 데이터 대신 API preset 응답만 받아 계산한다.
 */

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeMarginProduct(product = {}) {
  return {
    sku: String(product.sku ?? '').trim(),
    productName: String(product.productName ?? product.name ?? '').trim(),
    defaultSalePrice: Number(product.defaultSalePrice ?? product.salePrice ?? product.price ?? 0),
    productCost: Number(product.productCost ?? product.costPrice ?? 0),
    packagingCost: Number(product.packagingCost ?? 0),
    fulfillmentFee: Number(product.fulfillmentFee ?? 0),
    storageUnitCost: Number(product.storageUnitCost ?? 0),
  }
}

function normalizeMarginChannel(channel = {}) {
  return {
    key: String(channel.key ?? channel.channelKey ?? '').trim(),
    label: String(channel.label ?? channel.name ?? channel.channelName ?? '').trim(),
    defaultFeeRate: Number(channel.defaultFeeRate ?? channel.feeRate ?? 0),
  }
}

export function normalizeMarginProductOptions(products = []) {
  return (Array.isArray(products) ? products : [])
    .map(normalizeMarginProduct)
    .filter((product) => product.sku)
}

export function normalizeMarginChannelOptions(channels = []) {
  return (Array.isArray(channels) ? channels : [])
    .map(normalizeMarginChannel)
    .filter((channel) => channel.key)
}

export function getMarginProductBySku(sku, products = []) {
  return normalizeMarginProductOptions(products).find((item) => item.sku === sku) ?? null
}

export function getMarginChannelByKey(channelKey, channels = []) {
  return normalizeMarginChannelOptions(channels).find((item) => item.key === channelKey) ?? null
}

export function createInitialMarginForm({
  products = [],
  channels = [],
  defaultScenario = {},
} = {}) {
  const normalizedProducts = normalizeMarginProductOptions(products)
  const normalizedChannels = normalizeMarginChannelOptions(channels)
  const product = getMarginProductBySku(defaultScenario.productSku, normalizedProducts) ?? normalizedProducts[0] ?? null
  const channel = getMarginChannelByKey(defaultScenario.salesChannel, normalizedChannels) ?? normalizedChannels[0] ?? null

  return {
    productSku: product?.sku ?? '',
    salesChannel: channel?.key ?? '',
    salePrice: defaultScenario.salePrice ?? product?.defaultSalePrice ?? 0,
    channelFeeRate: defaultScenario.channelFeeRate ?? channel?.defaultFeeRate ?? 0,
    fulfillmentFee: defaultScenario.fulfillmentFee ?? product?.fulfillmentFee ?? 0,
    internationalShippingFee: defaultScenario.internationalShippingFee ?? 0,
    otherCost: defaultScenario.otherCost ?? 120,
    monthlySalesQty: defaultScenario.monthlySalesQty ?? 200,
    storageUnitCost: defaultScenario.storageUnitCost ?? product?.storageUnitCost ?? 0,
    declaredValue: defaultScenario.declaredValue ?? 0,
    dutyMode: defaultScenario.dutyMode ?? 'rate',
    vatRate: defaultScenario.vatRate ?? 10,
    dutyRate: defaultScenario.dutyRate ?? 8,
    dutyAmount: defaultScenario.dutyAmount ?? 0,
    productCost: defaultScenario.productCost ?? product?.productCost ?? 0,
    packagingCost: defaultScenario.packagingCost ?? product?.packagingCost ?? 0,
  }
}

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

export function buildMarginScenarioCards(form = {}) {
  return [
    {
      key: 'CURRENT',
      label: '현재 설정',
      ...calculateMarginResult(form),
    },
  ]
}
