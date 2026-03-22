import { describe, it, expect, vi, beforeEach } from 'vitest'
import instance from '@/api/instance'
import { getSellerNotifications } from '@/api/notification'

vi.mock('@/api/instance', () => ({
  default: {
    get: vi.fn().mockResolvedValue({}),
  },
}))

describe('notification API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSellerNotifications는 GET /notifications/seller/list를 호출한다', async () => {
    await getSellerNotifications()

    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/notifications/seller/list')
  })
})
