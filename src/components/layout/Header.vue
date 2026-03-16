<script setup>
/**
 * Header — 인증된 화면의 상단 고정 헤더
 *
 * 1920×1080 기준:
 *   높이  : 108px  (--header-height)
 *   너비  : calc(100vw - 250px) = 1670px  (사이드바 250px 제외)
 *
 * Props:
 *   title      : string                — 페이지 제목 (h1)
 *   breadcrumb : Array<{ label, to? }> — 브레드크럼. to 없으면 일반 텍스트
 *
 * Slots:
 *   action — 우측 커스텀 액션 버튼 영역
 *            예: <template #action><button class="btn-gold">등록</button></template>
 *
 * 알림 패널 닫힘 처리:
 *   v-click-outside directive는 전역 등록이 없어 동작하지 않으므로
 *   @click.stop(내부 클릭 버블링 차단) + document 클릭 리스너 패턴으로 대체.
 *   - .notif-wrap @click.stop  → 내부 클릭이 document까지 전파되지 않음
 *   - watch(showNotifPanel)    → 패널 열릴 때 document 리스너 등록, 닫힐 때 해제
 *   - onUnmounted              → 컴포넌트 제거 시 리스너 정리(메모리 누수 방지)
 */
import { onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { useUiStore } from '@/stores/ui'
import { ROUTE_NAMES } from '@/constants'

defineProps({
  title: { type: String, default: '' },
  breadcrumb: { type: Array, default: () => [] },
})

const router = useRouter()
const auth = useAuthStore()
const notif = useNotificationStore()
const ui = useUiStore()
const showNotifPanel = ref(false)

/** 패널 외부 클릭 시 닫힘 처리 */
function onDocClick() {
  showNotifPanel.value = false
}

/**
 * showNotifPanel 변화 감지:
 *   true  → document 클릭 리스너 등록 (외부 클릭 감지용)
 *   false → 리스너 해제
 */
watch(showNotifPanel, (val) => {
  if (val) {
    document.addEventListener('click', onDocClick)
  } else {
    document.removeEventListener('click', onDocClick)
  }
})

/** 컴포넌트 언마운트 시 리스너 정리 (메모리 누수 방지) */
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})

async function logout() {
  auth.clearAuth()
  await router.replace({ name: ROUTE_NAMES.LOGIN })
}
</script>

