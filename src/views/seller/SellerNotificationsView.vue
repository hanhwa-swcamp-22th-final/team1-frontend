<script setup>
/**
 * 셀러 알림 화면.
 * 안읽음 필터와 전체 읽음 처리, 더 보기 흐름을 로컬 mock 데이터로 먼저 구성한다.
 */
import { computed, ref, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  countNotificationsByFilter,
  countUnreadNotifications,
  filterSellerNotifications,
  getSellerNotificationTypeMeta,
  markAllNotificationsRead,
  SELLER_NOTIFICATION_FILTER_OPTIONS,
  SELLER_NOTIFICATION_ROWS,
} from '@/utils/notifications.utils.js'

const breadcrumb = [{ label: 'Seller' }, { label: '알림' }]

// TODO(frontend): 알림 store 또는 API와 연결해 실제 읽음 상태를 반영한다.
// 알림은 로컬 mock 데이터를 복사해 읽음 상태를 이 화면 안에서만 바꾼다.
const notifications = ref(SELLER_NOTIFICATION_ROWS.map((item) => ({ ...item })))
const activeFilter = ref('all')
const feedbackMessage = ref('')
const visibleCount = ref(5)

watch(activeFilter, () => {
  visibleCount.value = 5
  feedbackMessage.value = ''
})

const filterOptions = computed(() => {
  return SELLER_NOTIFICATION_FILTER_OPTIONS.map((option) => ({
    ...option,
    count: countNotificationsByFilter(notifications.value, option.key),
  }))
})

const unreadCount = computed(() => countUnreadNotifications(notifications.value))

const filteredRows = computed(() => {
  return filterSellerNotifications(notifications.value, {
    filter: activeFilter.value,
  })
})

const visibleRows = computed(() => filteredRows.value.slice(0, visibleCount.value))

function handleMarkAllRead() {
  notifications.value = markAllNotificationsRead(notifications.value)
  feedbackMessage.value = '전체 알림을 읽음 처리했습니다.'
}

function handleNotificationClick(id) {
  notifications.value = notifications.value.map((item) => {
    if (item.id !== id || item.read) return item
    return { ...item, read: true }
  })
}

function handleLoadMore() {
  if (visibleCount.value >= filteredRows.value.length) {
    feedbackMessage.value = '더 표시할 알림이 없습니다.'
    return
  }

  visibleCount.value += 5
}
</script>

<template>
  <AppLayout title="알림" :breadcrumb="breadcrumb">
    <section class="seller-notifications-page">
      <section class="list-card">
        <div class="toolbar">
          <div class="filter-group">
            <button
              v-for="option in filterOptions"
              :key="option.key"
              type="button"
              class="filter-badge"
              :class="{ 'filter-badge--active': activeFilter === option.key }"
              @click="activeFilter = option.key"
            >
              <span>{{ option.label }}</span>
              <strong>{{ option.count }}</strong>
            </button>
          </div>

          <button class="ui-btn ui-btn--ghost" type="button" @click="handleMarkAllRead">
            전체 읽음 처리
          </button>
        </div>

        <div class="summary-strip">
          <span class="summary-text">안읽음 {{ unreadCount }}건</span>
          <span class="summary-text">최근 7일 알림 흐름을 먼저 확인합니다.</span>
        </div>

        <p v-if="feedbackMessage" class="toolbar-message">{{ feedbackMessage }}</p>

        <div class="notification-list">
          <button
            v-for="item in visibleRows"
            :key="item.id"
            type="button"
            class="notification-item"
            :class="{ 'notification-item--unread': !item.read }"
            @click="handleNotificationClick(item.id)"
          >
            <div
              class="notification-icon"
              :class="`notification-icon--${getSellerNotificationTypeMeta(item.type).tone}`"
            >
              {{ getSellerNotificationTypeMeta(item.type).icon }}
            </div>

            <div class="notification-content">
              <div class="notification-top">
                <div class="notification-title-wrap">
                  <span
                    class="notification-type"
                    :class="`notification-type--${getSellerNotificationTypeMeta(item.type).tone}`"
                  >
                    {{ getSellerNotificationTypeMeta(item.type).label }}
                  </span>
                  <strong class="notification-title">{{ item.title }}</strong>
                  <span v-if="!item.read" class="notification-new">NEW</span>
                </div>
                <span class="notification-time">{{ item.timeLabel }}</span>
              </div>

              <p class="notification-body">{{ item.body }}</p>
            </div>
          </button>
        </div>

        <div class="list-footer">
          <span class="footer-text">전체 {{ filteredRows.length }}건 · 최근 7일</span>

          <button class="ui-btn ui-btn--ghost" type="button" @click="handleLoadMore">
            더 보기
          </button>
        </div>
      </section>
    </section>
  </AppLayout>
</template>

<style scoped>
.seller-notifications-page {
  display: flex;
  flex-direction: column;
}

.list-card {
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.toolbar,
.filter-group,
.summary-strip,
.notification-top,
.list-footer {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  align-items: center;
}

.toolbar {
  margin-bottom: var(--space-4);
}

.filter-group {
  flex-wrap: wrap;
  justify-content: flex-start;
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--t3);
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;
}

.filter-badge--active {
  border-color: var(--gold);
  background: var(--gold-pale);
  color: var(--t1);
}

.summary-strip {
  margin-bottom: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--surface-2);
}

.summary-text {
  color: var(--t2);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.toolbar-message {
  margin: 0 0 var(--space-4);
  color: var(--blue);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  width: 100%;
  padding: var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  cursor: pointer;
  text-align: left;
}

.notification-item--unread {
  border-color: #f2c879;
  background: #fffaf0;
}

.notification-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  font-family: var(--font-condensed);
  font-size: 22px;
  font-weight: 700;
  flex-shrink: 0;
}

.notification-icon--blue,
.notification-type--blue {
  background: var(--blue-pale);
  color: var(--blue);
}

.notification-icon--amber,
.notification-type--amber {
  background: var(--amber-pale);
  color: #b45309;
}

.notification-icon--green,
.notification-type--green {
  background: var(--green-pale);
  color: var(--green);
}

.notification-icon--red,
.notification-type--red {
  background: var(--red-pale);
  color: var(--red);
}

.notification-icon--purple,
.notification-type--purple {
  background: var(--purple-pale);
  color: var(--purple);
}

.notification-icon--default,
.notification-type--default {
  background: var(--surface-2);
  color: var(--t3);
}

.notification-content {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-2);
}

.notification-top {
  align-items: flex-start;
}

.notification-title-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.notification-type {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.notification-title {
  color: var(--t1);
  font-size: var(--font-size-md);
}

.notification-new {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: var(--radius-full);
  background: var(--gold);
  color: var(--t1);
  font-size: var(--font-size-xs);
  font-weight: 800;
}

.notification-body,
.notification-time,
.footer-text {
  margin: 0;
  color: var(--t3);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.list-footer {
  margin-top: var(--space-4);
}

@media (max-width: 1100px) {
  .toolbar,
  .summary-strip,
  .notification-top,
  .list-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
