import { describe, expect, it } from 'vitest'

import {
  filterSellerProductRows,
  getSellerProductStatusMeta,
  SELLER_PRODUCT_LIST_ROWS,
} from '@/utils/productList.utils.js'

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
})
