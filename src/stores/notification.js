/**
 * stores/notification.js — 인앱 알림 상태 스토어 (persist 없음)
 *
 * notifications 배열 아이템 형태:
 *   {
 *     id:      number | string,   // 고유 식별자
 *     message: string,             // 알림 메시지
 *     time:    string,             // 표시용 시간 문자열 (예: "10분 전")
 *     read:    boolean             // 읽음 여부
 *   }
 *
 * persist 미적용 이유:
 *   알림은 로그인 후 서버에서 받아오는 실시간 데이터.
 *   새로고침 시 다시 fetch하는 것이 맞음.
 *
 * fetchNotifications 구현 방법 (팀원 TODO):
 *   1. src/api/notification.js 에 getNotifications() 함수 구현
 *   2. 아래 TODO 주석 위치에 코드 추가:
 *      import { getNotifications } from '@/api/notification.js'
 *      const res = await getNotifications()
 *      notifications.value = res.data
 *   3. Header.vue 마운트 시 또는 로그인 후 fetchNotifications() 호출
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  /** 알림 목록. 위 아이템 형태 참조 */
  const notifications = ref([])

  /** 미읽음 개수 (Header.vue 배지에 표시) */
  const unreadCount = computed(
    () => notifications.value.filter((n) => !n.read).length
  )

  /**
   * 서버에서 알림 목록 로드
   * TODO: api/notification.js 연동 후 구현
   * 구현 후 로그인 성공 시 또는 헤더 마운트 시 호출할 것
   */
  async function fetchNotifications() {
    // TODO: 아래 주석 해제 후 사용
    // import { getNotifications } from '@/api/notification.js'
    // const res = await getNotifications()
    // notifications.value = res.data
  }

  /**
   * 특정 알림 읽음 처리
   * Header.vue에서 알림 아이템 클릭 시 호출
   * @param {number|string} id
   */
  function markAsRead(id) {
    const item = notifications.value.find((n) => n.id === id)
    if (item) item.read = true
  }

  /**
   * 전체 읽음 처리
   * Header.vue의 "모두 읽음" 버튼 클릭 시 호출
   */
  function markAllAsRead() {
    notifications.value.forEach((n) => (n.read = true))
  }

  return { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }
})
