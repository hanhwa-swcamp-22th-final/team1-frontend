import instance from './instance.js'

/**
 * 셀러 채널 연결 카드 조회
 * @returns {Promise<AxiosResponse>} { success, data: SellerChannelCard[] }
 */
export function getSellerChannelCards() {
  return instance.get('/integrations/seller/channels')
}

/**
 * 셀러 채널 통합 주문 조회
 * @returns {Promise<AxiosResponse>} { success, data: SellerChannelOrder[] }
 */
export function getSellerChannelOrders() {
  return instance.get('/integrations/seller/orders')
}
