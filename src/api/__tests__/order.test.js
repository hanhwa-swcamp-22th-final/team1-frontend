import { describe, it, expect, vi, beforeEach } from 'vitest'
import instance from '@/api/instance'
import { getOutboundStats } from '@/api/order'

vi.mock('@/api/instance', () => ({
  default: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
  },
}))

describe('order API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getOutboundStats는 GET /orders/outbound/stats를 호출한다', async () => {
    await getOutboundStats()
    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/orders/outbound/stats')
  })
})
