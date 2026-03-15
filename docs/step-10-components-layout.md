# 레이아웃 컴포넌트 문서

> **한 줄 요약**: 인증된 화면의 전체 구조(사이드바 + 헤더 + 콘텐츠)를 담당하는 3개 레이아웃 컴포넌트.

## 목차 (Table of Contents)
- [파일 구조](#파일-구조)
- [전체 구조](#전체-구조)
- [AppLayout](#applayout)
- [Sidebar](#sidebar)
- [Header](#header)
- [사용 예제](#사용-예제)
- [주의사항](#주의사항)

---

## 파일 구조

```
src/components/layout/
├── AppLayout.vue   ← 인증된 화면 전체 레이아웃 래퍼
├── Sidebar.vue     ← 좌측 고정 사이드바 (로고, 프로필, 메뉴)
├── Header.vue      ← 상단 고정 헤더 (제목, 브레드크럼, 알림, 로그아웃)
└── Footer.vue      ← 하단 고정 푸터 (position fixed, left: sidebar-width)
```

---

## 전체 구조

### 화면 레이아웃 다이어그램

```
┌──────────────────────────────────────────────────────────────┐
│  Sidebar (fixed, left:0)    │  Header (fixed, left:250px)    │
│  width: 250px, height:100vh │  width:1670px, height:108px    │
├─────────────────────────────┼───────────────────────────────┤
│  ① 로고 (108px)             │  AppLayout > <RouterView>     │
│                             │  (margin-top: 108px)          │
│  ② 프로필 (146px)           │  (margin-left: 250px)         │
│     - profile-top           │  (padding-bottom: 133px)      │
│       · 아바타              │                               │
│       · 이름, role, org     │  Main Content Area            │
│     - profile-divider (1px) │                               │
│     - profile-bottom        │                               │
│       · 이메일              │                               │
│       · [⚙설정] [→로그아웃]│                               │
│                             │                               │
│  ③ nav (flex:1, ~826px)     │                               │
│     - 메뉴 그룹들           │                               │
│     - 동적 렌더링           │                               │
└─────────────────────────────┴───────────────────────────────┘
│  Footer (fixed, bottom:0, left:250px, right:0, h:105px)      │
│  CONK ● © 2026 ...   [이용약관] [개인정보] [고객센터] v0.1.0 │
└─────────────────────────────────────────────────────────────┘
```

### CSS 변수 (1920×1080 기준)

```css
:root {
  --sidebar-width: 250px;            /* 사이드바 너비 */
  --sidebar-collapsed-width: 64px;   /* 사이드바 접혔을 때 너비 */
  --header-height: 108px;            /* 헤더 높이 */
  --footer-height: 105px;            /* 사이드바 푸터 높이 */
  --sidebar-logo-h: 108px;           /* 로고 영역 높이 */
  --sidebar-profile-h: 146px;        /* 프로필 영역 높이 */
}
```

### 사이드바 접힘 상태 (Collapsed)

```
접혀있을 때 (width: 64px):
├── 로고 (중앙 정렬, 64px)
├── 프로필 (아바타만 표시, 텍스트/divider/bottom 숨김)
└── nav (아이콘만, 텍스트 fade)

펼쳐있을 때 (width: 250px):
├── 로고 (아이콘 + 브랜드명 + 서브텍스트)
├── 프로필 (profile-top + divider + profile-bottom 모두 표시)
└── nav (아이콘 + 라벨)
```

---

## AppLayout

인증된 화면의 최상위 래퍼. Sidebar + Header + 콘텐츠 영역을 관리합니다.

### Props

| Prop | 타입 | 필수 | 설명 |
|---|---|---|---|
| `title` | `string` | | 헤더에 표시될 페이지 제목 |
| `breadcrumb` | `Breadcrumb[]` | | 브레드크럼 경로 배열 |

### Breadcrumb 타입 정의

```ts
type Breadcrumb = {
  label: string              // 텍스트
  to?: string | RouteLocation  // (선택) 링크 대상
}
```

### Slots

| 슬롯 | props | 설명 |
|---|---|---|
| `default` | — | 페이지 본문 콘텐츠 |
| `header-action` | — | 헤더 우측 커스텀 버튼 영역 |

### 구조

```vue
<AppLayout :title="..." :breadcrumb="...">
  <!-- Sidebar 자동 마운트 -->
  <!-- Header 자동 마운트 -->

  <!-- 페이지 본문 (슬롯) -->
  <div class="app-content">
    <slot />  <!-- 실제 페이지 콘텐츠 -->
  </div>
</AppLayout>
```

### 기본 사용 예

```vue
<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'

const title = '주문 목록'
const breadcrumb = [
  { label: '홈', to: '/seller/dashboard' },
  { label: '주문 관리', to: '/seller/orders' },
  { label: '주문 목록' }  // to 없으면 링크 아님 (현재 페이지)
]

const orders = ref([])

onMounted(async () => {
  const response = await api.getOrders()
  orders.value = response.data
})
</script>

<template>
  <AppLayout :title="title" :breadcrumb="breadcrumb">
    <BaseTable
      :columns="[
        { key: 'id', label: 'ID' },
        { key: 'customerName', label: '고객명' },
        { key: 'status', label: '상태' },
      ]"
      :rows="orders"
    />
  </AppLayout>
</template>
```

### header-action 슬롯 (우측 버튼)

```vue
<template>
  <AppLayout title="주문 목록" :breadcrumb="breadcrumb">
    <template #header-action>
      <!-- 헤더 우측에 표시될 버튼들 -->
      <button @click="handleRegister">주문 등록</button>
      <button @click="handleExport">내보내기</button>
    </template>

    <!-- 페이지 본문 -->
    <BaseTable :columns="cols" :rows="rows" />
  </AppLayout>
</template>
```

### 제목 없이 사용

```vue
<template>
  <!-- title prop 생략 시 헤더 제목 영역 최소화 -->
  <AppLayout :breadcrumb="breadcrumb">
    <BaseTable :columns="cols" :rows="rows" />
  </AppLayout>
</template>
```

---

## Sidebar

좌측 고정 사이드바. AppLayout 내에서 자동으로 마운트되므로 직접 사용하지 않습니다.

### 구성 요소

#### 1. 로고 영역 (108px)

```
┌──────────────────┐
│  [CONK] 아이콘   │  ← 고정, 브랜드 로고
└──────────────────┘
```

#### 2. 프로필 영역 (146px) — 2섹션 구조

```
┌─────────────────────────────────────┐
│ [아바타] | 이름                      │  ← profile-top
│          | MASTER ADMIN (role-badge) │
│          | GLSM Logistics            │
├─────────────────────────────────────┤  ← profile-divider (1px 구분선)
│ admin@glsm.com  | [⚙] [→]          │  ← profile-bottom
└─────────────────────────────────────┘
```

#### 3. 메뉴 영역 (flex:1)

```
┌──────────────────┐
│ 📦 주문 관리     │
│   ├─ 📋 주문목록 │
│   └─ ➕ 주문등록 │
│                  │
│ 📊 재고 관리     │
│   ├─ 📈 재고현황 │
│   └─ ✏️ 수정    │
│                  │
│ (더 많은 메뉴)   │
└──────────────────┘
```

#### 4. 푸터 영역 (105px)

```
┌──────────────────┐
│  TENANT-001      │
│  SELLER Role     │
│  ⚙️  설정        │
│  🚪 로그아웃     │
└──────────────────┘
```

### 동적 메뉴 구성 (menuGroups)

Sidebar.vue의 `menuGroups` computed 속성에서 라우터의 `meta.sidebar` 정보를 기반으로 메뉴를 동적으로 생성합니다.

#### 구현 방식 (팀원 TODO)

```js
// src/components/layout/Sidebar.vue
const menuGroups = computed(() => {
  // 1. router.getRoutes()에서 모든 라우트 조회
  const routes = router.getRoutes()

  // 2. 로그인 사용자의 Role과 일치하는 라우트만 필터링
  const userRoutes = routes.filter(
    route => route.meta?.role === auth.role
  )

  // 3. meta.sidebar 정보를 기반으로 그룹화
  const grouped = {}
  userRoutes.forEach(route => {
    const sidebar = route.meta?.sidebar
    if (!sidebar) return

    if (!grouped[sidebar.group]) {
      grouped[sidebar.group] = []
    }
    grouped[sidebar.group].push({
      name: route.name,
      label: sidebar.label,
      icon: sidebar.icon,
    })
  })

  // 4. 반환 형식
  return Object.entries(grouped).map(([group, items]) => ({
    label: group,
    items
  }))
})
```

#### 예상 결과 (SELLER)

```js
[
  {
    label: '대시보드',
    items: [
      { name: 'seller-dashboard', label: '홈', icon: '🏠' }
    ]
  },
  {
    label: '주문 관리',
    items: [
      { name: 'seller-order-list', label: '주문 목록', icon: '📦' },
      { name: 'seller-order-register', label: '주문 등록', icon: '➕' }
    ]
  },
]
```

### 라우트에 meta.sidebar 설정 (예)

```js
// src/router/routes/seller.js
export default [
  {
    path: '/seller/dashboard',
    name: ROUTE_NAMES.SELLER_DASHBOARD,
    component: () => import('@/views/seller/DashboardView.vue'),
    meta: {
      role: ROLES.SELLER,
      sidebar: {
        group: '대시보드',
        label: '홈',
        icon: '🏠',
      }
    }
  },
  {
    path: '/seller/orders',
    name: ROUTE_NAMES.SELLER_ORDER_LIST,
    component: () => import('@/views/seller/OrderListView.vue'),
    meta: {
      role: ROLES.SELLER,
      sidebar: {
        group: '주문 관리',
        label: '주문 목록',
        icon: '📦',
      }
    }
  },
]
```

### 사이드바 접힘/펼침 (Collapsed)

ui.js의 `isSidebarOpen` 상태로 제어합니다.

```vue
<!-- Sidebar 헤더의 토글 버튼 -->
<button @click="ui.toggleSidebar()">
  {{ ui.isSidebarOpen ? '◀' : '▶' }}
</button>
```

**접혀있을 때**:
- 너비: 64px
- 텍스트 숨김 (`opacity: 0`)
- 아이콘만 표시

**펼쳐있을 때**:
- 너비: 250px
- 아이콘 + 텍스트 모두 표시

---

## Header

상단 고정 헤더. AppLayout 내에서 자동으로 마운트됩니다.

### 구성 요소

```
┌────────────────────────────────────────────────────────────┐
│  [🏠 홈 > 주문 관리 > 주문 목록]  │  [내보내기] [알림] [👤] │
│                                │                         │
│  ← 브레드크럼                   │  ← header-action 슬롯   │
└────────────────────────────────────────────────────────────┘
```

### 1. 브레드크럼 (좌측)

```vue
<AppLayout :title="..." :breadcrumb="[
  { label: '홈', to: '/' },
  { label: '주문 관리' },
  { label: '주문 목록' }
]">
  <!-- 렌더링 결과:
       [🏠] 홈 > [주문 관리] > 주문 목록
  -->
</AppLayout>
```

### 2. 알림 패널 (우측)

헤더의 알림 아이콘 클릭 시:
- 패널 표시/숨김 토글
- 패널 외부 클릭 시 자동 닫힘
- 미읽음 배지 표시

```vue
<!-- Header의 알림 영역 -->
<div class="header-notifications">
  <button @click="showNotifPanel = !showNotifPanel">
    🔔
    <span v-if="notif.unreadCount > 0" class="badge">
      {{ notif.unreadCount }}
    </span>
  </button>

  <!-- 알림 패널 -->
  <div v-if="showNotifPanel" class="notification-panel">
    <div v-for="n in notif.notifications" :key="n.id">
      {{ n.message }}
    </div>
  </div>
</div>
```

### 3. 프로필 메뉴 (우측)

헤더의 프로필 아이콘 클릭 시:
- 드롭다운 메뉴 표시
- 설정, 로그아웃 등

```vue
<div class="header-profile">
  <button @click="showProfileMenu = !showProfileMenu">
    {{ auth.user?.name }}
  </button>

  <div v-if="showProfileMenu" class="profile-menu">
    <a href="/settings">설정</a>
    <button @click="handleLogout">로그아웃</button>
  </div>
</div>
```

---

## 사용 예제

### 전형적인 리스트 화면

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import { ROUTE_NAMES } from '@/constants'

const router = useRouter()

const currentPage = ref(1)
const orders = ref([])
const total = ref(0)
const isLoading = ref(false)

const breadcrumb = [
  { label: '홈', to: { name: ROUTE_NAMES.SELLER_DASHBOARD } },
  { label: '주문 관리', to: { name: ROUTE_NAMES.SELLER_ORDER_LIST } },
  { label: '주문 목록' }
]

const columns = [
  { key: 'id', label: 'ID', width: '100px' },
  { key: 'customerName', label: '고객명', sortable: true },
  { key: 'quantity', label: '수량', width: '80px', align: 'center' },
  { key: 'status', label: '상태', width: '100px', align: 'center' },
  { key: 'createdAt', label: '생성일', width: '130px' },
]

async function loadOrders(page = 1) {
  isLoading.value = true
  try {
    const response = await api.getOrders({ page, pageSize: 20 })
    orders.value = response.data
    total.value = response.total
    currentPage.value = page
  } finally {
    isLoading.value = false
  }
}

function handleRegister() {
  router.push({ name: ROUTE_NAMES.SELLER_ORDER_REGISTER })
}

function handleSort(key) {
  // 정렬 로직
  loadOrders(1)
}

function handlePageChange(page) {
  loadOrders(page)
}

onMounted(() => loadOrders())
</script>

<template>
  <AppLayout title="주문 목록" :breadcrumb="breadcrumb">
    <template #header-action>
      <button @click="handleRegister">주문 등록</button>
      <button @click="downloadExcel">내보내기</button>
    </template>

    <BaseTable
      :columns="columns"
      :rows="orders"
      :loading="isLoading"
      :pagination="{ page: currentPage, pageSize: 20, total }"
      @sort="handleSort"
      @page-change="handlePageChange"
    />
  </AppLayout>
</template>
```

### 상세 화면 (detail/edit)

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import { ROUTE_NAMES } from '@/constants'

const route = useRoute()
const router = useRouter()

const orderId = route.params.id
const order = ref(null)

const breadcrumb = [
  { label: '홈', to: { name: ROUTE_NAMES.SELLER_DASHBOARD } },
  { label: '주문 관리', to: { name: ROUTE_NAMES.SELLER_ORDER_LIST } },
  { label: '주문 상세' }
]

async function loadOrder() {
  const response = await api.getOrder(orderId)
  order.value = response.data
}

async function handleSave() {
  await api.updateOrder(orderId, order.value)
  router.back()
}

onMounted(() => loadOrder())
</script>

<template>
  <AppLayout title="주문 상세" :breadcrumb="breadcrumb">
    <template #header-action>
      <button @click="handleSave">저장</button>
      <button @click="router.back()">닫기</button>
    </template>

    <div v-if="order" class="detail-form">
      <BaseForm label="주문번호" required>
        <input v-model="order.id" disabled />
      </BaseForm>
      <BaseForm label="고객명" required>
        <input v-model="order.customerName" />
      </BaseForm>
      <!-- 더 많은 필드들 -->
    </div>
  </AppLayout>
</template>
```

---

## 주의사항

### 1. 레이아웃은 인증된 화면에서만 사용

```vue
<!-- ✅ 올바른 사용: 로그인된 화면 -->
<AppLayout title="대시보드">
  <!-- 페이지 콘텐츠 -->
</AppLayout>

<!-- ❌ 잘못된 사용: 로그인 화면 (AppLayout 사용 금지) -->
<!-- LoginView.vue는 자체 레이아웃 사용 -->
```

### 2. Sidebar/Header를 직접 사용하지 않기

```vue
<!-- ❌ 금지: 직접 import하여 사용 -->
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'

<!-- ✅ 올바른 방식: AppLayout만 사용 -->
import AppLayout from '@/components/layout/AppLayout.vue'
```

### 3. Breadcrumb 링크 설정

```vue
<!-- ❌ 문자열 경로 권장하지 않음 -->
:breadcrumb="[
  { label: '홈', to: '/seller/dashboard' }
]"

<!-- ✅ 라우트 객체 권장 -->
:breadcrumb="[
  { label: '홈', to: { name: ROUTE_NAMES.SELLER_DASHBOARD } }
]"
```

### 4. Padding 고려

AppLayout 콘텐츠는 자동으로 다음 padding 적용:
- `padding-top: 108px` (헤더 높이)
- `padding-left: 250px` (사이드바 너비)
- `padding-bottom: 105px` (푸터 높이)

접힌 사이드바에서도 패딩 유지되므로, 콘텐츠가 자동으로 조정됩니다.

---

## 관련 문서
- [step-06-stores.md](./step-06-stores.md) — useAuthStore, useUiStore, useNotificationStore
- [step-09-components-common.md](./step-09-components-common.md) — 공통 컴포넌트들
