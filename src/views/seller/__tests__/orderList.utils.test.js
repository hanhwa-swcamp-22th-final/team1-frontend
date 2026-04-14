import { describe, expect, it } from 'vitest'

import {
  buildSellerOrderListQuery,
  buildSellerOrderExportRows,
  getSellerOrderChannelMeta,
  getSellerOrderProgressStep,
  getSellerOrderStatusMeta,
  normalizeSellerOrderDetail,
  normalizeSellerOrderListPayload,
  normalizeSellerOrderRow,
} from '@/utils/seller/orderList.utils.js'

describe('orderList utils', () => {
  it('주문 상태 배지 정보를 반환한다', () => {
    expect(getSellerOrderStatusMeta('DISPATCHED')).toEqual({
      label: '출고지시됨',
      tone: 'amber',
    })
  })

  it('주문 채널 태그 정보를 반환한다', () => {
    expect(getSellerOrderChannelMeta('SHOPIFY')).toEqual({
      label: 'Shopify',
      tone: 'shopify',
    })
  })

  it('셀러 주문 목록 응답을 화면 행 구조로 정규화한다', () => {
    expect(normalizeSellerOrderRow({
      orderNo: 'ORD-2026-00001',
      orderChannel: 'MANUAL',
      receiverName: '홍길동',
      street1: '서울시 강남구 테헤란로 1',
      street2: '101동 1001호',
      itemCount: 2,
      canCancel: true,
    })).toEqual(expect.objectContaining({
      id: 'ORD-2026-00001',
      orderId: 'ORD-2026-00001',
      orderNo: 'ORD-2026-00001',
      channel: 'MANUAL',
      recipient: '홍길동',
      address: '서울시 강남구 테헤란로 1 101동 1001호',
      itemsSummary: '상품 2건',
      canCancel: true,
    }))
  })

  it('셀러 주문 목록 조회 쿼리는 백엔드 지원 파라미터만 만든다', () => {
    expect(buildSellerOrderListQuery({
      page: 0,
      size: 10,
      status: 'PENDING',
      channel: 'SHOPIFY',
      search: 'ORD-2026',
    })).toEqual({
      page: 0,
      size: 10,
      status: 'PENDING',
    })
  })

  it('셀러 주문 목록 payload는 data.orders 기준으로만 정규화한다', () => {
    expect(normalizeSellerOrderListPayload({
      orders: [{
        orderNo: 'ORD-2026-00001',
        orderChannel: 'SHOPIFY',
        receiverName: '홍길동',
        street1: '서울시 강남구 테헤란로 1',
        itemCount: 2,
      }],
      items: [{
        orderNo: 'ORD-IGNORE-00001',
      }],
      totalCount: 1,
      page: 0,
      size: 10,
    })).toEqual({
      orders: [
        expect.objectContaining({
          orderId: 'ORD-2026-00001',
          orderNo: 'ORD-2026-00001',
          channel: 'SHOPIFY',
          recipient: '홍길동',
          itemsSummary: '상품 2건',
        }),
      ],
      totalCount: 1,
      page: 0,
      size: 10,
    })
  })

  it('셀러 주문 상세 응답을 화면 상세 구조로 정규화한다', () => {
    expect(normalizeSellerOrderDetail({
      orderId: 'ORD-2026-00001',
      orderedAt: '2026-04-09T10:00:00',
      status: 'RECEIVED',
      orderChannel: 'SHOPIFY',
      receiverName: '홍길동',
      phone: '010-1234-5678',
      memo: '문 앞에 놓아주세요.',
      street1: '서울시 강남구 테헤란로 1',
      street2: '101동 1001호',
      state: '서울',
      zip: '06236',
      country: 'KR',
      canCancel: true,
      items: [{ sku: 'SKU-001', quantity: 2, productName: '상품명' }],
    })).toEqual(expect.objectContaining({
      orderId: 'ORD-2026-00001',
      status: 'RECEIVED',
      orderChannel: 'SHOPIFY',
      receiverName: '홍길동',
      phone: '010-1234-5678',
      street1: '서울시 강남구 테헤란로 1',
      street2: '101동 1001호',
      state: '서울',
      zip: '06236',
      country: 'KR',
      canCancel: true,
      items: [
        expect.objectContaining({
          sku: 'SKU-001',
          quantity: 2,
          productName: '상품명',
        }),
      ],
    }))
  })

  it('상세 응답이 비어도 목록 행의 주문 식별자를 fallback으로 사용한다', () => {
    expect(normalizeSellerOrderDetail({}, {
      orderNo: 'ORD-2026-00002',
      orderChannel: 'MANUAL',
      receiverName: '임꺽정',
      address: '서울시 성동구 아차산로 1',
    })).toEqual(expect.objectContaining({
      orderId: 'ORD-2026-00002',
      orderChannel: 'MANUAL',
      receiverName: '임꺽정',
      street1: '서울시 성동구 아차산로 1',
    }))
  })

  it('현재 주문 목록을 CSV 다운로드용 행으로 정규화한다', () => {
    expect(buildSellerOrderExportRows([{
      orderId: 'ORD-2026-00001',
      channel: 'SHOPIFY',
      recipient: '홍길동',
      address: '서울시 강남구 테헤란로 1',
      itemsSummary: '상품 2건',
      orderedAt: '2026-04-09 10:00',
      status: 'RECEIVED',
      trackingNo: '',
    }])).toEqual([
      {
        주문번호: 'ORD-2026-00001',
        채널: 'Shopify',
        수령자: '홍길동',
        배송지: '서울시 강남구 테헤란로 1',
        주문상품: '상품 2건',
        주문일시: '2026-04-09 10:00',
        상태: '접수됨',
        송장번호: '',
      },
    ])
  })

  it('취소 상태는 스텝퍼 기준 접수 단계로 처리한다', () => {
    expect(getSellerOrderProgressStep('CANCELLED')).toBe('RECEIVED')
  })
})
