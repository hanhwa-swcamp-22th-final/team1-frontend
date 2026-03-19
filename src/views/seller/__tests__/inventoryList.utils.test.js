import { describe, expect, it } from 'vitest'

import {
  filterSellerInventoryRows,
  getSellerInventoryStatusMeta,
  SELLER_INVENTORY_LIST_ROWS,
} from '@/utils/inventoryList.utils.js'

describe('inventoryList utils', () => {
  it('재고 상태 메타를 반환한다', () => {
    expect(getSellerInventoryStatusMeta('LOW')).toEqual({
      label: '재고부족',
      tone: 'amber',
    })
  })

  it('상태 필터를 적용한다', () => {
    const result = filterSellerInventoryRows(SELLER_INVENTORY_LIST_ROWS, {
      status: 'OUT',
    })

    expect(result).toHaveLength(1)
    expect(result[0].sku).toBe('LB-TNR-150')
  })

  it('창고와 검색어를 함께 적용한다', () => {
    const result = filterSellerInventoryRows(SELLER_INVENTORY_LIST_ROWS, {
      warehouse: 'PUS-B',
      search: '선크림',
    })

    expect(result).toHaveLength(1)
    expect(result[0].sku).toBe('LB-SUN-50')
  })
})
