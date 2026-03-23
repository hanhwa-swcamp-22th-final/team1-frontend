import { describe, expect, it } from 'vitest'

import {
  buildSellerOrderExportRows,
  filterSellerOrderRows,
  getSellerOrderDetailById,
  getSellerOrderChannelMeta,
  getSellerOrderProgressStep,
  getSellerOrderStatusMeta,
  normalizeSellerOrderDetail,
  SELLER_ORDER_LIST_ROWS,
} from '@/utils/seller/orderList.utils.js'

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

  it('현재 주문 목록을 CSV 다운로드용 행으로 정규화한다', () => {
    expect(buildSellerOrderExportRows([SELLER_ORDER_LIST_ROWS[0]])).toEqual([
      {
        주문번호: 'ORD-2026-0311-001',
        채널: 'Amazon',
        수령자: 'Sarah Johnson',
        배송지: 'California, Los Angeles',
        주문상품: 'LB-AMP-30 × 2, LB-MSK-5P × 1',
        주문일시: '2026-03-11 09:12',
        상태: '출고완료',
        송장번호: '1Z999AA10123456784',
      },
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

  it('API 상세 응답을 amount가 포함된 구조로 정규화한다', () => {
    expect(
      normalizeSellerOrderDetail({
        memo: 'API 응답',
        items: [{ sku: 'LB-AMP-30', quantity: 2, unitPrice: 34 }],
      }),
    ).toEqual(
      expect.objectContaining({
        memo: 'API 응답',
        items: [
          expect.objectContaining({
            sku: 'LB-AMP-30',
            amount: 68,
          }),
        ],
      }),
    )
  })

  it('취소 상태는 스텝퍼 기준 접수 단계로 처리한다', () => {
    expect(getSellerOrderProgressStep('CANCELLED')).toBe('RECEIVED')
  })
})
