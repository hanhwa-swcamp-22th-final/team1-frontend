import { describe, expect, it } from 'vitest'

import {
  buildSellerChannelOrderExportRows,
  getSellerChannelOrderStatusMeta,
  normalizeSellerChannelOrderPage,
} from '@/utils/seller/channelOrders.utils.js'

describe('channelOrders utils', () => {
  it('PROCESSING 상태 메타를 반환한다', () => {
    expect(getSellerChannelOrderStatusMeta('PROCESSING')).toEqual({
      label: '처리중',
      tone: 'amber',
    })
  })

  it('주문 페이지 응답을 정규화할 때 null 금액과 PROCESSING 상태를 안전하게 처리한다', () => {
    const result = normalizeSellerChannelOrderPage({
      items: [
        {
          id: 'ORD-1',
          channel: 'SHOPIFY',
          channelOrderNo: '#1001',
          conkOrderNo: 'ORD-1',
          recipient: '홍길동',
          itemsSummary: '상품A',
          orderAmount: null,
          orderedAt: '2026-04-15T08:30:00',
          status: 'PROCESSING',
        },
      ],
      total: 1,
      page: 0,
      size: 20,
    })

    expect(result.items[0].orderAmount).toBe(0)
    expect(result.items[0].status).toBe('PROCESSING')
    expect(result.items[0].orderedAt).toBe('2026-04-15 08:30')
  })

  it('통합 주문 목록을 CSV 다운로드용 row로 변환한다', () => {
    const result = buildSellerChannelOrderExportRows([{
      channel: 'SHOPIFY',
      channelOrderNo: '#1001',
      conkOrderNo: 'ORD-1',
      recipient: '홍길동',
      itemsSummary: '상품A',
      orderAmount: 0,
      orderedAt: '2026-04-15 08:30',
      status: 'PROCESSING',
    }])

    expect(result).toEqual([{
      채널: 'Shopify',
      채널주문번호: '#1001',
      CONK주문번호: 'ORD-1',
      수령자: '홍길동',
      주문상품: '상품A',
      주문금액USD: 0,
      주문일시: '2026-04-15 08:30',
      처리상태: '처리중',
    }])
  })
})
