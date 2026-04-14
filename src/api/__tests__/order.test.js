import { describe, it, expect, vi, beforeEach } from 'vitest'
import instance from '@/api/instance'
import {
  cancelSellerOrder,
  createSellerBulkOrders,
  createSellerOrder,
  getOutboundStats,
  getSellerOrderDetail,
  getSellerOrderList,
} from '@/api/order'

vi.mock('@/api/instance', () => ({
  default: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
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
    expect(instance.post).toHaveBeenCalledWith('/orders/seller/bulk', expect.any(FormData))
  })

  it('getSellerOrderList는 GET /orders/seller/list를 호출한다', async () => {
    await getSellerOrderList()

    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/orders/seller/list', { params: {} })
  })

  it('getSellerOrderList는 백엔드 지원 쿼리로 GET /orders/seller/list를 호출한다', async () => {
    const params = { page: 0, size: 10, status: 'PENDING' }

    await getSellerOrderList(params)

    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/orders/seller/list', { params })
  })

  it('getSellerOrderDetail은 GET /orders/seller/{orderId}를 호출한다', async () => {
    await getSellerOrderDetail('ORD-2026-00001')

    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/orders/seller/ORD-2026-00001')
  })

  it('cancelSellerOrder는 PATCH /orders/seller/{orderId}/cancel을 호출한다', async () => {
    await cancelSellerOrder('ORD-2026-00001')

    expect(instance.patch).toHaveBeenCalledOnce()
    expect(instance.patch).toHaveBeenCalledWith('/orders/seller/ORD-2026-00001/cancel')
  })
})
