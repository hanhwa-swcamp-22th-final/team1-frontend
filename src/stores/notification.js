/**
 * stores/notification.js — 헤더 알림 드롭다운 전용 스토어
 *
 * 인증 토큰 사용 방식:
 *   - 알림 API와 SSE는 모두 Authorization 헤더의 access token이 필요하다.
 *   - access token은 localStorage가 아니라 Pinia 메모리 auth.token에서 읽는다.
 *   - 새로고침 직후에는 main.js의 bootstrapAuth()가 refresh cookie로 세션을
 *     먼저 복구한 뒤 앱을 마운트하므로, initialize() 시점에는 최신 토큰이 들어있다.
 */
import { EventSourcePolyfill } from 'event-source-polyfill'
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notification'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import pinia from '@/pinia'
import { useAuthStore } from '@/stores/auth'

const DEFAULT_PAGE_SIZE = 20

function readAccessToken() {
  const auth = useAuthStore(pinia)
  return auth.token ?? null
}

function buildNotificationSseUrl() {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
  const prefix = (import.meta.env.VITE_API_PREFIX ?? '').replace(/\/$/, '')
  return `${baseUrl}${prefix}/notifications/sse/subscribe`
}

function formatTimeLabel(createdAt) {
  if (!createdAt) return '-'

  const target = new Date(createdAt)
  if (Number.isNaN(target.getTime())) return '-'

  const diffMs = Date.now() - target.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) return '방금'
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}분 전`
  if (diffMs < day) return `${Math.max(1, Math.floor(diffMs / hour))}시간 전`
  if (diffMs < 7 * day) return `${Math.max(1, Math.floor(diffMs / day))}일 전`

  return target.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function normalizeNotification(raw = {}) {
  const title = raw.title ?? ''
  const body = raw.message ?? ''
  const displayMessage = [title, body].filter(Boolean).join(' - ') || title || body || '-'

  return {
    notificationId: raw.notificationId,
    type: raw.type ?? '-',
    title,
    message: displayMessage,
    body,
    isRead: Boolean(raw.isRead),
    createdAt: raw.createdAt ?? null,
    timeLabel: formatTimeLabel(raw.createdAt),
  }
}

function dedupeNotifications(items = []) {
  const seen = new Set()
  return items.filter((item) => {
    if (!item.notificationId || seen.has(item.notificationId)) return false
    seen.add(item.notificationId)
    return true
  })
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  const unreadCount = ref(0)
  const isInitialized = ref(false)
  const isLoading = ref(false)

  let eventSource = null
  let initializePromise = null

  async function fetchNotifications() {
    const response = await getNotifications({
      page: 0,
      size: DEFAULT_PAGE_SIZE,
      sort: 'createdAt,desc',
    })
    const items = Array.isArray(response.data) ? response.data : []
    notifications.value = dedupeNotifications(items.map(normalizeNotification)).slice(0, DEFAULT_PAGE_SIZE)
  }

  async function fetchUnreadCount() {
    const response = await getUnreadNotificationCount()
    unreadCount.value = Number(response.data ?? 0)
  }

  function upsertNotification(raw) {
    const normalized = normalizeNotification(raw)
    if (!normalized.notificationId) return

    const others = notifications.value.filter(
      (item) => item.notificationId !== normalized.notificationId,
    )

    notifications.value = [normalized, ...others].slice(0, DEFAULT_PAGE_SIZE)
  }

  function connectSse() {
    const token = readAccessToken()
    if (!token || eventSource) return

    // SSE는 브라우저 기본 EventSource 헤더 주입이 제한적이어서 polyfill을 사용한다.
    // 여기서도 현재 메모리 토큰을 Authorization 헤더로 직접 넣는다.
    eventSource = new EventSourcePolyfill(buildNotificationSseUrl(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    eventSource.addEventListener('notification', (event) => {
      try {
        const payload = JSON.parse(event.data)
        upsertNotification(payload)
        unreadCount.value = Number(payload.unreadCount ?? unreadCount.value)
      } catch (error) {
        console.error('[notification] SSE payload parse error:', error)
      }
    })

    eventSource.addEventListener('error', (error) => {
      console.error('[notification] SSE connection error:', error)
    })
  }

  async function initialize() {
    if (isInitialized.value) return
    if (initializePromise) return initializePromise
    if (!readAccessToken()) return

    isLoading.value = true
    initializePromise = Promise.all([fetchNotifications(), fetchUnreadCount()])
      .then(() => {
        connectSse()
        isInitialized.value = true
      })
      .finally(() => {
        isLoading.value = false
        initializePromise = null
      })

    return initializePromise
  }

  async function markAsRead(notificationId) {
    const target = notifications.value.find((item) => item.notificationId === notificationId)
    if (!target || target.isRead) return

    await markNotificationRead(notificationId)

    notifications.value = notifications.value.map((item) => (
      item.notificationId === notificationId ? { ...item, isRead: true } : item
    ))
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }

  async function markAllAsRead() {
    await markAllNotificationsRead()
    notifications.value = notifications.value.map((item) => ({ ...item, isRead: true }))
    unreadCount.value = 0
  }

  function clear() {
    eventSource?.close()
    eventSource = null
    notifications.value = []
    unreadCount.value = 0
    isInitialized.value = false
    isLoading.value = false
    initializePromise = null
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    initialize,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clear,
  }
})
