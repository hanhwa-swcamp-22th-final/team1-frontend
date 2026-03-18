import { describe, it, expect, vi, beforeEach } from 'vitest'
import instance from '@/api/instance'
import { createSellerBulkOrders, createSellerOrder, getOutboundStats } from '@/api/order'

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

  it('createSellerOrder는 POST /orders/seller/manual을 호출한다', async () => {
    const payload = { orderNo: 'ORD-20260317-001', sku: 'SKU-AMPLE-001', quantity: 2 }

    await createSellerOrder(payload)

    expect(instance.post).toHaveBeenCalledOnce()
    expect(instance.post).toHaveBeenCalledWith('/orders/seller/manual', payload)
  })

  it('createSellerBulkOrders는 POST /orders/seller/bulk를 호출한다', async () => {
    const orders = [
      { orderNo: 'ORD-20260317-001', sku: 'SKU-AMPLE-001', quantity: 2 },
      { orderNo: 'ORD-20260317-002', sku: 'SKU-AMPLE-002', quantity: 1 },
    ]

    await createSellerBulkOrders(orders)

    expect(instance.post).toHaveBeenCalledOnce()
    expect(instance.post).toHaveBeenCalledWith('/orders/seller/bulk', { orders })
  })
})
