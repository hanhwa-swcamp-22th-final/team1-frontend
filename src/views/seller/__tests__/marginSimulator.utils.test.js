import { describe, expect, it } from 'vitest'

import {
  buildMarginScenarioCards,
  calculateMarginResult,
  createInitialMarginForm,
} from '@/utils/seller/marginSimulator.utils.js'

describe('marginSimulator utils', () => {
  it('초기 폼 기본값을 만든다', () => {
    const form = createInitialMarginForm()

    // 상품/채널 없이 호출하면 빈 선택값과 기본 수치가 설정된다
    expect(form.productSku).toBe('')
    expect(form.salesChannel).toBe('')
    expect(form.internationalShippingFee).toBe(0)
    expect(form.declaredValue).toBe(0)
    expect(form.otherCost).toBe(120)
    expect(form.monthlySalesQty).toBe(200)
  })

  it('products/channels가 주어지면 첫 번째 항목으로 초기화된다', () => {
    const form = createInitialMarginForm({
      products: [{ sku: 'SKU-001', productName: '테스트 상품', defaultSalePrice: 29.99, fulfillmentFee: 2.5, storageUnitCost: 28.5, productCost: 12, packagingCost: 0.3 }],
      channels: [{ key: 'SHOPIFY', label: 'Shopify', defaultFeeRate: 15 }],
    })

    expect(form.productSku).toBe('SKU-001')
    expect(form.salesChannel).toBe('SHOPIFY')
    expect(form.channelFeeRate).toBe(15)
    expect(form.salePrice).toBe(29.99)
  })

  it('마진 결과를 계산한다', () => {
    const result = calculateMarginResult({
      productSku: 'LB-AMP-30',
      salesChannel: 'SHOPIFY',
      salePrice: 34,
      channelFeeRate: 15,
      fulfillmentFee: 2.4,
      internationalShippingFee: 1.5,
      otherCost: 120,
      monthlySalesQty: 200,
      storageUnitCost: 0.16,
      declaredValue: 8.6,
      dutyMode: 'rate',
      vatRate: 10,
      dutyRate: 8,
      dutyAmount: 0,
      productCost: 6.8,
      packagingCost: 0.7,
    })

    expect(result.revenue).toBeCloseTo(6800, 2)
    expect(result.totalCost).toBeCloseTo(3775.36, 2)
    expect(result.netProfit).toBeCloseTo(3024.64, 2)
    expect(result.marginRate).toBeCloseTo(44.48, 2)
    expect(result.breakEvenUnits).toBe(8)
  })

  it('시나리오 카드를 단일 현재 설정으로 반환한다', () => {
    const scenarios = buildMarginScenarioCards(createInitialMarginForm())

    expect(scenarios).toHaveLength(1)
    expect(scenarios[0].key).toBe('CURRENT')
    expect(scenarios[0].label).toBe('현재 설정')
    expect(typeof scenarios[0].netProfit).toBe('number')
    expect(typeof scenarios[0].marginRate).toBe('number')
  })
})
