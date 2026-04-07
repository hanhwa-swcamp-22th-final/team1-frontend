import instance from './instance.js'

/**
 * 셀러 알림 목록 조회
 * @returns {Promise<AxiosResponse>} { success, data: SellerNotification[] }
 */
export function getSellerNotifications() {
  return instance.get('/notifications/seller/list')
}
