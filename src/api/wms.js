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

/**
 * 창고 상세 — 재고 현황 (SKU별 가용/할당/총합)
 * @param {number} id — 창고 ID
 * @returns {Promise<AxiosResponse>}
 */
export function getWarehouseInventory(id) {
  return instance.get(`/wms/warehouses/${id}/inventory`)
}

/**
 * 창고 상세 — 출고 현황 (금일/주간/월간 3탭 데이터 포함)
 * @param {number} id — 창고 ID
 * @returns {Promise<AxiosResponse>} { data: { today, week, month } }
 */
export function getWarehouseOutbound(id) {
  return instance.get(`/wms/warehouses/${id}/outbound`)
}

/**
 * 창고 상세 — 주문 처리 상세 (통계 + 목록)
 * @param {number} id — 창고 ID
 * @returns {Promise<AxiosResponse>} { data: { stats, list } }
 */
export function getWarehouseOrders(id) {
  return instance.get(`/wms/warehouses/${id}/orders`)
}

/**
 * 창고 상세 — 로케이션 가용률 (Zone별 Bin 현황)
 * @param {number} id — 창고 ID
 * @returns {Promise<AxiosResponse>} { data: Zone[] }
 */
export function getWarehouseLocations(id) {
  return instance.get(`/wms/warehouses/${id}/locations`)
}

/**
 * ASN 목록 조회
 * @param {{ status?:string }} params — 상태 필터 (옵션)
 * @returns {Promise<AxiosResponse>} { success, data: ASN[] }
 */
export function getAsnList(params = {}) {
  return instance.get('/wms/asns', { params })
}

/**
 * ASN KPI 집계 — 상태별 건수
 * @returns {Promise<AxiosResponse>} { success, data: { total, submitted, received, cancelled } }
 */
export function getAsnKpi() {
  return instance.get('/wms/asns/kpi')
}

/**
 * 창고 등록
 * @param {{
 *   name: string, sqft: number,
 *   address: string, city: string, state: string,
 *   openTime: string, closeTime: string, timezone: string,
 *   managerName?: string, managerEmail?: string
 * }} payload
 * @returns {Promise<AxiosResponse>} { success, message, data: Warehouse }
 */
export function registerWarehouse(payload) {
  return instance.post('/wms/warehouses', payload)
}

/**
 * 요금 설정 조회
 * @returns {Promise<AxiosResponse>} { success, data: FeeSettings }
 */
export function getFeeSettings() {
  return instance.get('/wms/fee-settings')
}

/**
 * 요금 설정 저장
 * @param {object} payload — 요금 설정 전체 객체
 * @returns {Promise<AxiosResponse>}
 */
export function saveFeeSettings(payload) {
  return instance.put('/wms/fee-settings', payload)
}
