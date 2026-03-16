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

/**
 * 창고 목록 페이지 — 상단 요약 카드 5개 데이터 조회
 * (등록 창고 수, 활성 창고 수, 총 재고, 금일 출고, 평균 로케이션 가동률)
 * @returns {Promise<AxiosResponse>}
 */
export async function getWarehouseListSummary() {
  return instance.get('/wms/warehouses/summary')
}

/**
 * 창고 목록 조회 — 카드 그리드 및 관리자 테이블 공용
 * (창고별 stats, locationUtil, manager 정보 포함)
 * @returns {Promise<AxiosResponse>}
 */
export async function getWarehouseList() {
  return instance.get('/wms/warehouses')
}
