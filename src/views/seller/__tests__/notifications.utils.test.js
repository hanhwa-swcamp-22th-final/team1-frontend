import { describe, expect, it } from 'vitest'

import {
  countNotificationsByFilter,
  countUnreadNotifications,
  filterSellerNotifications,
  markAllNotificationsRead,
  SELLER_NOTIFICATION_ROWS,
} from '@/utils/notifications.utils.js'

describe('notifications utils', () => {
  it('안읽음 개수를 계산한다', () => {
    expect(countUnreadNotifications(SELLER_NOTIFICATION_ROWS)).toBe(3)
  })

  it('안읽음 필터를 적용한다', () => {
    const result = filterSellerNotifications(SELLER_NOTIFICATION_ROWS, {
      filter: 'unread',
    })

    expect(result).toHaveLength(3)
    expect(result.every((row) => !row.read)).toBe(true)
  })

  it('유형 필터 개수를 계산한다', () => {
    expect(countNotificationsByFilter(SELLER_NOTIFICATION_ROWS, 'LOW_STOCK')).toBe(2)
  })

  it('전체 읽음 처리된 새 배열을 만든다', () => {
    const result = markAllNotificationsRead(SELLER_NOTIFICATION_ROWS)

    expect(result.every((row) => row.read)).toBe(true)
    expect(SELLER_NOTIFICATION_ROWS.some((row) => !row.read)).toBe(true)
  })
})
