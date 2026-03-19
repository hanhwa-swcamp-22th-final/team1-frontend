import { describe, expect, it } from 'vitest'

import {
  filterSellerOrderRows,
  getSellerOrderDetailById,
  getSellerOrderChannelMeta,
  getSellerOrderProgressStep,
  getSellerOrderStatusMeta,
  SELLER_ORDER_LIST_ROWS,
} from '@/utils/orderList.utils.js'

describe('orderList utils', () => {
  it('상태 필터를 적용해 주문 목록을 반환한다', () => {
    const result = filterSellerOrderRows(SELLER_ORDER_LIST_ROWS, {
      status: 'COMPLETED',
    })

    expect(result).toHaveLength(3)
    expect(result.every((row) => row.status === 'COMPLETED')).toBe(true)
  })

  it('채널 필터를 적용해 주문 목록을 반환한다', () => {
    const result = filterSellerOrderRows(SELLER_ORDER_LIST_ROWS, {
      channel: '엑셀',
    })

    expect(result).toHaveLength(3)
    expect(result.every((row) => row.channel === '엑셀')).toBe(true)
  })

  it('검색어로 주문번호와 수령자명을 조회할 수 있다', () => {
    const result = filterSellerOrderRows(SELLER_ORDER_LIST_ROWS, {
      search: 'William',
    })

    expect(result).toEqual([
      expect.objectContaining({
        orderNo: 'ORD-2026-0310-044',
      }),
    ])
  })

  it('주문 상태 배지 정보를 반환한다', () => {
    expect(getSellerOrderStatusMeta('DISPATCHED')).toEqual({
      label: '출고지시됨',
      tone: 'amber',
    })
  })

  it('주문 채널 태그 정보를 반환한다', () => {
    expect(getSellerOrderChannelMeta('Amazon')).toEqual({
      label: 'Amazon',
      tone: 'amazon',
    })
  })

  it('주문 상세 mock 데이터를 반환한다', () => {
    expect(getSellerOrderDetailById('seller-order-3')).toEqual(
      expect.objectContaining({
        receiverPhone: '+1-713-555-0188',
        items: [
          expect.objectContaining({
            sku: 'LB-CRM-100',
            amount: 29,
          }),
          expect.objectContaining({
            sku: 'LB-AMP-30',
            amount: 34,
          }),
        ],
      }),
    )
  })

  it('취소 상태는 스텝퍼 기준 접수 단계로 처리한다', () => {
    expect(getSellerOrderProgressStep('CANCELLED')).toBe('RECEIVED')
  })
})
