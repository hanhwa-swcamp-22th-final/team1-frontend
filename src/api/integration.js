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
export function getSellerChannelOrders(params = {}) {
  return instance.get('/integrations/seller/orders', { params })
}

export function connectSellerChannel(channelKey, payload) {
  return instance.post(`/integrations/seller/channels/${channelKey}/connect`, payload)
}

export function syncSellerChannel(channelKey, payload = {}) {
  return instance.post(`/integrations/seller/channels/${channelKey}/sync`, payload)
}

export function importSellerChannelOrders(channelKey, payload = {}) {
  return instance.post(`/integrations/seller/channels/${channelKey}/import-orders`, payload)
}

export function getSellerChannelDetail(channelKey) {
  return instance.get(`/integrations/seller/channels/${channelKey}`)
}

export function getSellerChannelImportPreview(channelKey, payload = {}) {
  const normalizedChannelKey = String(channelKey ?? '').trim().toLowerCase()
  return instance.post(`/integrations/seller/channels/${normalizedChannelKey}/import-preview`, payload)
}
