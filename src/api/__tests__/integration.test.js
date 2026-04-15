import { describe, it, expect, vi, beforeEach } from 'vitest'
import instance from '@/api/instance'
import {
  getSellerChannelCards,
  getSellerChannelDetail,
  getSellerChannelImportPreview,
  getSellerChannelOrders,
} from '@/api/integration'

vi.mock('@/api/instance', () => ({
  default: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
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
    expect(instance.get).toHaveBeenCalledWith('/integrations/seller/orders', { params: {} })
  })

  it('getSellerChannelDetail은 GET /integrations/seller/channels/{channelKey}를 호출한다', async () => {
    await getSellerChannelDetail('SHOPIFY')

    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/integrations/seller/channels/SHOPIFY')
  })

  it('getSellerChannelImportPreview는 POST /integrations/seller/channels/{channelKey}/import-preview를 호출한다', async () => {
    const payload = { syncWindow: '최근 7일' }

    await getSellerChannelImportPreview('SHOPIFY', payload)

    expect(instance.post).toHaveBeenCalledOnce()
    expect(instance.post).toHaveBeenCalledWith('/integrations/seller/channels/shopify/import-preview', payload)
  })
})
