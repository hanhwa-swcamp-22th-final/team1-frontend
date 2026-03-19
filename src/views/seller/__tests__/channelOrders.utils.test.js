import { describe, expect, it } from 'vitest'

import {
  buildSellerConnectedChannelCard,
  filterSellerChannelOrderRows,
  getSellerChannelMeta,
  getSellerChannelOrderStatusMeta,
  SELLER_CHANNEL_SYNC_CARDS,
  SELLER_CHANNEL_ORDER_ROWS,
} from '@/utils/channelOrders.utils.js'

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
})
