import { describe, expect, it } from 'vitest'

import {
  buildVolumeWeight,
  createInitialProductForm,
  validateProductForm,
} from '@/utils/productRegister.utils.js'

describe('productRegister utils', () => {
  it('길이, 너비, 높이로 부피중량을 계산한다', () => {
    expect(buildVolumeWeight(12, 8, 6)).toBe(4.144)
  })

  it('필수값이 비어 있으면 상품 등록 검증 에러를 반환한다', () => {
    const result = validateProductForm(createInitialProductForm())

    expect(result.sku).toBe('SKU를 입력하세요.')
    expect(result.productName).toBe('상품명을 입력하세요.')
    expect(result.category).toBe('카테고리를 선택하세요.')
    expect(result.salePrice).toBe('판매가는 0보다 커야 합니다.')
    expect(result.weight).toBe('중량을 입력하세요.')
    expect(result.length).toBe('길이를 입력하세요.')
    expect(result.width).toBe('너비를 입력하세요.')
    expect(result.height).toBe('높이를 입력하세요.')
    expect(result.originCountry).toBe('원산지를 선택하세요.')
    expect(result.customsValue).toBe('신고가를 입력하세요.')
  })

  it('정상 입력이면 상품 등록 검증 에러가 없다', () => {
    const result = validateProductForm({
      sku: 'LB-AMP-30',
      productName: '루미에르 앰플 30ml',
      category: 'SERUM',
      salePrice: 24.99,
      weight: 0.32,
      length: 6,
      width: 2,
      height: 2,
      originCountry: 'KR',
      customsValue: 12.5,
    })

    expect(Object.values(result).every((value) => value === '')).toBe(true)
  })
})
