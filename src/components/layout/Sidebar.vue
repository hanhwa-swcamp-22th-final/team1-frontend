<script setup>
/**
 * Sidebar — 좌측 고정 사이드바
 *
 * 1920×1080 기준 영역 분할:
 *   ① 로고 영역  : 108px  (--sidebar-logo-h)    ← 헤더와 동일 높이 (수평 정렬)
 *   ② 유저 프로필: 146px  (--sidebar-profile-h)
 *   ③ 네비게이션 : flex:1 (~827px @ 1080px)     ← 나머지 공간 자동 채움 (푸터 제거로 확장)
 *
 * initials 계산 로직:
 *   auth.user.name의 앞 2글자를 대문자로 → 'CK' fallback (이름 없을 때)
 *   예: '홍길동' → 'HG', 'John Doe' → 'JO'
 *
 * menuGroups 구조 (팀원 TODO):
 *   현재: 빈 배열 반환 → '메뉴 구성 중' 안내 표시
 *   팀원이 라우트 파일 작성 후 아래 두 가지 방법 중 선택:
 *   방법 A: router.getRoutes()에서 meta.sidebar 정보 수집 (권장)
 *   방법 B: Role별 하드코딩 배열 (간단하지만 라우트와 이중관리)
 *
 *   menuGroups 아이템 형태:
 *   [
 *     {
 *       label: '주문 관리',  // 그룹 제목
 *       items: [
 *         { name: 'seller-order-list', label: '주문 목록', icon: '📦' },
 *         { name: 'seller-order-register', label: '주문 등록', icon: '➕' },
 *       ]
 *     }
 *   ]
 *
 * v-click-outside:
 *   이 컴포넌트에서는 사용하지 않음. Sidebar는 토글 버튼으로만 닫힘.
 *   (Header.vue의 알림 패널은 @click.stop + document listener 패턴 사용)
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROLES, ROUTE_NAMES } from '@/constants'
import { MENU_BY_ROLE } from '@/components/layout/menus'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const navRef = ref(null)
const SIDEBAR_SCROLL_STORAGE_PREFIX = 'sidebar-nav-scroll'

function routeExists(name) {
  try {
    return !!router.resolve({ name }).name
  } catch {
    return false
  }
}
const DEV_COMPONENTS_ROUTE_NAME = 'dev-components'
const DEV_MENU_GROUPS = [
  {
    label: 'Common',
    items: [{ name: DEV_COMPONENTS_ROUTE_NAME, label: 'Component Demo', icon: 'C' }],
  },
  {
    label: 'Auth',
    items: [
      { name: ROUTE_NAMES.LOGIN, label: 'Login', icon: 'L' },
      { name: ROUTE_NAMES.CHANGE_PASSWORD, label: 'Change Password', icon: 'P' },
    ],
  },
  {
    label: 'Errors',
    items: [
      { name: ROUTE_NAMES.FORBIDDEN, label: 'Forbidden', icon: '4' },
      { name: ROUTE_NAMES.NOT_FOUND, label: 'Not Found', icon: 'N' },
    ],
  },
]
const ROLE_INITIALS = {
  [ROLES.SYSTEM_ADMIN]: 'SA',
  [ROLES.MASTER_ADMIN]: 'MA',
  [ROLES.WH_MANAGER]: 'WM',
  [ROLES.WH_WORKER]: 'WW',
  [ROLES.SELLER]: 'SR',
}

const ROLE_THEME_CLASS = {
  [ROLES.SYSTEM_ADMIN]: 'theme-system-admin',
  [ROLES.MASTER_ADMIN]: 'theme-master-admin',
  [ROLES.WH_MANAGER]: 'theme-wh-manager',
  [ROLES.WH_WORKER]: 'theme-wh-worker',
  [ROLES.SELLER]: 'theme-seller',
}

/**
 * 유저 이름의 앞 2글자 대문자 → 아바타 이니셜 표시
 * 이름이 없거나 빈 문자열이면 'CK' 기본값
 */
