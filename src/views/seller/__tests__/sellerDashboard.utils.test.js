import { describe, expect, it } from 'vitest'

import {
  buildSellerDashboardDonutSegments,
  buildSellerDashboardInboundRows,
  buildSellerDashboardKpiCards,
  buildSellerDashboardRecentActivityRows,
  buildSellerDashboardStockRatio,
  buildSellerDashboardTrendChart,
  buildSellerDashboardTrendSeries,
  buildSellerDashboardViewState,
  getSellerDashboardTrendSeries,
  SELLER_DASHBOARD_TREND_SERIES,
} from '@/utils/seller/sellerDashboard.utils.js'

describe('sellerDashboard utils', () => {
  it('KPI 카드는 전달된 재고/주문 데이터로 계산한다', () => {
    const cards = buildSellerDashboardKpiCards({
      baseDate: new Date('2026-03-19T12:00:00'),
      inventoryRows: [
        { availableStock: 100, allocatedStock: 15, status: 'NORMAL' },
        { availableStock: 30, allocatedStock: 5, status: 'LOW' },
        { availableStock: 0, allocatedStock: 0, status: 'OUT' },
      ],
      orderRows: [
        { id: 'order-1', orderNo: 'ORD-001', channel: '수동', orderedAt: '2026-03-19 09:00', status: 'RECEIVED' },
        { id: 'order-2', orderNo: 'ORD-002', channel: '수동', orderedAt: '2026-03-18 09:00', status: 'WAITING' },
      ],
      channelOrderRows: [
        { id: 'channel-1', channelOrderNo: 'CH-001', channel: 'SHOPIFY', orderedAt: '2026-03-19 11:00', status: 'COMPLETED' },
      ],
    })

    expect(cards).toEqual([
      expect.objectContaining({ key: 'available-stock', value: '130' }),
      expect.objectContaining({ key: 'new-orders', value: '2', subtext: '수동 1 · Shopify 1' }),
      expect.objectContaining({ key: 'outbound-status', value: '1 · 1 · 1' }),
      expect.objectContaining({ key: 'low-stock', value: '2', subtext: '재고부족 1 · 품절 1' }),
    ])
  })

  it('기간 키가 없으면 기본 월간 추이 데이터를 반환한다', () => {
    expect(getSellerDashboardTrendSeries('unknown')).toEqual(SELLER_DASHBOARD_TREND_SERIES.month)
  })

  it('추이 시리즈는 전달된 주문 데이터로 주간/월간/분기별 포인트를 만든다', () => {
    const result = buildSellerDashboardTrendSeries({
      orderRows: [
        { id: 'order-1', orderNo: 'ORD-001', channel: '수동', orderedAt: '2026-03-18 09:00', status: 'RECEIVED' },
        { id: 'order-2', orderNo: 'ORD-002', channel: '수동', orderedAt: '2026-03-19 09:00', status: 'RECEIVED' },
      ],
      channelOrderRows: [
        { id: 'channel-1', channelOrderNo: 'CH-001', channel: 'SHOPIFY', orderedAt: '2026-03-19 12:00', status: 'COMPLETED' },
      ],
    })

    expect(result.week.key).toBe('week')
    expect(result.month.key).toBe('month')
    expect(result.quarter.key).toBe('quarter')
    expect(result.month.points.at(-1)).toEqual({ label: '3월', value: 3 })
  })

  it('추이 차트용 좌표를 생성한다', () => {
    const result = buildSellerDashboardTrendChart(
      [
        { label: '1월', value: 100 },
        { label: '2월', value: 200 },
        { label: '3월', value: 300 },
      ],
      { maxValue: 300 },
    )

    expect(result.linePoints).toBe('110,132 385,84 660,36')
    expect(result.areaPoints).toBe('110,132 385,84 660,36 660,180 110,180')
    expect(result.xLabels).toEqual([
      { label: '1월', x: 110 },
      { label: '2월', x: 385 },
      { label: '3월', x: 660 },
    ])
  })

  it('도넛 차트 세그먼트는 퍼센트 기준으로 dash 길이와 offset을 계산한다', () => {
    const result = buildSellerDashboardDonutSegments([
      { key: 'available', value: 60 },
      { key: 'allocated', value: 10 },
      { key: 'inbound', value: 30 },
    ])

    expect(result[0]).toEqual(expect.objectContaining({ key: 'available', dasharray: '226.2 377', dashoffset: 0 }))
    expect(result[1]).toEqual(expect.objectContaining({ key: 'allocated', dashoffset: -226.2 }))
    expect(result[2]).toEqual(expect.objectContaining({ key: 'inbound', dashoffset: -263.9 }))
  })

  it('대시보드 뷰 상태는 데이터/오류 유무를 구분한다', () => {
    expect(buildSellerDashboardViewState({
      kpiCards: [{ value: '0' }],
      trendSeries: { points: [{ label: '1월', value: 0 }] },
      recentActivityRows: [],
      inboundRows: [],
    })).toEqual(expect.objectContaining({
      isEmpty: true,
      hasTrendData: false,
      hasRecentActivity: false,
      hasInboundRows: false,
    }))

    expect(buildSellerDashboardViewState({
      errorMessage: '대시보드 조회 실패',
    })).toEqual(expect.objectContaining({
      hasError: true,
      errorMessage: '대시보드 조회 실패',
      isEmpty: false,
    }))
  })

  it('재고 비율과 최근 활동/입고 목록을 API 행 기준으로 계산한다', () => {
    expect(buildSellerDashboardStockRatio({
      inventoryRows: [
        { availableStock: 90, allocatedStock: 10, inboundExpected: 50 },
      ],
    })).toEqual([
      { key: 'available', label: '가용재고', value: 60, color: '#F5A623' },
      { key: 'allocated', label: '할당재고', value: 7, color: '#4C74FF' },
      { key: 'inbound', label: '입고예정', value: 33, color: '#7B859A' },
    ])

    const recentActivityRows = buildSellerDashboardRecentActivityRows({
      orderRows: [
        {
          id: 'seller-order-1',
          orderNo: 'ORD-20260319-001',
          channel: 'SHOPIFY',
          itemsSummary: 'LB-AMP-30 × 2',
          orderedAt: '2026-03-19 10:00',
          status: 'RECEIVED',
        },
      ],
    })

    expect(recentActivityRows[0]).toEqual(expect.objectContaining({
      code: 'ORD-20260319-001',
      routeName: 'seller-order-list',
      order: expect.objectContaining({
        channel: 'Shopify',
      }),
    }))

    const inboundRows = buildSellerDashboardInboundRows({
      asnRows: [
        {
          id: 'asn-1',
          asnNo: 'ASN-20260318-001',
          expectedDate: '2026-03-21',
          status: 'SUBMITTED',
          detail: {
            items: [{ sku: 'LB-AMP-30', quantity: 180 }],
          },
        },
      ],
      inventoryRows: [
        {
          id: 'seller-inventory-1',
          sku: 'LB-AMP-30',
          productName: '루미에르 앰플 30ml',
          inboundExpected: 40,
          detail: {},
        },
      ],
    })

    expect(inboundRows[0]).toEqual(expect.objectContaining({
      sku: 'LB-AMP-30',
      expectedQty: '180',
      routeName: 'seller-asn-list',
      inventoryDetail: expect.objectContaining({
        nextInboundAsnNo: 'ASN-20260318-001',
      }),
    }))
  })
})
