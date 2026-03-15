# Pinia 스토어 문서

> **한 줄 요약**: 전역 상태를 Pinia로 관리하며, 로그인 정보와 창고 선택은 로컬스토리지에 자동 저장됨.

## 목차 (Table of Contents)
- [설정](#설정)
- [스토어 목록](#스토어-목록)
- [useAuthStore](#useauthstore-srcstoresauthjs)
- [useUiStore](#useuistore-srcstoresuijs)
- [useNotificationStore](#usenotificationstore-srcstoresnotificationjs)
- [useWarehouseStore](#usewarehousestore-srcstoreswarehousejs)
- [주의사항](#주의사항)

## 설정

`src/main.js`에서 pinia-plugin-persistedstate 등록:

```js
import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedstate from 'pinia-plugin-persistedstate'
import router from '@/router'
import App from './App.vue'

const pinia = createPinia()
pinia.use(piniaPersistedstate)    // (1) persist 플러그인 등록

createApp(App)
  .use(pinia)                      // (2) Pinia 등록
  .use(router)                     // (3) 라우터 등록
  .mount('#app')
```

### 플러그인 등록 순서 주의사항

1. **`pinia.use(piniaPersistedstate)`** — Pinia 인스턴스 생성 직후, `use(pinia)` 전에 설정
2. **`.use(pinia)`** — Pinia를 Vue 앱에 등록
3. **`.use(router)`** — 라우터 등록 (라우터 가드 내에서 Pinia 스토어 접근 가능)

순서가 바뀌면 라우터 가드에서 `useAuthStore()` 호출 시 에러 발생 가능.

---

## 스토어 목록

| 스토어 | 파일 | persist | 로컬스토리지 키 | 용도 |
|---|---|---|---|---|
| `auth` | `src/stores/auth.js` | ✅ | `conk-auth` | 로그인 유저 정보, JWT 토큰 |
| `ui` | `src/stores/ui.js` | ❌ | — | 로딩 상태, 사이드바 열림/닫힘 |
| `notification` | `src/stores/notification.js` | ❌ | — | 인앱 알림 목록 |
| `warehouse` | `src/stores/warehouse.js` | ✅ | `conk-warehouse` | WH_MANAGER 선택 창고 |

---

## useAuthStore (`src/stores/auth.js`)

로그인 사용자 정보, JWT 토큰, Role, 테넌트 코드를 전역으로 관리하는 스토어.
`pinia-plugin-persistedstate`로 인해 새로고침 후에도 유지됨.

### State

| 필드 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `user` | `Object \| null` | `null` | `{ name, email, status, organization?, avatar? }` |
| `token` | `string \| null` | `null` | JWT 액세스 토큰 |
| `role` | `string \| null` | `null` | `ROLES` 상수 값 중 하나 (`SYSTEM_ADMIN`, `MASTER_ADMIN`, `WH_MANAGER`, `WH_WORKER`, `SELLER`) |
| `tenantCode` | `string \| null` | `null` | 창고사 코드. 모든 API 요청의 `X-Tenant-Code` 헤더에 자동 주입됨 |
| `customerCode` | `string \| null` | `null` | 셀러 고객사 코드 (SELLER Role 전용) |

### Computed

| 이름 | 반환 타입 | 설명 |
|---|---|---|
| `isLoggedIn` | `boolean` | `!!token` — 토큰 여부로 로그인 상태 판단 |

### Actions

#### setAuth(payload)

로그인 성공 후 호출. 모든 인증 정보 일괄 설정.

```js
setAuth({ user, token, role, tenantCode, customerCode })
```

| 매개변수 | 타입 | 설명 |
|---|---|---|
| `user` | `Object` | `{ name, email, status, organization?, avatar? }` |
| `token` | `string` | JWT 액세스 토큰 |
| `role` | `string` | `ROLES.X` 값 |
| `tenantCode` | `string` | 창고사 코드 |
| `customerCode` | `string` | 셀러 고객사 코드 (optional) |

#### clearAuth()

로그아웃 시 호출. 모든 인증 상태 초기화. 로컬스토리지에서 `conk-auth` 키도 삭제됨.

```js
clearAuth()
```

### 사용 예

```vue
<script setup>
import { useAuthStore } from '@/stores/auth'
import { ROLES, ROUTE_NAMES } from '@/constants'

const auth = useAuthStore()

// 로그인 처리
async function handleLogin(email, password) {
  const res = await login({ email, password })
  auth.setAuth(res.data)

  // 로그인 성공 후 대시보드로 이동
  await router.replace({ name: ROUTE_NAMES.SELLER_DASHBOARD })
}

// 조건부 렌더링
<template>
  <div v-if="auth.isLoggedIn">
    <p>{{ auth.user?.name }}님 환영합니다.</p>
  </div>

  <div v-if="auth.role === ROLES.SELLER">
    <!-- 셀러 전용 UI -->
  </div>
</template>

// 로그아웃
function handleLogout() {
  auth.clearAuth()
  await router.replace({ name: ROUTE_NAMES.LOGIN })
}
</script>
```

### 로컬스토리지 구조

```json
{
  "conk-auth": {
    "user": { "name": "홍길동", "email": "hong@example.com", "status": "ACTIVE" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "role": "SELLER",
    "tenantCode": "TENANT-001",
    "customerCode": "CUST-123"
  }
}
```

---

## useUiStore (`src/stores/ui.js`)

전역 UI 상태를 관리하는 스토어. 로컬스토리지에 저장되지 않음 (새로고침 시 초기값 복원).

### State

| 필드 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `isLoading` | `boolean` | `false` | 전역 로딩 오버레이 표시 여부 |
| `isSidebarOpen` | `boolean` | `true` | 사이드바 펼침/접힘 상태 |

### Actions

#### setLoading(val)

전역 로딩 상태 설정.

```js
setLoading(true)   // 로딩 시작
setLoading(false)  // 로딩 완료
```

#### toggleSidebar()

사이드바 토글. `isSidebarOpen` 반전.

```js
toggleSidebar()  // true → false 또는 false → true
```

### setLoading 사용 패턴

```js
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()

async function fetchData() {
  ui.setLoading(true)
  try {
    const res = await someApiCall()
    return res.data
  } finally {
    ui.setLoading(false)  // 반드시 finally에서 해제
  }
}
```

### 로딩 오버레이 렌더링

`AppLayout.vue` 또는 루트 컴포넌트에서:

```vue
<template>
  <div>
    <!-- 페이지 콘텐츠 -->
    <RouterView />

    <!-- 전역 로딩 오버레이 -->
    <LoadingSpinner v-if="ui.isLoading" fullscreen />
  </div>
</template>

<script setup>
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()
</script>
```

### 사이드바 토글 사용

```vue
<script setup>
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()

function toggleSidebar() {
  ui.toggleSidebar()
}
</script>

<template>
  <button @click="toggleSidebar">
    {{ ui.isSidebarOpen ? '접기' : '펼치기' }}
  </button>
</template>
```

---

## useNotificationStore (`src/stores/notification.js`)

인앱 알림 목록을 전역으로 관리하는 스토어.

### State

| 필드 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `notifications` | `Array<Object>` | `[]` | 알림 배열 `[{ id, message, time, read }, ...]` |

### Computed

#### unreadCount

미읽음 알림 개수 반환.

```js
const count = notif.unreadCount  // 자동 계산
```

### Actions

#### fetchNotifications()

서버에서 알림 목록 조회 및 로드.

```js
await notif.fetchNotifications()
```

※ **TODO**: `src/api/notification.js` 작업 필요. 현재는 stub 상태.

#### markAsRead(id)

특정 알림을 읽음 처리.

```js
notif.markAsRead('notif-123')
```

#### markAllAsRead()

모든 알림을 읽음 처리.

```js
notif.markAllAsRead()
```

### 사용 예

```vue
<script setup>
import { useNotificationStore } from '@/stores/notification'
const notif = useNotificationStore()

onMounted(async () => {
  await notif.fetchNotifications()
})

function handleNotifClick(id) {
  notif.markAsRead(id)
}
</script>

<template>
  <!-- 미읽음 배지 -->
  <div class="notification-badge" v-if="notif.unreadCount > 0">
    {{ notif.unreadCount }}
  </div>

  <!-- 알림 목록 -->
  <div class="notification-list">
    <div v-for="n in notif.notifications" :key="n.id" @click="handleNotifClick(n.id)">
      <p>{{ n.message }}</p>
      <time>{{ n.time }}</time>
      <span v-if="!n.read" class="unread-badge">●</span>
    </div>
  </div>
</template>
```

---

## useWarehouseStore (`src/stores/warehouse.js`)

**⚠️ WH_MANAGER Role 전용 스토어**

창고 관리자가 선택한 현재 창고를 전역으로 관리.
`pinia-plugin-persistedstate`로 새로고침 후에도 유지됨.

### State

| 필드 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `selectedWarehouse` | `Object \| null` | `null` | `{ id, name, code, address, ... }` |

### Actions

#### setWarehouse(wh)

창고 선택.

```js
setWarehouse({ id: 'WH-001', name: '서울 창고', code: 'SEOUL', ... })
```

#### clearWarehouse()

선택 창고 해제.

```js
clearWarehouse()
```

### 사용 예

```vue
<script setup>
import { useWarehouseStore } from '@/stores/warehouse'
import { ROLES } from '@/constants'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const warehouse = useWarehouseStore()

// WH_MANAGER만 접근 가능
const canUse = computed(() => auth.role === ROLES.WH_MANAGER)

// 창고 선택
function selectWarehouse(wh) {
  warehouse.setWarehouse(wh)
}

// 현재 선택 창고
const currentWh = computed(() => warehouse.selectedWarehouse)
</script>

<template>
  <div v-if="canUse && currentWh">
    <h2>{{ currentWh.name }}</h2>
    <p>코드: {{ currentWh.code }}</p>
  </div>
</template>
```

### 다른 Role에서 접근 금지

```js
// ❌ 잘못된 사용
const wh = useWarehouseStore()  // SELLER/SYSTEM_ADMIN에서 사용 금지
wh.setWarehouse(...)

// ✅ 올바른 사용: WH_MANAGER만 사용
if (auth.role === ROLES.WH_MANAGER) {
  const wh = useWarehouseStore()
  wh.setWarehouse(...)
}
```

---

## 주의사항

### 1. API 호출 후 상태 업데이트 순서

```js
// ❌ 잘못된 방식
async function update() {
  auth.setAuth(response.data)  // 로컬 상태 먼저 변경
  await api.updateProfile(data)  // 서버 요청
}

// ✅ 올바른 방식
async function update() {
  const response = await api.updateProfile(data)  // 서버 요청
  auth.setAuth(response.data)  // 응답 후 상태 변경
}
```

### 2. 로컬스토리지 직접 수정 금지

```js
// ❌ 금지
localStorage.setItem('conk-auth', JSON.stringify(...))

// ✅ 스토어를 통해 수정
auth.setAuth(...)
```

### 3. 토큰 만료 처리

라우터 가드 또는 API 응답 인터셉터에서 401 에러 시 처리:

```js
// src/api/instance.js
instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      auth.clearAuth()
      router.replace({ name: 'login' })
    }
    return Promise.reject(error)
  }
)
```

### 4. State 직접 수정 금지

```js
// ❌ 금지: state 직접 수정
auth.token = 'new-token'

// ✅ 올바른 방식: action 호출
auth.setAuth({ token: 'new-token', ... })
```

---

## 관련 문서
- [step-08-router.md](./step-08-router.md) — 라우터 가드와의 상호작용
- [step-11-entrypoint.md](./step-11-entrypoint.md) — Pinia 플러그인 등록 순서
- [CLAUDE.md](../CLAUDE.md) — 프로젝트 아키텍처 규칙
