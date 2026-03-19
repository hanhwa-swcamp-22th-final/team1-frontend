import { describe, expect, it } from 'vitest'

import {
  buildMarginScenarioCards,
  calculateMarginResult,
  createInitialMarginForm,
} from '@/utils/marginSimulator.utils.js'

describe('marginSimulator utils', () => {
  it('초기 폼 기본값을 만든다', () => {
    const form = createInitialMarginForm()

    expect(form.productSku).toBe('LB-AMP-30')
    expect(form.salesChannel).toBe('AMAZON')
    expect(form.channelFeeRate).toBe(15)
    expect(form.shippingMode).toBe('SEA')
  })

  it('마진 결과를 계산한다', () => {
    const result = calculateMarginResult({
      productSku: 'LB-AMP-30',
      salesChannel: 'AMAZON',
      shippingMode: 'SEA',
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

  it('해상/현재/항공 시나리오 카드를 만든다', () => {
    const scenarios = buildMarginScenarioCards(createInitialMarginForm())

    expect(scenarios).toHaveLength(3)
    expect(scenarios[0].label).toBe('해상 기준')
    expect(scenarios[2].label).toBe('항공 기준')
    expect(scenarios[0].netProfit).toBeGreaterThan(scenarios[2].netProfit)
  })
})
