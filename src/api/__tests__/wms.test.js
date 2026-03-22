import { describe, it, expect, vi, beforeEach } from 'vitest'
import instance from '@/api/instance'
import {
  getAsnStats,
  getInventoryStats,
  getWarehouseStatus,
  getAsnList,
  getAsnKpi,
  getSellerAsnList,
  getSellerInventoryList,
} from '@/api/wms'

vi.mock('@/api/instance', () => ({
  default: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
  },
}))

describe('wms API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getAsnStats는 GET /wms/asn/stats를 호출한다', async () => {
    await getAsnStats()
    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/wms/asn/stats')
  })

  it('getInventoryStats는 GET /wms/inventory/stats를 호출한다', async () => {
    await getInventoryStats()
    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/wms/inventory/stats')
  })

  it('getWarehouseStatus는 GET /wms/warehouses/status를 호출한다', async () => {
    await getWarehouseStatus()
    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/wms/warehouses/status')
  })

  it('getAsnList는 GET /wms/asns를 호출한다', async () => {
    await getAsnList()
    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/wms/asns', { params: {} })
  })

  it('getAsnKpi는 GET /wms/asns/kpi를 호출한다', async () => {
    await getAsnKpi()
    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/wms/asns/kpi')
  })

  it('getSellerAsnList는 GET /wms/seller/asns를 호출한다', async () => {
    await getSellerAsnList()
    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/wms/seller/asns')
  })

  it('getSellerInventoryList는 GET /wms/seller/inventories를 호출한다', async () => {
    await getSellerInventoryList()
    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/wms/seller/inventories')
  })
})