const initials = computed(() => ROLE_INITIALS[auth.role] ?? 'DV')
const roleThemeClass = computed(() => ROLE_THEME_CLASS[auth.role] ?? 'theme-system-admin')
const sidebarScrollStorageKey = computed(
  () => `${SIDEBAR_SCROLL_STORAGE_PREFIX}:${auth.role ?? 'guest'}`
)

/** Role 영문 라벨 (사이드바 role 배지 표시용) */
const roleLabel = computed(
  () =>
    ({
      [ROLES.SYSTEM_ADMIN]: 'System Admin',
      [ROLES.MASTER_ADMIN]: 'Master Admin',
      [ROLES.WH_MANAGER]: 'WH Manager',
      [ROLES.WH_WORKER]: 'WH Worker',
      [ROLES.SELLER]: 'Seller',
    })[auth.role] ??
    auth.role ??
    'Developer'
)

/**
 * 메뉴 그룹 — 역할별 메뉴는 components/layout/menus/ 에서 관리
 * 각 팀원은 자신의 역할 파일(menus/seller.js 등)만 수정하면 됨
 */
const menuGroups = computed(() => {
  if (route.name === DEV_COMPONENTS_ROUTE_NAME) return DEV_MENU_GROUPS
  return MENU_BY_ROLE[auth.role] ?? []
})

/**
 * 현재 라우트가 주어진 이름과 일치하는지 확인 (활성 메뉴 스타일)
 * @param {string} name — ROUTE_NAMES 값
 * @returns {boolean}
 */
function isActive(name) {
  return route.name === name || route.meta.activeMenu === name
}

function persistSidebarScroll() {
  if (!navRef.value) return
  try {
    sessionStorage.setItem(sidebarScrollStorageKey.value, String(navRef.value.scrollTop))
  } catch {
    // Ignore storage errors and keep navigation working.
  }
}

function restoreSidebarScroll() {
  if (!navRef.value) return
  try {
    const savedScrollTop = Number(sessionStorage.getItem(sidebarScrollStorageKey.value) ?? 0)
    navRef.value.scrollTop = Number.isFinite(savedScrollTop) ? savedScrollTop : 0
  } catch {
    navRef.value.scrollTop = 0
  }
}

onMounted(() => {
  nextTick(() => {
    restoreSidebarScroll()
  })
})

onBeforeUnmount(() => {
  persistSidebarScroll()
})
</script>