<template>
  <header class="app-header">
    <!-- 좌측: 타이틀 + 브레드크럼 -->
    <div class="header-left">
      <h1 class="page-title">{{ title }}</h1>
      <nav v-if="breadcrumb.length" aria-label="breadcrumb" class="breadcrumb">
        <template v-for="(crumb, i) in breadcrumb" :key="i">
          <span v-if="i > 0" class="breadcrumb-sep">/</span>
          <RouterLink v-if="crumb.to" :to="crumb.to" class="crumb-link">{{
            crumb.label
          }}</RouterLink>
          <span v-else aria-current="page" class="crumb-current">{{ crumb.label }}</span>
        </template>
      </nav>
    </div>

    <!-- 우측: 액션 슬롯 + 알림 + 로그아웃 -->
    <div class="header-right">
      <!-- 사용자 지정 액션 버튼 (슬롯) -->
      <slot name="action" />

      <!--
        알림 벨 + 드롭다운 패널
        @click.stop: 이 div 내부의 클릭이 document까지 버블링되지 않도록 차단.
        document.addEventListener('click', onDocClick)와 쌍으로 동작하여
        패널 외부 클릭 시 패널을 닫음.
      -->
      <div class="notif-wrap" @click.stop>
        <button aria-label="알림" class="icon-btn" @click="showNotifPanel = !showNotifPanel">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M10 2a6 6 0 0 0-6 6v3.17L2.5 13H17.5l-1.5-1.83V8a6 6 0 0 0-6-6zm0 16a2 2 0 0 0 2-2H8a2 2 0 0 0 2 2z"
            />
          </svg>
          <!-- 미읽음 개수 배지: 99개 초과 시 "99+" 표시 -->
          <span v-if="notif.unreadCount > 0" class="badge">
            {{ notif.unreadCount > 99 ? '99+' : notif.unreadCount }}
          </span>
        </button>

        <!-- 알림 드롭다운 패널 (transitions.css: name="dropdown") -->
        <Transition name="dropdown">
          <div v-if="showNotifPanel" class="notif-panel">
            <div class="notif-header">
              <span class="notif-title">알림</span>
              <button class="notif-all-read" @click="notif.markAllAsRead()">모두 읽음</button>
            </div>
            <div class="notif-body">
              <div v-if="!notif.notifications.length" class="notif-empty">새 알림이 없습니다</div>
              <!-- 최대 20개만 표시 (성능 고려) -->
              <div
                v-for="item in notif.notifications.slice(0, 20)"
                :key="item.id"
                :class="{ unread: !item.read }"
                class="notif-item"
                @click="notif.markAsRead(item.id)"
              >
                <span v-if="!item.read" class="notif-dot" />
                <p class="notif-msg">{{ item.message }}</p>
                <span class="notif-time">{{ item.time }}</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 로그아웃 -->
      <button class="icon-btn logout-btn" title="로그아웃" @click="logout">
        <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 20 20">
          <path
            d="M13 3h4v14h-4M9 14l4-4-4-4M13 10H3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: var(--header-height); /* 108px */
  position: fixed;
  top: 0;
  left: var(--sidebar-width); /* 250px */
  right: 0;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--header-px);
  z-index: var(--z-header);
  box-shadow: var(--shadow-sm);
}

/* ── 좌측 ────────────────────────────────────────── */
.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-family: var(--font-condensed);
  font-size: clamp(18px, 1.146vw, 22px);
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--t1);
  line-height: 1;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-barlow);
  font-size: var(--font-size-xs);
}
.breadcrumb-sep {
  color: var(--t4);
}
.crumb-link {
  color: var(--blue);
  text-decoration: none;
}
.crumb-link:hover {
  text-decoration: underline;
}
.crumb-current {
  color: var(--t3);
}

/* ── 우측 ────────────────────────────────────────── */
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: clamp(34px, 2.083vw, 40px);
  height: clamp(34px, 2.083vw, 40px);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--t3);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all var(--ease-fast);
}
.icon-btn:hover {
  background: var(--surface-2);
  color: var(--t1);
}
.icon-btn svg {
  width: clamp(15px, 0.938vw, 18px);
  height: clamp(15px, 0.938vw, 18px);
}

.badge {
  position: absolute;
  top: 5px;
  right: 5px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--radius-full);
  background: var(--red);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* ── 알림 패널 ───────────────────────────────────── */
.notif-wrap {
  position: relative;
}

.notif-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: clamp(280px, 20vw, 380px);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
  overflow: hidden;
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}
.notif-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--t1);
}
.notif-all-read {
  font-size: var(--font-size-xs);
  color: var(--blue);
  background: none;
  border: none;
  cursor: pointer;
}

.notif-body {
  max-height: clamp(240px, 33.3vh, 420px);
  overflow-y: auto;
}

.notif-empty {
  padding: 32px 16px;
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--t4);
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background var(--ease-fast);
}
.notif-item:last-child {
  border-bottom: none;
}
.notif-item:hover {
  background: var(--surface-2);
}
.notif-item.unread {
  background: var(--blue-pale);
}

.notif-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--blue);
  flex-shrink: 0;
  margin-top: 5px;
}
.notif-msg {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--t2);
  line-height: 1.4;
}
.notif-time {
  font-size: var(--font-size-xs);
  color: var(--t4);
  flex-shrink: 0;
}

/* 로그아웃 버튼 강조 */
.logout-btn {
  margin-left: 4px;
}
.logout-btn:hover {
  color: var(--red);
  background: var(--red-pale);
}
</style>
