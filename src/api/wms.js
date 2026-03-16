import instance from './instance.js'

/**
 * 대시보드용 ASN 통계 조회
 * @returns {Promise<AxiosResponse>}
 */
export async function getAsnStats() {
  return instance.get('/wms/asn/stats')
}

/**
 * 대시보드용 재고 부족 통계 조회
 * @returns {Promise<AxiosResponse>}
 */
export async function getInventoryStats() {
  return instance.get('/wms/inventory/stats')
}

/**
 * 대시보드용 창고 운영 현황 조회
 * @returns {Promise<AxiosResponse>}
 */
export async function getWarehouseStatus() {
  return instance.get('/wms/warehouses/status')
}
