import { describe, expect, it } from 'vitest'

import {
  buildSellerConnectedChannelCard,
  buildSellerImportedChannelCard,
  buildSellerImportedChannelOrder,
  buildSellerChannelOrderExportRows,
  buildSellerSyncedChannelCard,
  filterSellerChannelOrderRows,
  getSellerChannelMeta,
  getSellerChannelOrderStatusMeta,
  SELLER_CHANNEL_SYNC_CARDS,
  SELLER_CHANNEL_ORDER_ROWS,
} from '@/utils/seller/channelOrders.utils.js'

describe('channelOrders utils', () => {
  it('채널 메타를 반환한다', () => {
    expect(getSellerChannelMeta('AMAZON')).toEqual({
      label: 'Amazon',
      tone: 'gold',
    })
  })

  it('주문 상태 메타를 반환한다', () => {
    expect(getSellerChannelOrderStatusMeta('DELIVERED')).toEqual({
      label: '배송완료',
      tone: 'purple',
    })
  })

  it('채널 필터를 적용한다', () => {
    const result = filterSellerChannelOrderRows(SELLER_CHANNEL_ORDER_ROWS, {
      channel: 'MANUAL',
    })

    expect(result).toHaveLength(2)
    expect(result.every((row) => row.channel === 'MANUAL')).toBe(true)
  })

  it('검색어를 적용한다', () => {
    const result = filterSellerChannelOrderRows(SELLER_CHANNEL_ORDER_ROWS, {
      search: 'Emily',
    })

    expect(result).toHaveLength(1)
    expect(result[0].channelOrderNo).toBe('AMZ-4583201')
  })

  it('채널 연결 완료 시 카드 상태를 연결됨 기준으로 갱신한다', () => {
    const result = buildSellerConnectedChannelCard(SELLER_CHANNEL_SYNC_CARDS[2], {
      storeAlias: 'Qoo10 KR Store',
      connectedAt: '2026-03-19 17:30',
    })

    expect(result).toEqual(
      expect.objectContaining({
        syncStatus: 'CONNECTED',
        lastSyncedAt: '2026-03-19 17:30',
        actions: [
          expect.objectContaining({ key: 'sync' }),
          expect.objectContaining({ key: 'import' }),
        ],
      }),
    )
    expect(result.description).toContain('Qoo10 KR Store')
  })

  it('채널 동기화 완료 시 마지막 동기화 시각을 갱신한다', () => {
    const result = buildSellerSyncedChannelCard(SELLER_CHANNEL_SYNC_CARDS[0], {
      syncedAt: '2026-03-23 10:20',
    })

    expect(result).toEqual(
      expect.objectContaining({
        syncStatus: 'CONNECTED',
        lastSyncedAt: '2026-03-23 10:20',
      }),
    )
  })

  it('주문 가져오기 후 카드 수치를 증가시킨다', () => {
    const result = buildSellerImportedChannelCard(SELLER_CHANNEL_SYNC_CARDS[1], {
      importedAt: '2026-03-23 10:30',
      importedCount: 2,
    })

    expect(result).toEqual(
      expect.objectContaining({
        pendingOrders: 7,
        todayImported: 4,
        lastSyncedAt: '2026-03-23 10:30',
      }),
    )
  })

  it('주문 가져오기용 새 통합 주문 row를 생성한다', () => {
    const result = buildSellerImportedChannelOrder(SELLER_CHANNEL_SYNC_CARDS[0], {
      sequence: 7,
      importedAt: '2026-03-23 11:00',
      orderAmount: 31.4,
    })

    expect(result).toEqual(
      expect.objectContaining({
        channel: 'AMAZON',
        channelOrderNo: 'AMZ-IMPORT-007',
        conkOrderNo: 'ORD-IMPORT-007',
        orderedAt: '2026-03-23 11:00',
        orderAmount: 31.4,
        status: 'NEW',
      }),
    )
  })

  it('통합 주문 목록을 CSV 다운로드용 row로 변환한다', () => {
    const result = buildSellerChannelOrderExportRows([SELLER_CHANNEL_ORDER_ROWS[0]])

    expect(result).toEqual([
      {
        채널: 'Amazon',
        채널주문번호: 'AMZ-4583201',
        CONK주문번호: 'ORD-20260319-001',
        수령자: 'Emily Harris',
        주문상품: '루미에르 앰플 30ml 외 1건',
        주문금액USD: 64.5,
        주문일시: '2026-03-19 09:12',
        처리상태: '신규',
      },
    ])
  })
})
