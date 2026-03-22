import { describe, expect, it } from 'vitest'

import {
  filterSellerProductRows,
  getSellerProductDetailById,
  getSellerProductStatusMeta,
  normalizeSellerProductDetail,
  SELLER_PRODUCT_LIST_ROWS,
} from '@/utils/seller/productList.utils.js'

describe('productList utils', () => {
  it('상품 상태 메타를 반환한다', () => {
    expect(getSellerProductStatusMeta('LOW_STOCK')).toEqual({
      label: '재고부족',
      tone: 'amber',
    })
  })

  it('상태 필터를 적용한다', () => {
    const result = filterSellerProductRows(SELLER_PRODUCT_LIST_ROWS, {
      status: 'OUT_OF_STOCK',
    })

    expect(result).toHaveLength(1)
    expect(result[0].sku).toBe('LB-TNR-150')
  })

  it('카테고리와 검색어를 함께 적용한다', () => {
    const result = filterSellerProductRows(SELLER_PRODUCT_LIST_ROWS, {
      category: '클렌징',
      search: '폼클렌저',
    })

    expect(result).toHaveLength(1)
    expect(result[0].sku).toBe('LB-FOA-120')
  })

  it('상품 상세 mock 데이터를 반환한다', () => {
    expect(getSellerProductDetailById('seller-product-1', SELLER_PRODUCT_LIST_ROWS[0])).toEqual(
      expect.objectContaining({
        brand: 'LUMIERE BEAUTY',
        totalStock: 290,
        marginAmount: 22,
        marginRate: 73.3,
      }),
    )
  })

  it('상세 mock이 없는 상품은 fallback 정보를 반환한다', () => {
    expect(getSellerProductDetailById('seller-product-3', SELLER_PRODUCT_LIST_ROWS[2])).toEqual(
      expect.objectContaining({
        barcode: '미등록',
        totalStock: 170,
        description: '비타민C 크림 100ml 상세 정보 준비중',
      }),
    )
  })

  it('API detail과 row를 합쳐 상품 상세 형식으로 정규화한다', () => {
    expect(
      normalizeSellerProductDetail(
        {
          brand: 'LUMIERE BEAUTY',
          barcode: '8809812300018',
          memo: 'PUS-B 재고 5개',
        },
        SELLER_PRODUCT_LIST_ROWS[7],
      ),
    ).toEqual(
      expect.objectContaining({
        brand: 'LUMIERE BEAUTY',
        barcode: '8809812300018',
        totalStock: 19,
        marginAmount: 20.8,
        marginRate: 74.3,
      }),
    )
  })
})
