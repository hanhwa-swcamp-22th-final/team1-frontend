import instance from './instance.js'

/**
 * 대시보드용 출고 통계 조회
 * @returns {Promise<AxiosResponse>}
 */
export async function getOutboundStats() {
  return instance.get('/orders/outbound/stats')
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
