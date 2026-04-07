import { describe, it, expect, vi, beforeEach } from 'vitest'
import instance from '@/api/instance'
import { getSellerChannelCards, getSellerChannelOrders } from '@/api/integration'

vi.mock('@/api/instance', () => ({
  default: {
    get: vi.fn().mockResolvedValue({}),
  },
}))

describe('integration API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSellerChannelCards는 GET /integrations/seller/channels를 호출한다', async () => {
    await getSellerChannelCards()

    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/integrations/seller/channels')
  })

  it('getSellerChannelOrders는 GET /integrations/seller/orders를 호출한다', async () => {
    await getSellerChannelOrders()

    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/integrations/seller/orders')
  })
})
