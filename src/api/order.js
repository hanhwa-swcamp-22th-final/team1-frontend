import instance from './instance.js'

/**
 * 대시보드용 출고 통계 조회
 * @returns {Promise<AxiosResponse>}
 */
export async function getOutboundStats() {
  return instance.get('/orders/outbound/stats')
}
