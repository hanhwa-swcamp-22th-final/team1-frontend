# 라우터 문서

> **한 줄 요약**: Vue Router를 통한 Role별 페이지 접근 제어 및 네비게이션 가드 규칙.

## 목차 (Table of Contents)
- [파일 구조](#파일-구조)
- [핵심 개념](#핵심-개념)
- [네비게이션 가드 흐름](#네비게이션-가드-흐름)
- [라우트 파일 작성 가이드](#라우트-파일-작성-가이드)
- [meta 필드 규칙](#meta-필드-규칙)
- [로그인 후 리다이렉트](#로그인-후-리다이렉트)
- [주의사항](#주의사항)

---

## 파일 구조

```
src/router/
├── index.js                      ← 라우터 인스턴스 + 전역 가드 (4단계)
└── routes/
    ├── auth.js                   ← 로그인, 비밀번호 변경 (구현됨)
    ├── seller.js                 ← SELLER Role 라우트 (팀원 작업)
    ├── masterAdmin.js            ← MASTER_ADMIN Role 라우트 (팀원 작업)
    ├── whManager.js              ← WH_MANAGER Role 라우트 (팀원 작업)
    ├── whWorker.js               ← WH_WORKER Role 라우트 (팀원 작업)
    └── systemAdmin.js            ← SYSTEM_ADMIN Role 라우트 (팀원 작업)
```

---

## 핵심 개념

### Role 기반 접근 제어 (RBAC)

각 Role은 자신의 페이지에만 접근 가능합니다:

```
SYSTEM_ADMIN   → /system-admin/*  (시스템 관리)
MASTER_ADMIN   → /master-admin/*  (마스터 관리)
WH_MANAGER     → /wh-manager/*    (창고 관리)
WH_WORKER      → /wh-worker/*     (창고 작업)
SELLER         → /seller/*        (셀러 포탈)
```

### 라우트 정의 위치

- **Role별 라우트**: `src/router/routes/{role}.js`에 정의
- **공통 라우트**: `src/router/routes/auth.js`에 정의 (로그인, 비밀번호 변경)

### Route 객체 구조

```js
{
  path:       '/seller/dashboard',           // URL 경로
  name:       ROUTE_NAMES.SELLER_DASHBOARD,  // 라우트 이름
  component:  () => import('@/views/seller/DashboardView.vue'),  // lazy-load
  meta: {
    public:  false,          // (optional) 비로그인 접근 허용 여부
    role:    ROLES.SELLER,   // 필수: 이 라우트의 Role
    sidebar: { ... },        // (optional) Sidebar 메뉴 구성용
  },
}
```

---

## 네비게이션 가드 흐름

`src/router/index.js`의 `router.beforeEach()` 가드에서 다음 순서로 처리됩니다:

```
사용자가 URL 접근
        ↓
[가드 #1] 로그인 상태 + /login 접근?
  YES → 대시보드 리다이렉트
  NO  → 다음 가드
        ↓
[가드 #2] 비인증 페이지(meta.public=false) + 미로그인?
  YES → /login?redirect=현재경로 리다이렉트
  NO  → 다음 가드
        ↓
[가드 #3] 임시 비밀번호 상태 + change-password 아닌 페이지?
  YES → /change-password 강제 이동
  NO  → 다음 가드
        ↓
[가드 #4] Role 불일치 (meta.role !== auth.role)?
  YES → /403 에러 페이지
  NO  → next() — 페이지 진입
```

### 가드 #1: 로그인 중복 접근 방지

```js
// 이미 로그인 한 사용자가 /login을 다시 접근하면
// 해당 Role의 대시보드로 자동 리다이렉트
if (auth.isLoggedIn && to.name === ROUTE_NAMES.LOGIN) {
  return router.replace({
    name: DASHBOARD_BY_ROLE[auth.role]
  })
}
```

**예시**:
- SELLER 사용자가 `/login` 접근 → `/seller/dashboard`로 리다이렉트
- WH_MANAGER 사용자가 `/login` 접근 → `/wh-manager/dashboard`로 리다이렉트

### 가드 #2: 인증 필요 페이지 보호

```js
// meta.public이 없으면 기본값 false (인증 필요)
// 미로그인 사용자가 접근하면 로그인 페이지로 리다이렉트
// redirect 쿼리 파라미터에 원래 경로 저장
if (!to.meta.public && !auth.isLoggedIn) {
  return router.replace({
    name: ROUTE_NAMES.LOGIN,
    query: { redirect: to.fullPath }
  })
}
```

**예시**:
- 비로그인 사용자가 `/seller/orders` 접근
- → `/login?redirect=/seller/orders`로 리다이렉트
- → 로그인 후 원래 경로로 자동 복귀

### 가드 #3: 임시 비밀번호 상태 처리

```js
// 로그인 후 첫 접속 시 user.status === 'TEMP_PASSWORD'
// change-password 페이지 강제 진입
if (auth.user?.status === 'TEMP_PASSWORD' &&
    to.name !== ROUTE_NAMES.CHANGE_PASSWORD) {
  return router.replace({
    name: ROUTE_NAMES.CHANGE_PASSWORD
  })
}
```

**흐름**:
1. 사용자 로그인 (임시 비밀번호로 생성됨)
2. 어떤 페이지 접근 시도
3. 가드 #3 동작 → `/change-password` 강제 진입
4. 비밀번호 변경 완료 → 원래 페이지 접근 가능

### 가드 #4: Role 검증

```js
// 라우트의 meta.role이 로그인 사용자의 role과 다르면
// 403 Forbidden 에러 페이지로 이동
if (to.meta.role && to.meta.role !== auth.role) {
  return router.replace({
    name: ROUTE_NAMES.FORBIDDEN
  })
}
```

**예시**:
- SELLER 사용자가 `/wh-manager/dashboard` 접근 시도
- 가드에서 `meta.role: ROLES.WH_MANAGER`와 `auth.role: ROLES.SELLER` 비교
- → `/403` 에러 페이지 표시

---

## 라우트 파일 작성 가이드

### 기본 구조: `src/router/routes/seller.js`

```js
import { ROUTE_NAMES, ROLES } from '@/constants'

export default [
  {
    path: '/seller',
    redirect: { name: ROUTE_NAMES.SELLER_DASHBOARD }
  },
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
  {
    path: '/seller/orders/register',
    name: ROUTE_NAMES.SELLER_ORDER_REGISTER,
    component: () => import('@/views/seller/OrderRegisterView.vue'),
    meta: {
      role: ROLES.SELLER,
      sidebar: {
        group: '주문 관리',
        label: '주문 등록',
        icon: '➕',
      }
    }
  },
]
```

### 라우트 이름 정의: `src/constants/routes.js`

```js
export const ROUTE_NAMES = {
  // 공통
  LOGIN: 'login',
  CHANGE_PASSWORD: 'change-password',
  FORBIDDEN: '403',

  // SELLER
  SELLER_DASHBOARD: 'seller-dashboard',
  SELLER_ORDER_LIST: 'seller-order-list',
  SELLER_ORDER_REGISTER: 'seller-order-register',

  // WH_MANAGER
  WH_MANAGER_DASHBOARD: 'wh-manager-dashboard',
  WH_MANAGER_WAREHOUSE_LIST: 'wh-manager-warehouse-list',
  // ... 더 많은 라우트
}
```

### 라우터 통합: `src/router/index.js`

```js
import authRoutes from './routes/auth'
import sellerRoutes from './routes/seller'
import whManagerRoutes from './routes/whManager'
// ... 다른 Role 라우트 import

const routes = [
  ...authRoutes,
  ...sellerRoutes,
  ...whManagerRoutes,
  // ... 다른 Role 라우트들
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 네비게이션 가드들...

export default router
```

---

## meta 필드 규칙

### meta.role (필수)

라우트가 어느 Role에서만 접근 가능한지 정의합니다.

```js
meta: {
  role: ROLES.SELLER   // SELLER Role만 접근 가능
}
```

**사용 가능한 Role 값**:
- `ROLES.SYSTEM_ADMIN`
- `ROLES.MASTER_ADMIN`
- `ROLES.WH_MANAGER`
- `ROLES.WH_WORKER`
- `ROLES.SELLER`

### meta.public (선택)

`true`일 경우 비로그인 사용자도 접근 가능합니다.
기본값: `false` (인증 필수)

```js
// 로그인 페이지: 비로그인도 접근 가능
meta: {
  public: true
}

// 대시보드: 로그인 필수
meta: {
  role: ROLES.SELLER
  // public 생략 = false
}
```

### meta.sidebar (선택)

Sidebar 메뉴 구성 시 사용. Sidebar.vue의 `menuGroups` computed에서 참고합니다.

```js
meta: {
  sidebar: {
    group: '주문 관리',      // 메뉴 그룹명
    label: '주문 목록',       // 메뉴 아이템 레이블
    icon: '📦',             // 아이콘 (emoji 또는 클래스명)
  }
}
```

구조 예:
```
주문 관리
  ├─ 📦 주문 목록
  └─ ➕ 주문 등록

재고 관리
  ├─ 📊 재고 현황
  └─ 📝 재고 수정
```

---

## 로그인 후 리다이렉트

### 시나리오 1: redirect 쿼리 파라미터 사용

```vue
<!-- LoginView.vue -->
<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

async function handleLogin(email, password) {
  const response = await api.login({ email, password })
  auth.setAuth(response.data)

  // redirect 쿼리 파라미터가 있으면 그 페이지로, 없으면 대시보드로
  const redirect = route.query.redirect
  await router.replace(redirect ?? { name: DASHBOARD_BY_ROLE[auth.role] })
}
</script>
```

### 시나리오 2: redirect 쿼리 파라미터 없음

```js
// 로그인 페이지를 직접 방문한 경우
// redirect 파라미터가 없으므로 Role별 대시보드로 이동

const DASHBOARD_BY_ROLE = {
  [ROLES.SELLER]: ROUTE_NAMES.SELLER_DASHBOARD,
  [ROLES.WH_MANAGER]: ROUTE_NAMES.WH_MANAGER_DASHBOARD,
  [ROLES.WH_WORKER]: ROUTE_NAMES.WH_WORKER_DASHBOARD,
  [ROLES.MASTER_ADMIN]: ROUTE_NAMES.MASTER_ADMIN_DASHBOARD,
  [ROLES.SYSTEM_ADMIN]: ROUTE_NAMES.SYSTEM_ADMIN_DASHBOARD,
}

// 예: SELLER로 로그인하면 /seller/dashboard로 이동
router.replace({ name: DASHBOARD_BY_ROLE[auth.role] })
```

### 시나리오 3: 임시 비밀번호 상태

```js
// 로그인 성공 후 user.status가 TEMP_PASSWORD면
// 다음 페이지 접근 시 자동으로 /change-password 강제 진입
// (가드 #3에서 처리)

const response = await api.login({ email, password })
auth.setAuth(response.data)

// user.status === 'TEMP_PASSWORD'일 경우
// 어떤 라우트든 접근하면 /change-password로 강제 이동됨
```

---

## 주의사항

### 1. meta.role 필수 입력

```js
// ❌ 잘못된 방식: meta.role 없음
const sellerRoutes = [
  {
    path: '/seller/dashboard',
    component: DashboardView,
    // meta.role 누락!
  }
]

// ✅ 올바른 방식
const sellerRoutes = [
  {
    path: '/seller/dashboard',
    component: DashboardView,
    meta: {
      role: ROLES.SELLER  // 반드시 포함
    }
  }
]
```

### 2. 라우트 이름(name) 중복 금지

```js
// ❌ 잘못된 방식: 중복된 라우트 이름
export const ROUTE_NAMES = {
  DASHBOARD: 'dashboard',       // 다른 파일에도 있음
  // ...
}

// ✅ 올바른 방식: Role 접두사로 구분
export const ROUTE_NAMES = {
  SELLER_DASHBOARD: 'seller-dashboard',
  WH_MANAGER_DASHBOARD: 'wh-manager-dashboard',
  // ...
}
```

### 3. 라우트 경로(path) 일관성

```js
// ❌ 잘못된 방식: 경로명이 일관성 없음
path: '/seller/dashboard'        // 소문자
path: '/WH-Manager/warehouse'    // 대문자
path: '/whWorker_tasks'          // 언더스코어

// ✅ 올바른 방식: kebab-case 통일
path: '/seller/dashboard'
path: '/wh-manager/warehouse'
path: '/wh-worker/tasks'
```

### 4. 컴포넌트 경로 확인

```js
// ❌ 잘못된 방식: 잘못된 경로
component: () => import('@/views/seller/OrderList.vue')  // 파일명 오류

// ✅ 올바른 방식: 실제 파일명과 동일
component: () => import('@/views/seller/OrderListView.vue')
```

### 5. redirect 설정

```js
// ❌ 단순 리다이렉트는 name 사용
{
  path: '/seller',
  redirect: '/seller/dashboard'  // 문자열 경로 권장하지 않음
}

// ✅ 라우트 이름으로 리다이렉트
{
  path: '/seller',
  redirect: { name: ROUTE_NAMES.SELLER_DASHBOARD }  // 권장
}
```

### 6. 비동기 컴포넌트 로드 (lazy-load)

```js
// ✅ 권장: lazy-load로 번들 크기 최소화
component: () => import('@/views/seller/OrderListView.vue')

// ❌ 비권장: 즉시 로드 (번들 크기 증가)
import OrderListView from '@/views/seller/OrderListView.vue'
// ...
component: OrderListView
```

---

## 자주 묻는 질문 (FAQ)

### Q1: 로그인 후 redirect 쿼리가 없으면?

```js
// 시나리오: 사용자가 /login을 직접 방문했을 경우
const redirect = route.query.redirect  // undefined

// redirect ?? 표현식으로 처리
router.replace(redirect ?? { name: DASHBOARD_BY_ROLE[auth.role] })
// → redirect가 없으므로 대시보드로 이동
```

### Q2: 다른 Role 페이지에 접근하면?

```js
// SELLER 사용자가 /wh-manager/dashboard 접근
// 가드 #4에서 meta.role(WH_MANAGER) !== auth.role(SELLER) 감지
// → router.replace({ name: ROUTE_NAMES.FORBIDDEN })
// → /403 에러 페이지 표시
```

### Q3: 새 Role 추가 시 해야 할 일?

1. `src/constants/roles.js`에 새 Role 상수 추가
2. `src/router/routes/{newRole}.js` 파일 생성
3. `src/router/index.js`에 import 및 라우트 배열에 추가
4. `DASHBOARD_BY_ROLE` 객체에 새 Role의 대시보드 추가
5. API 레이어에서 Role별 권한 처리

---

## 관련 문서
- [step-06-stores.md](./step-06-stores.md) — useAuthStore와의 통합
- [step-11-entrypoint.md](./step-11-entrypoint.md) — 라우터 등록 순서
- [CLAUDE.md](../CLAUDE.md) — 프로젝트 라우터 가드 규칙
