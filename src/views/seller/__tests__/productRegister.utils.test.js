import { describe, expect, it } from 'vitest'

import {
  buildProductFormFromProduct,
  buildSellerProductPayload,
  buildVolumeWeight,
  createInitialProductForm,
  validateProductForm,
} from '@/utils/seller/productRegister.utils.js'

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

  it('상품 등록 payload를 목록/상세 저장 형태로 정규화한다', () => {
    const result = buildSellerProductPayload({
      sku: ' LB-NEW-10 ',
      productName: '신규 세럼 10ml',
      category: 'SERUM',
      brand: 'NEW BRAND',
      description: '테스트 상품',
      salePrice: '19.99',
      costPrice: '5.5',
      weight: '0.25',
      length: '4.5',
      width: '1.5',
      height: '1.5',
      hsCode: '',
      originCountry: 'KR',
      customsValue: '5.5',
      barcode: '1234567890123',
      asin: 'B000TEST01',
      isActive: true,
      lowStockAlert: true,
      amazonSync: true,
      stockAlertThreshold: '12',
      minOrderQuantity: '2',
    }, {
      imageNames: [' front.png ', '', 'detail.png', 'extra.png'],
    })

    expect(result).toEqual({
      sku: 'LB-NEW-10',
      productName: '신규 세럼 10ml',
      category: 'SERUM',
      categoryLabel: '세럼/앰플',
      brand: 'NEW BRAND',
      description: '테스트 상품',
      salePrice: 19.99,
      costPrice: 5.5,
      weight: 0.25,
      length: 4.5,
      width: 1.5,
      height: 1.5,
      dimensions: '4.5 x 1.5 x 1.5 in',
      hsCode: '3304.99.9000',
      originCountry: 'KR',
      originCountryLabel: '대한민국 (KR)',
      customsValue: 5.5,
      barcode: '1234567890123',
      asin: 'B000TEST01',
      isActive: true,
      lowStockAlert: true,
      amazonSync: true,
      stockAlertThreshold: 12,
      minOrderQuantity: 2,
      imageNames: ['front.png', 'detail.png', 'extra.png'],
    })
  })

  it('상품 row/detail을 등록 폼 구조로 역정규화한다', () => {
    const result = buildProductFormFromProduct({
      sku: 'LB-AMP-30',
      productName: '루미에르 앰플 30ml',
      category: '세럼/앰플',
      salePrice: 30,
      costPrice: 8,
      status: 'ACTIVE',
      detail: {
        brand: 'LUMIERE BEAUTY',
        description: '흡수가 빠른 브라이트닝 앰플',
        unitWeightLbs: 0.32,
        dimensions: '5.8 x 1.9 x 1.9 in',
        hsCode: '3304.99.5000',
        originCountry: '대한민국 (KR)',
        customsValue: 8,
        barcode: '8809812300011',
        asin: 'B00TEST001',
        lowStockAlert: true,
        amazonSync: true,
        stockAlertThreshold: 12,
        minOrderQuantity: 2,
      },
    })

    expect(result).toEqual({
      sku: 'LB-AMP-30',
      productName: '루미에르 앰플 30ml',
      category: 'SERUM',
      brand: 'LUMIERE BEAUTY',
      description: '흡수가 빠른 브라이트닝 앰플',
      salePrice: '30',
      costPrice: '8',
      weight: '0.32',
      length: '5.8',
      width: '1.9',
      height: '1.9',
      hsCode: '3304.99.5000',
      originCountry: 'KR',
      customsValue: '8',
      barcode: '8809812300011',
      asin: 'B00TEST001',
      isActive: true,
      lowStockAlert: true,
      amazonSync: true,
      stockAlertThreshold: 12,
      minOrderQuantity: 2,
    })
  })
})
