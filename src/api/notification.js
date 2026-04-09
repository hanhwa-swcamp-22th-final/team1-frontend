import instance from './instance.js'

/**
 * 현재 로그인 사용자의 알림 목록 조회
 */
export function getNotifications(params = {}) {
  return instance.get('/notifications', { params })
}

export function markNotificationRead(notificationId) {
  return instance.patch(`/notifications/${notificationId}/read`)
}

export function markAllNotificationsRead() {
  return instance.patch('/notifications/read-all')
}

export function getUnreadNotificationCount() {
  return instance.get('/notifications/unread-count')
}
