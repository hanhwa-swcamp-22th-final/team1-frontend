import { describe, it, expect, vi, beforeEach } from 'vitest'
import instance from '@/api/instance'
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notification'

vi.mock('@/api/instance', () => ({
  default: {
    get: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
  },
}))

describe('notification API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getNotifications는 GET /notifications를 호출한다', async () => {
    await getNotifications({ page: 0, size: 20 })

    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/notifications', {
      params: { page: 0, size: 20 },
    })
  })

  it('markNotificationRead는 PATCH /notifications/{id}/read를 호출한다', async () => {
    await markNotificationRead('notification-1')

    expect(instance.patch).toHaveBeenCalledOnce()
    expect(instance.patch).toHaveBeenCalledWith('/notifications/notification-1/read')
  })

  it('markAllNotificationsRead는 PATCH /notifications/read-all을 호출한다', async () => {
    await markAllNotificationsRead()

    expect(instance.patch).toHaveBeenCalledOnce()
    expect(instance.patch).toHaveBeenCalledWith('/notifications/read-all')
  })

  it('getUnreadNotificationCount는 GET /notifications/unread-count를 호출한다', async () => {
    await getUnreadNotificationCount()

    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/notifications/unread-count')
  })
})
