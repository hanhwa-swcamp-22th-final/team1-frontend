import { describe, expect, it } from 'vitest'

import {
  buildSellerDashboardInboundRows,
  buildSellerDashboardDonutSegments,
  buildSellerDashboardKpiCards,
  buildSellerDashboardRecentActivityRows,
  buildSellerDashboardStockRatio,
  buildSellerDashboardTrendChart,
  buildSellerDashboardViewState,
  getSellerDashboardTrendSeries,
  SELLER_DASHBOARD_KPI_CARDS,
  SELLER_DASHBOARD_STOCK_RATIO,
  SELLER_DASHBOARD_TREND_SERIES,
} from '@/utils/seller/sellerDashboard.utils.js'

describe('sellerDashboard utils', () => {
  it('기존 Seller 화면 데이터로 KPI 카드를 계산한다', () => {
    expect(SELLER_DASHBOARD_KPI_CARDS).toEqual(buildSellerDashboardKpiCards())
    expect(buildSellerDashboardKpiCards({
      baseDate: new Date('2026-03-19T12:00:00'),
    })).toEqual([
      expect.objectContaining({
        key: 'available-stock',
        value: '1,488',
        routeName: 'seller-inventory',
      }),
      expect.objectContaining({
        key: 'new-orders',
        value: '2',
        trend: '▼ 50%',
        routeName: 'seller-order-list',
      }),
      expect.objectContaining({
        key: 'outbound-status',
        value: '3 · 8 · 4',
      }),
      expect.objectContaining({
        key: 'low-stock',
        value: '3',
        subtext: '재고부족 2 · 품절 1',
      }),
    ])
  })

  it('금일 신규 주문은 실제 기준일 하루만 집계한다', () => {
    const cards = buildSellerDashboardKpiCards({
      baseDate: new Date('2026-03-21T12:00:00'),
    })

    expect(cards[1]).toEqual(
      expect.objectContaining({
        key: 'new-orders',
        value: '0',
        subtext: '오늘 신규 주문 없음',
      }),
    )
    expect(cards[1].trend).toBeUndefined()
  })

  it('기간 키가 없으면 월간 추이 데이터를 반환한다', () => {
    expect(getSellerDashboardTrendSeries('unknown')).toEqual(SELLER_DASHBOARD_TREND_SERIES.month)
  })

  it('기간별 추이 데이터는 기존 주문 목록 기준으로 집계된다', () => {
    expect(SELLER_DASHBOARD_TREND_SERIES.month.points).toEqual([
      { label: '10월', value: 0 },
      { label: '11월', value: 0 },
      { label: '12월', value: 0 },
      { label: '1월', value: 0 },
      { label: '2월', value: 0 },
      { label: '3월', value: 16 },
    ])
    expect(SELLER_DASHBOARD_TREND_SERIES.month.maxValue).toBe(20)
  })

  it('추이 차트용 line/area 좌표를 생성한다', () => {
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
    expect(result.yLabels[0]).toEqual({ value: 300, y: 24 })
  })

  it('기간 변경 시 축 라벨 좌표를 정수 픽셀로 맞춘다', () => {
    const result = buildSellerDashboardTrendChart(SELLER_DASHBOARD_TREND_SERIES.week.points, {
      maxValue: SELLER_DASHBOARD_TREND_SERIES.week.maxValue,
    })

    expect(result.xLabels.every((label) => Number.isInteger(label.x))).toBe(true)
    expect(result.points.every((point) => Number.isInteger(point.x) && Number.isInteger(point.y))).toBe(true)
  })

  it('도넛 차트용 stroke 길이와 오프셋을 계산한다', () => {
    const result = buildSellerDashboardDonutSegments(SELLER_DASHBOARD_STOCK_RATIO)

    expect(result).toEqual([
      expect.objectContaining({
        key: 'available',
        dasharray: '241.28 377',
        dashoffset: 0,
      }),
      expect.objectContaining({
        key: 'allocated',
        dasharray: '33.93 377',
        dashoffset: -241.28,
      }),
      expect.objectContaining({
        key: 'inbound',
        dasharray: '101.79 377',
        dashoffset: -275.21,
      }),
    ])
  })

  it('대시보드 뷰 상태에서 빈 데이터와 오류 상태를 구분한다', () => {
    expect(buildSellerDashboardViewState({
      kpiCards: [
        { value: '0' },
        { value: '0' },
        { value: '0 · 0 · 0' },
        { value: '0' },
      ],
      trendSeries: { points: [{ label: '1월', value: 0 }] },
      recentActivityRows: [],
      inboundRows: [],
    })).toEqual(
      expect.objectContaining({
        isEmpty: true,
        hasTrendData: false,
        hasRecentActivity: false,
        hasInboundRows: false,
      }),
    )

    expect(buildSellerDashboardViewState({
      errorMessage: '대시보드 조회 실패',
    })).toEqual(
      expect.objectContaining({
        hasError: true,
        errorMessage: '대시보드 조회 실패',
        isEmpty: false,
      }),
    )
  })

  it('재고 비율과 하단 목록도 기존 Seller 데이터에서 계산한다', () => {
    expect(buildSellerDashboardStockRatio()).toEqual([
      { key: 'available', label: '가용재고', value: 64, color: '#F5A623' },
      { key: 'allocated', label: '할당재고', value: 9, color: '#4C74FF' },
      { key: 'inbound', label: '입고예정', value: 27, color: '#7B859A' },
    ])

    expect(buildSellerDashboardRecentActivityRows()[0]).toEqual(
      expect.objectContaining({
        code: 'ORD-20260319-001',
        order: expect.objectContaining({
          orderNo: 'ORD-20260319-001',
          channel: 'Amazon',
        }),
        orderDetail: expect.objectContaining({
          receiverPhone: '+1-000-000-0000',
        }),
        routeName: 'seller-order-list',
      }),
    )

    expect(buildSellerDashboardViewState({
      kpiCards: SELLER_DASHBOARD_KPI_CARDS,
      trendSeries: SELLER_DASHBOARD_TREND_SERIES.month,
      recentActivityRows: buildSellerDashboardRecentActivityRows(),
      inboundRows: buildSellerDashboardInboundRows(),
    })).toEqual(
      expect.objectContaining({
        isEmpty: false,
        hasKpiData: true,
        hasTrendData: true,
        hasRecentActivity: true,
        hasInboundRows: true,
      }),
    )

    expect(buildSellerDashboardInboundRows()[0]).toEqual(
      expect.objectContaining({
        period: '3월 21일',
        sku: 'LB-AMP-30',
        expectedQty: '180',
        inventory: expect.objectContaining({
          id: 'seller-inventory-1',
          sku: 'LB-AMP-30',
          inboundExpected: 180,
        }),
        inventoryDetail: expect.objectContaining({
          nextInboundAsnNo: 'ASN-20260318-001',
        }),
        routeName: 'seller-asn-list',
      }),
    )

    const matchedMaskRow = buildSellerDashboardInboundRows().find((row) => row.sku === 'LB-MSK-5P')
    expect(matchedMaskRow).toEqual(
      expect.objectContaining({
        period: '3월 19일',
        expectedQty: '100',
        etaLabel: '도착 예정',
      }),
    )
  })

  it('API row detail이 있으면 대시보드 상세 fallback 대신 그 값을 우선 사용한다', () => {
    const recentRows = buildSellerDashboardRecentActivityRows({
      orderRows: [
        {
          id: 'seller-order-api',
          orderNo: 'ORD-API-001',
          channel: 'Amazon',
          recipient: 'API User',
          address: 'Texas, Austin',
          itemsSummary: 'LB-AMP-30 × 2',
          orderedAt: '2026-03-19 10:00',
          status: 'RECEIVED',
          trackingNo: '',
          detail: {
            receiverPhone: '+1-512-555-0100',
            state: 'Texas',
            city: 'Austin',
            zipCode: '73301',
            addressLine: '100 Congress Ave',
            shippingMethod: 'UPS Ground',
            carrier: 'UPS',
            memo: 'API detail',
            items: [{ sku: 'LB-AMP-30', productName: '루미에르 앰플 30ml', quantity: 2, unitPrice: 34 }],
          },
        },
      ],
      channelOrderRows: [],
      asnRows: [],
      inventoryRows: [],
    })

    expect(recentRows[0].orderDetail).toEqual(
      expect.objectContaining({
        receiverPhone: '+1-512-555-0100',
        memo: 'API detail',
      }),
    )

    const inboundRows = buildSellerDashboardInboundRows({
      asnRows: [
        {
          id: 'seller-asn-api',
          asnNo: 'ASN-API-001',
          expectedDate: '2026-03-21',
          status: 'SUBMITTED',
          detail: {
            items: [{ sku: 'LB-AMP-30', quantity: 120, cartons: 12 }],
          },
        },
      ],
      inventoryRows: [
        {
          id: 'seller-inventory-api',
          sku: 'LB-AMP-30',
          productName: '루미에르 앰플 30ml',
          warehouseName: 'ICN-A',
          inboundExpected: 40,
          availableStock: 100,
          allocatedStock: 10,
          totalStock: 110,
          lastInboundDate: '2026-03-10',
          detail: {
            nextInboundAsnNo: 'ASN-OLD-001',
            memo: 'inventory api detail',
          },
        },
      ],
    })

    expect(inboundRows[0]).toEqual(
      expect.objectContaining({
        expectedQty: '120',
        inventoryDetail: expect.objectContaining({
          nextInboundAsnNo: 'ASN-API-001',
          memo: 'inventory api detail',
        }),
      }),
    )
  })
})
