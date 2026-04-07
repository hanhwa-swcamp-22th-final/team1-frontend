import { describe, it, expect, vi, beforeEach } from 'vitest'
import instance from '@/api/instance'
import {
  createSellerProduct,
  getSellerProductDetail,
  getSellerProductList,
  updateSellerProduct,
} from '@/api/wms'

vi.mock('@/api/instance', () => ({
  default: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
  },
}))

describe('product API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSellerProductList는 GET /wms/products/seller/list를 호출한다', async () => {
    await getSellerProductList()

    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/wms/products/seller/list')
  })

  it('createSellerProduct는 POST /wms/products/seller/register를 호출한다', async () => {
    const payload = { sku: 'LB-NEW-10' }

    await createSellerProduct(payload)

    expect(instance.post).toHaveBeenCalledOnce()
    expect(instance.post).toHaveBeenCalledWith('/wms/products/seller/register', payload)
  })

  it('getSellerProductDetail은 GET /wms/products/seller/:id를 호출한다', async () => {
    await getSellerProductDetail('seller-product-1')

    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/wms/products/seller/seller-product-1')
  })

  it('updateSellerProduct는 PUT /wms/products/seller/:id를 호출한다', async () => {
    const payload = { productName: '수정 상품' }

    await updateSellerProduct('seller-product-1', payload)

    expect(instance.put).toHaveBeenCalledOnce()
    expect(instance.put).toHaveBeenCalledWith('/wms/products/seller/seller-product-1', payload)
  })
})
