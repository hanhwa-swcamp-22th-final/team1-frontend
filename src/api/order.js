import instance from './instance.js'

/**
 * 대시보드용 출고 통계 조회
 * @returns {Promise<AxiosResponse>}
 */
export async function getOutboundStats() {
  return instance.get('/orders/outbound/stats')
}

/**
 * 셀러 단건 주문 등록
 * @param {object} payload
 * @returns {Promise<AxiosResponse>}
 */
export async function createSellerOrder(payload) {
  return instance.post('/orders/seller/manual', payload)
}

/**
 * 셀러 엑셀 업로드 주문 일괄 등록
 * @param {Array<object>} orders
 * @returns {Promise<AxiosResponse>}
 */
export async function createSellerBulkOrders(orders) {
  return instance.post('/orders/seller/bulk', { orders })
}

/**
 * 셀러 주문 목록 조회
 * @returns {Promise<AxiosResponse>} { success, data: SellerOrderRow[] }
 */
export function getSellerOrderList() {
  return instance.get('/orders/seller/list')
}

/**
 * 주문 목록 조회 (masterAdmin)
 * @returns {Promise<AxiosResponse>} { success, data: Order[] }
 */
export function getOrderList() {
  return instance.get('/orders/list')
}

/**
 * 주문 KPI 집계 (masterAdmin)
 * @returns {Promise<AxiosResponse>} { success, data: { todayTotal, pendingCount, pickingCount, shippedCount } }
 */
export function getOrderKpi() {
  return instance.get('/orders/kpi')
}

/**
 * 창고 관리자 주문 목록 조회
 * @returns {Promise<AxiosResponse>}
 */
export async function getWhmOrders() {
  return instance.get('/orders/whm')
}