<template>
  <aside :class="['sidebar', roleThemeClass]">
    <!-- ① 로고 영역 (108px) — 헤더와 동일 높이로 맞춰 수평 정렬 -->
    <div class="sidebar-logo">
      <div class="logo-icon">CK</div>
      <div class="logo-text">
        <span class="logo-brand">CONK</span>
        <span class="logo-sub">Fulfillment Platform</span>
      </div>
    </div>

    <!-- ② 유저 프로필 (146px) — profile-top + profile-divider + profile-bottom -->
    <div class="sidebar-profile">
      <!-- profile-top: 아바타 + 이름/role/소속 -->
      <div class="profile-top">
        <div class="avatar">{{ initials }}</div>
        <div class="profile-info">
          <span class="profile-name">{{ auth.user?.name ?? '익명이름' }}</span>
          <span class="role-badge">{{ roleLabel }}</span>
          <span class="profile-company">{{ auth.user?.organization ?? '익명회사' }}</span>
        </div>
      </div>

      <!-- profile-divider: 1px 구분선 -->
      <div class="profile-divider" />

      <!-- profile-bottom: 이메일(좌) + 설정/로그아웃 버튼(우) -->
      <div class="profile-bottom">
        <span class="profile-email">{{ auth.user?.email ?? '익명@메일.임' }}</span>
        <div class="profile-actions">

        </div>
      </div>
    </div>

    <!-- ③ 네비게이션 (flex:1, 스크롤 가능) -->
    <nav
      ref="navRef"
      aria-label="메인 내비게이션"
      class="sidebar-nav"
      @scroll="persistSidebarScroll"
    >
      <template v-if="menuGroups.length">
        <div v-for="group in menuGroups" :key="group.label" class="nav-group">
          <!-- 그룹 제목 -->
          <p class="nav-group-label">{{ group.label }}</p>
          <RouterLink
            v-for="item in group.items"
            :key="item.name"
            :class="{ active: isActive(item.name) }"
            :to="{ name: item.name }"
            class="nav-item"
          >
            <span class="nav-icon">{{ item.icon ?? '○' }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </RouterLink>
        </div>
      </template>

      <!-- 메뉴 없을 때 개발 중 안내 (팀원이 menuGroups 구현 후 이 블록 삭제) -->
      <div v-else class="nav-empty">
        <span class="nav-empty-text">메뉴 구성 중</span>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
/* ── 전체 사이드바 ───────────────────────────────── */
.sidebar {
  --sidebar-role-main: var(--sidebar);
  --sidebar-role-lt: var(--sidebar-lt);
  --sidebar-role-bd: var(--sidebar-bd);
  --sidebar-role-dark: var(--sidebar);
  width: var(--sidebar-width); /* 250px */
  height: calc(100vh - var(--footer-height)); /* 푸터 위까지만 */
  position: fixed;
  left: 0;
  top: 0;
  background: var(--sidebar-role-main);
  display: flex;
  flex-direction: column;
  z-index: var(--z-sidebar);
  overflow: hidden;
}

.theme-system-admin {
  --sidebar-role-main: #5a4334;
  --sidebar-role-lt: #705442;
  --sidebar-role-bd: #9a7860;
  --sidebar-role-dark: #433124;
}

.theme-master-admin {
  --sidebar-role-main: #1e4673;
  --sidebar-role-lt: #2a5c92;
  --sidebar-role-bd: #4f7fb6;
  --sidebar-role-dark: #173557;
}

.theme-wh-manager {
  --sidebar-role-main: #1f5a61;
  --sidebar-role-lt: #2a727b;
  --sidebar-role-bd: #4b969f;
  --sidebar-role-dark: #174449;
}

.theme-wh-worker {
  --sidebar-role-main: #53643b;
  --sidebar-role-lt: #687c4b;
  --sidebar-role-bd: #8da46a;
  --sidebar-role-dark: #3f4c2c;
}

.theme-seller {
  --sidebar-role-main: #704056;
  --sidebar-role-lt: #8a4f6b;
  --sidebar-role-bd: #b27a96;
  --sidebar-role-dark: #543043;
}

/* ── ① 로고 (108px) ────────────────────────────── */
.sidebar-logo {
  height: var(--sidebar-logo-h); /* 108px */
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 var(--sidebar-px);
  background: var(--sidebar-role-dark);
  border-bottom: 1px solid var(--gold); /* 금색 구분선 */
}

.logo-icon {
  width: 41px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 0; /* 직각 배지 */
  background: var(--gold);
  color: #0d0d0d;
  font-family: var(--font-condensed);
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: -0.5px;
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.logo-brand {
  font-family: var(--font-condensed);
  font-size: 26px; /* 기존 16px → 26px */
  font-weight: 700;
  color: #fff;
  letter-spacing: 5px; /* 기존 1px → 5px */
  line-height: 1;
}

.logo-sub {
  font-family: var(--font-barlow);
  font-size: 9px;
  font-weight: 500;
  color: #fff; /* 기존 t4(회색) → 흰색 */
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* ── ② 유저 프로필 ───────────────────────────────── */
.sidebar-profile {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 16px var(--sidebar-px) 18px;
  background: var(--sidebar-role-lt); /* 강조 배경 */
  border-bottom: 1px solid var(--sidebar-role-bd);
  overflow: hidden;
}

/* profile-top: 아바타 + 이름/role/소속 */
.profile-top {
  display: flex;
  align-items: flex-start; /* 기존 center → flex-start */
  gap: 12px;
  margin-bottom: 12px; /* 기존 flex:1 → margin으로 */
}

.avatar {
  width: 50px;
  height: 44px; /* 기존 44×44 원형 → 50×44 직각형 */
  flex-shrink: 0;
  border-radius: 4px; /* 직각형 */
  background: rgba(0, 0, 0, 0.3); /* 반투명 어두운 배경 */
  border: 2px solid var(--gold); /* 금테두리 */
  color: var(--gold); /* 금색 이니셜 */
  font-family: var(--font-condensed);
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
  min-width: 0;
}

.profile-name {
  font-family: var(--font-condensed); /* Barlow Condensed */
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 2px; /* 기존 pill → 직각형 */
  background: rgba(245, 166, 35, 0.12);
  border: 1px solid rgba(245, 166, 35, 0.2); /* 테두리 추가 */
  color: var(--gold);
  font-family: var(--font-barlow);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 1px;
  width: fit-content;
}

.profile-company {
  font-family: var(--font-barlow);
  font-style: italic; /* 이탤릭 */
  font-weight: 600;
  font-size: 11px;
  color: #fff; /* 기존 t4 → 흰색 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* profile-divider: 구분선 */
.profile-divider {
  height: 1px;
  background: var(--sidebar-role-bd);
  margin-bottom: 10px; /* 기존 0 var(--sidebar-px) */
  flex-shrink: 0;
}

/* profile-bottom: 이메일 + 아이콘 버튼 */
.profile-bottom {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-email {
  font-family: var(--font-mono); /* IBM Plex Sans */
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7); /* 기존 t4 → 반투명 흰색 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1;
}

.profile-actions {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}

.profile-icon-btn {
  width: 24px;
  height: 24px; /* 기존 28px → 24px */
  border: 1px solid var(--sidebar-role-bd); /* 테두리 추가 */
  border-radius: 3px; /* 기존 radius-sm(4px) → 3px */
  background: rgba(0, 0, 0, 0.3); /* 기존 sidebar-lt → 반투명 검정 */
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--ease-fast);
}
.profile-icon-btn:hover {
  background: rgba(0, 0, 0, 0.5);
  color: var(--gold);
  border-color: rgba(245, 166, 35, 0.4);
}
.profile-icon-btn svg {
  width: 12px;
  height: 12px;
}

/* ── ③ 네비게이션 (flex:1) ──────────────────────── */
.sidebar-nav {
  flex: 1;
  overflow-y: auto; /* 메뉴가 많을 때 스크롤 (스크롤바는 main.css에서 커스텀) */
  overflow-x: hidden;
  padding: 8px 0;
}

.nav-group {
  margin-bottom: 4px;
}

.nav-group-label {
  padding: 16px 18px 4px;
  font-family: var(--font-barlow);
  font-size: 9px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.35); /* 기존 t4 → 더 은은한 흰색 */
  text-transform: uppercase;
  letter-spacing: 2.5px; /* 기존 0.08em → 2.5px */
  white-space: nowrap;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 1px 10px; /* 좌우 여백으로 rounded 효과 */
  padding: 10px;
  color: rgba(225, 224, 224, 0.9); /* 기존 rgba(255,255,255,0.65) → 더 밝게 */
  text-decoration: none;
  font-family: var(--font-barlow);
  font-size: 13px;
  font-weight: 400; /* 기존 500 → 400 */
  border-radius: 4px; /* 기존 0 → 둥근 모서리 */
  transition: background var(--ease-fast);
  white-space: nowrap;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05); /* 기존 sidebar-lt → 매우 은은 */
  color: rgba(225, 224, 224, 0.9);
  text-decoration: none;
}

.nav-item.active {
  background: rgba(245, 166, 35, 0.12); /* gold-dim */
  border-left: 3px solid var(--gold); /* 아이템 자체에 금색 좌측 선 */
  color: #fff;
}

.nav-item.active .nav-label {
  font-weight: 600;
  color: #fff;
}

.nav-icon {
  width: 15px;
  text-align: center;
  flex-shrink: 0;
  font-size: 15px;
  line-height: 1;
}
.nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
}
.nav-empty-text {
  font-size: var(--font-size-xs);
  color: var(--t4);
}
</style>
