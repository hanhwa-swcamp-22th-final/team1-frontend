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
 * @param {File|Blob} file
 * @returns {Promise<AxiosResponse>}
 */
export async function createSellerBulkOrders(file) {
  const formData = new FormData()
  formData.append('file', file)
  return instance.post('/orders/seller/bulk', formData)
}

/**
 * 셀러 엑셀 업로드 템플릿 다운로드
 * @returns {Promise<AxiosResponse<Blob>>}
 */
export function downloadSellerBulkOrderTemplate() {
  return instance.get('/orders/seller/bulk/template', { responseType: 'blob' })
}

/**
 * 셀러 주문 목록 조회
 * @returns {Promise<AxiosResponse>} { success, data: { orders, totalCount, page, size } }
 */
export function getSellerOrderList(params = {}) {
  return instance.get('/orders/seller/list', { params })
}

export function getSellerOrderDetail(orderId) {
  return instance.get(`/orders/seller/${orderId}`)
}

export function cancelSellerOrder(orderId) {
  return instance.patch(`/orders/seller/${orderId}/cancel`)
}

export function getSellerOrderOptions() {
  return instance.get('/orders/seller/options')
}

export function getSellerMarginPresets() {
  return instance.get('/orders/seller/margin-presets')
}

export function getSellerOrderKpi() {
  return instance.get('/orders/seller/kpi')
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

/**
 * 대시보드용 당월 총 매출 조회
 * @returns {Promise<AxiosResponse>} { success, data: { totalRevenue, trend, trendLabel, trendType } }
 */
export function getCurrentRevenue() {
  return instance.get('/orders/revenue/current')
}

/**
 * 월별 매출 추이 조회 (최근 6개월)
 * @returns {Promise<AxiosResponse>} { success, data: Array<{ month, label, revenue }> }
 */
export function getMonthlyRevenue() {
  return instance.get('/orders/revenue/monthly')
}
