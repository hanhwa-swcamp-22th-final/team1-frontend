import { describe, it, expect, vi, beforeEach } from 'vitest'
import instance from '@/api/instance'
import { getSellerProductList } from '@/api/product'

vi.mock('@/api/instance', () => ({
  default: {
    get: vi.fn().mockResolvedValue({}),
  },
}))

describe('product API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSellerProductList는 GET /products/seller/list를 호출한다', async () => {
    await getSellerProductList()

    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/products/seller/list')
  })
})
