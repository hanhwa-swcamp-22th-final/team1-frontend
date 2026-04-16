import { describe, it, expect, vi, beforeEach } from 'vitest'
import instance from '@/api/instance'
import {
  getAsnBinMatches,
  createSellerAsn,
  getAsnBinCandidates,
  getAsnRecommendedBins,
  getAsnStats,
  getInventoryStats,
  getWarehouseStatus,
  getAsnList,
  getAsnKpi,
  getWhmPickingListDetail,
  getWhmPickingLists,
  saveAsnBinAssignments,
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
    expect(instance.get).toHaveBeenCalledWith('/wms/seller/asns', { params: {} })
  })

  it('createSellerAsn는 POST /wms/seller/asns를 호출한다', async () => {
    const payload = { asnNo: 'ASN-20260322-001' }

    await createSellerAsn(payload)

    expect(instance.post).toHaveBeenCalledOnce()
    expect(instance.post).toHaveBeenCalledWith('/wms/seller/asns', payload)
  })

  it('getSellerInventoryList는 GET /wms/seller/inventories를 호출한다', async () => {
    await getSellerInventoryList()
    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/wms/seller/inventories', { params: {} })
  })

  it('getAsnBinCandidates는 GET /wms/asns/{asnId}/bin-candidates를 호출한다', async () => {
    await getAsnBinCandidates('ASN-20260322-001')
    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/wms/asns/ASN-20260322-001/bin-candidates')
  })

  it('getAsnBinMatches는 GET /wms/asns/{asnId}/bin-matches를 호출한다', async () => {
    await getAsnBinMatches('ASN-20260322-001')
    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/wms/asns/ASN-20260322-001/bin-matches')
  })

  it('getAsnRecommendedBins는 GET /wms/asns/{asnId}/recommended-bins를 호출한다', async () => {
    await getAsnRecommendedBins('ASN-20260322-001')
    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/wms/asns/ASN-20260322-001/recommended-bins', { params: {} })
  })

  it('saveAsnBinAssignments는 POST /wms/asns/{asnId}/bin-assignments를 호출한다', async () => {
    const payload = {
      assignments: [{ sku: 'SKU-001', bin: 'A-1-1', isNewSku: true }],
    }

    await saveAsnBinAssignments('ASN-20260322-001', payload)

    expect(instance.post).toHaveBeenCalledOnce()
    expect(instance.post).toHaveBeenCalledWith('/wms/asns/ASN-20260322-001/bin-assignments', payload)
  })

  it('getWhmPickingLists는 GET /wms/manager/picking-lists를 호출한다', async () => {
    await getWhmPickingLists()
    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/wms/manager/picking-lists', { params: undefined })
  })

  it('getWhmPickingListDetail는 GET /wms/manager/picking-lists/{id}를 호출한다', async () => {
    await getWhmPickingListDetail('WORK-OUT-CONK-ORD-001')
    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/wms/manager/picking-lists/WORK-OUT-CONK-ORD-001')
  })
})
