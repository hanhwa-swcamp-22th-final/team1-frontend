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
