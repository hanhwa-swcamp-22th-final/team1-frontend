import { describe, expect, it } from 'vitest'

import {
  filterSellerAsnRows,
  getSellerAsnKpi,
  SELLER_ASN_LIST_ROWS,
} from '@/utils/asnList.utils.js'
import { ASN_STATUS } from '@/constants'

describe('asnList utils', () => {
  it('ASN 목록 KPI를 상태별로 계산한다', () => {
    expect(getSellerAsnKpi(SELLER_ASN_LIST_ROWS)).toEqual({
      total: 5,
      submitted: 2,
      received: 2,
      cancelled: 1,
    })
  })

  it('상태 필터를 적용해 ASN 목록을 반환한다', () => {
    const result = filterSellerAsnRows(SELLER_ASN_LIST_ROWS, {
      status: ASN_STATUS.RECEIVED,
    })

    expect(result).toHaveLength(2)
    expect(result.every((row) => row.status === ASN_STATUS.RECEIVED)).toBe(true)
  })

  it('검색어로 ASN 번호와 메모를 조회할 수 있다', () => {
    const result = filterSellerAsnRows(SELLER_ASN_LIST_ROWS, {
      status: 'all',
      search: '급행',
    })

    expect(result).toEqual([
      expect.objectContaining({
        asnNo: 'ASN-20260317-003',
      }),
    ])
  })
})
