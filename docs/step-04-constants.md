# 상수 레퍼런스

> **한 줄 요약**: CONK 프론트엔드에서 사용하는 모든 상수 정의 및 사용 가이드

## 목차
- [파일 구조](#파일-구조)
- [Import 방법](#import-방법)
- [ROLES (역할/권한)](#roles-역할권한)
- [ORDER_STATUS (주문 상태)](#order_status-주문-상태)
- [ASN_STATUS (입고 상태)](#asn_status-입고-상태)
- [ACCOUNT_STATUS (계정 상태)](#account_status-계정-상태)
- [ROUTE_NAMES (라우트 이름)](#route_names-라우트-이름)
- [상수 추가 절차](#상수-추가-절차)
- [동기화 체크리스트](#동기화-체크리스트)

---

## 파일 구조

```
src/constants/
├── index.js              ← 모든 상수 re-export (여기서만 import!)
├── roles.js              ← Role 상수
├── status.js             ← 상태 상수
└── routes.js             ← 라우트 이름 상수
```

### index.js (Re-export)

```js
// src/constants/index.js
export { ROLES } from './roles.js'
export { ORDER_STATUS, ASN_STATUS, ACCOUNT_STATUS } from './status.js'
export { ROUTE_NAMES } from './routes.js'
```

---

## Import 방법

### ✅ 올바른 방법 (권장)

```js
// src/components/MyComponent.vue 또는 src/stores/auth.js
import { ROLES, ORDER_STATUS, ROUTE_NAMES } from '@/constants'

// 사용
if (user.role === ROLES.SYSTEM_ADMIN) {
  // ...
}

router.push({ name: ROUTE_NAMES.SELLER_DASHBOARD })
```

### ❌ 잘못된 방법 (금지)

```js
// 개별 파일에서 직접 import 금지
import { ROLES } from '@/constants/roles'
import { ORDER_STATUS } from '@/constants/status'

// 문자열 하드코딩 금지
if (user.role === 'SYSTEM_ADMIN') { }
router.push('/seller/dashboard')
```

---

## ROLES (역할/권한)

CONK WMS의 5가지 사용자 역할입니다. 각 Role은 고유한 화면과 권한을 가집니다.

### 상수 정의

```js
// src/constants/roles.js
export const ROLES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',      // 1. 시스템 관리자
  MASTER_ADMIN: 'MASTER_ADMIN',      // 2. 마스터 관리자 (다중 창고 운영)
  WH_MANAGER: 'WH_MANAGER',          // 3. 창고 관리자 (단일 창고)
  WH_WORKER: 'WH_WORKER',            // 4. 창고 작업자 (태블릿 UI)
  SELLER: 'SELLER'                   // 5. 판매자 (셀러)
}
```

### Role별 담당 화면

| Role | 상수 | 화면 경로 | 역할 |
|---|---|---|---|
| 시스템 관리자 | `ROLES.SYSTEM_ADMIN` | `views/systemAdmin/` | 전체 시스템 설정, 테넌트 관리 |
| 마스터 관리자 | `ROLES.MASTER_ADMIN` | `views/masterAdmin/` | 다중 창고 운영, 비용 분석 |
| 창고 관리자 | `ROLES.WH_MANAGER` | `views/whManager/` | 단일 창고 운영, 출고 관리 |
| 창고 작업자 | `ROLES.WH_WORKER` | `views/whWorker/` | 피킹/패킹/재고 확인 (태블릿) |
| 판매자 | `ROLES.SELLER` | `views/seller/` | ASN 등록, 주문 조회 |

### Role별 화면 구조

```
src/views/
├── auth/                    # 공통 (로그인, 비밀번호 변경)
│   ├── LoginPage.vue
│   └── SetPasswordPage.vue
│
├── systemAdmin/             # SYSTEM_ADMIN만
│   ├── DashboardPage.vue
│   ├── TenantManagementPage.vue
│   └── ...
│
├── masterAdmin/             # MASTER_ADMIN만
│   ├── DashboardPage.vue
│   ├── WarehouseListPage.vue
│   └── ...
│
├── whManager/               # WH_MANAGER만
│   ├── DashboardPage.vue
│   ├── InventoryPage.vue
│   └── ...
│
├── whWorker/                # WH_WORKER만 (태블릿)
│   ├── PickingPage.vue
│   ├── PackingPage.vue
│   └── ...
│
└── seller/                  # SELLER만
    ├── DashboardPage.vue
    ├── ASNPage.vue
    └── ...
```

### Role 확인 패턴

```js
// src/stores/auth.js
export const useAuthStore = defineStore('auth', () => {
  const userRole = ref(null)

  const isSystemAdmin = computed(() => userRole.value === ROLES.SYSTEM_ADMIN)
  const isMasterAdmin = computed(() => userRole.value === ROLES.MASTER_ADMIN)
  const isWarehouseManager = computed(() => userRole.value === ROLES.WH_MANAGER)
  const isWarehouseWorker = computed(() => userRole.value === ROLES.WH_WORKER)
  const isSeller = computed(() => userRole.value === ROLES.SELLER)

  return { userRole, isSystemAdmin, isMasterAdmin, ... }
})
```

### Role 기반 라우터 가드

```js
// src/router/index.js
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // Role별 접근 제어
  if (to.meta.roles && !to.meta.roles.includes(auth.userRole)) {
    next({ name: ROUTE_NAMES.FORBIDDEN })  // 403 페이지
  } else {
    next()
  }
})
```

라우트 메타 정의:
```js
{
  path: '/system-admin/dashboard',
  name: ROUTE_NAMES.SYS_DASHBOARD,
  component: SystemAdminDashboard,
  meta: { roles: [ROLES.SYSTEM_ADMIN] }  // SYSTEM_ADMIN만 접근
}
```

---

## ORDER_STATUS (주문 상태)

판매자가 등록한 주문이 거치는 상태 전이를 정의합니다.

### 상수 정의

```js
// src/constants/status.js
export const ORDER_STATUS = {
  PENDING: 'PENDING',           // 주문 접수
  CONFIRMED: 'CONFIRMED',       // 주문 확인
  PICKING: 'PICKING',           // 피킹 중
  PACKING: 'PACKING',           // 패킹 중
  SHIPPED: 'SHIPPED',           // 출고 완료
  CANCELLED: 'CANCELLED'        // 취소
}
```

### 상태 전이 흐름

```
┌──────────┐
│ PENDING  │ (주문 접수 직후)
└────┬─────┘
     │ 주문 확인
     ↓
┌──────────────┐
│ CONFIRMED    │ (창고 담당자가 확인)
└────┬─────────┘
     │ 피킹 시작
     ↓
┌──────────┐
│ PICKING  │ (상품 피킹 진행 중)
└────┬─────┘
     │ 피킹 완료 → 패킹 시작
     ↓
┌──────────┐
│ PACKING  │ (상품 패킹 진행 중)
└────┬─────┘
     │ 패킹 완료 → 출고
     ↓
┌──────────┐
│ SHIPPED  │ (최종 상태)
└──────────┘

     ↓ (언제든 취소 가능)
┌──────────────┐
│ CANCELLED    │ (최종 상태)
└──────────────┘
```

### 상태별 설명 및 담당

| 상수 | 값 | 설명 | 담당자 | 다음 상태 |
|---|---|---|---|---|
| `PENDING` | `'PENDING'` | 판매자가 주문 등록, 창고에서 미확인 | 창고 관리자 | CONFIRMED, CANCELLED |
| `CONFIRMED` | `'CONFIRMED'` | 창고가 주문 확인, 재고 예약 | 창고 작업자 | PICKING, CANCELLED |
| `PICKING` | `'PICKING'` | 상품을 선반에서 꺼내는 중 | 창고 작업자 | PACKING, CANCELLED |
| `PACKING` | `'PACKING'` | 상품을 포장하는 중 | 창고 작업자 | SHIPPED, CANCELLED |
| `SHIPPED` | `'SHIPPED'` | 출고 완료, 배송 준비 | - | (최종) |
| `CANCELLED` | `'CANCELLED'` | 주문 취소됨 | - | (최종) |

### StatusBadge 컴포넌트 연동

```vue
<!-- src/components/common/StatusBadge.vue -->
<script setup>
import { ORDER_STATUS } from '@/constants'

const props = defineProps({
  status: { type: String, required: true }
})

const statusLabel = computed(() => {
  const MAP = {
    [ORDER_STATUS.PENDING]: '대기 중',
    [ORDER_STATUS.CONFIRMED]: '확인됨',
    [ORDER_STATUS.PICKING]: '피킹 중',
    [ORDER_STATUS.PACKING]: '패킹 중',
    [ORDER_STATUS.SHIPPED]: '출고 완료',
    [ORDER_STATUS.CANCELLED]: '취소됨'
  }
  return MAP[props.status] || props.status
})

const statusColor = computed(() => {
  const COLORS = {
    [ORDER_STATUS.PENDING]: 'amber',
    [ORDER_STATUS.CONFIRMED]: 'blue',
    [ORDER_STATUS.PICKING]: 'purple',
    [ORDER_STATUS.PACKING]: 'purple',
    [ORDER_STATUS.SHIPPED]: 'green',
    [ORDER_STATUS.CANCELLED]: 'red'
  }
  return COLORS[props.status] || 'default'
})
</script>

<template>
  <span :class="[`badge-${statusColor}`]">
    {{ statusLabel }}
  </span>
</template>
```

---

## ASN_STATUS (입고 상태)

ASN (Advanced Shipping Notice, 사전 입고 예정)의 상태 전이를 정의합니다.

### 상수 정의

```js
// src/constants/status.js
export const ASN_STATUS = {
  DRAFT: 'DRAFT',               // 작성 중
  SUBMITTED: 'SUBMITTED',       // 제출됨
  RECEIVED: 'RECEIVED',         // 입고 완료
  CANCELLED: 'CANCELLED'        // 취소됨
}
```

### 상태 전이 흐름

```
┌───────┐
│ DRAFT │ (셀러가 작성 중)
└───┬───┘
    │ 제출
    ↓
┌────────────┐
│ SUBMITTED  │ (창고 대기 중)
└───┬────────┘
    │ 입고 처리 완료
    ↓
┌──────────┐
│ RECEIVED │ (최종 상태)
└──────────┘

    ↓ (작성/제출 중 취소 가능)
┌────────────┐
│ CANCELLED  │ (최종 상태)
└────────────┘
```

### 상태별 설명

| 상수 | 값 | 설명 | 담당자 | 다음 상태 |
|---|---|---|---|---|
| `DRAFT` | `'DRAFT'` | 셀러가 ASN 작성 중 | 판매자 | SUBMITTED, CANCELLED |
| `SUBMITTED` | `'SUBMITTED'` | 셀러가 ASN 제출, 창고 입고 예정 | 창고 관리자 | RECEIVED, CANCELLED |
| `RECEIVED` | `'RECEIVED'` | 창고가 상품 입고 완료 | - | (최종) |
| `CANCELLED` | `'CANCELLED'` | ASN 취소됨 | - | (최종) |

---

## ACCOUNT_STATUS (계정 상태)

사용자 계정의 상태를 정의합니다.

### 상수 정의

```js
// src/constants/status.js
export const ACCOUNT_STATUS = {
  ACTIVE: 'ACTIVE',             // 정상 활성 계정
  TEMP_PASSWORD: 'TEMP_PASSWORD',  // 임시 비밀번호 (첫 로그인)
  INACTIVE: 'INACTIVE'          // 비활성 계정 (차단됨)
}
```

### 상태별 설명 및 라우터 처리

| 상수 | 값 | 설명 | 라우터 동작 |
|---|---|---|---|
| `ACTIVE` | `'ACTIVE'` | 정상 계정 | 로그인 후 Role별 대시보드로 이동 |
| `TEMP_PASSWORD` | `'TEMP_PASSWORD'` | 임시 비밀번호 상태 (관리자가 계정 생성 후 초기 상태) | 로그인 후 **반드시** `/set-password` 페이지로 강제 이동 |
| `INACTIVE` | `'INACTIVE'` | 비활성 계정 (관리자가 비활성화함) | 로그인 거부, 에러 메시지 표시 |

### 라우터 가드 구현

```js
// src/router/index.js
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  // TEMP_PASSWORD 상태 → 비밀번호 변경 강제 이동
  if (auth.accountStatus === ACCOUNT_STATUS.TEMP_PASSWORD) {
    if (to.name !== ROUTE_NAMES.SET_PASSWORD) {
      next({ name: ROUTE_NAMES.SET_PASSWORD })
      return
    }
  }

  // INACTIVE 상태 → 접근 금지
  if (auth.accountStatus === ACCOUNT_STATUS.INACTIVE) {
    next({ name: ROUTE_NAMES.FORBIDDEN })
    return
  }

  next()
})
```

---

## ROUTE_NAMES (라우트 이름)

라우트 네비게이션에서 하드코딩된 경로 대신 라우트 이름을 사용합니다.

### 라우트 이름 명명 규칙

| Role | 접두어 | 예시 |
|---|---|---|
| 공용 (Auth) | (없음) | `login`, `set-password`, `forbidden` |
| Seller | `seller-` | `seller-dashboard`, `seller-asn-list` |
| Master Admin | `master-` | `master-dashboard`, `master-warehouse-list` |
| WH Manager | `whm-` | `whm-dashboard`, `whm-inventory` |
| WH Worker | `whw-` | `whw-picking`, `whw-packing` |
| System Admin | `sys-` | `sys-dashboard`, `sys-tenant-management` |

### ROUTE_NAMES 상수 예시

```js
// src/constants/routes.js
export const ROUTE_NAMES = {
  // Auth (공용)
  LOGIN: 'login',
  SET_PASSWORD: 'set-password',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not-found',

  // Seller
  SELLER_DASHBOARD: 'seller-dashboard',
  SELLER_ASN_LIST: 'seller-asn-list',
  SELLER_ASN_CREATE: 'seller-asn-create',
  SELLER_ASN_DETAIL: 'seller-asn-detail',
  SELLER_ORDER_LIST: 'seller-order-list',
  SELLER_ORDER_DETAIL: 'seller-order-detail',

  // Master Admin
  MASTER_DASHBOARD: 'master-dashboard',
  MASTER_WAREHOUSE_LIST: 'master-warehouse-list',
  MASTER_WAREHOUSE_DETAIL: 'master-warehouse-detail',
  MASTER_FINANCE: 'master-finance',

  // WH Manager
  WHM_DASHBOARD: 'whm-dashboard',
  WHM_INVENTORY: 'whm-inventory',
  WHM_ORDER_LIST: 'whm-order-list',
  WHM_LOCATION_SETUP: 'whm-location-setup',

  // WH Worker
  WHW_PICKING: 'whw-picking',
  WHW_PACKING: 'whw-packing',
  WHW_INVENTORY_CHECK: 'whw-inventory-check',

  // System Admin
  SYS_DASHBOARD: 'sys-dashboard',
  SYS_TENANT_MANAGEMENT: 'sys-tenant-management',
  SYS_USER_MANAGEMENT: 'sys-user-management'
}
```

### 라우트 네비게이션 사용법

```vue
<!-- ✅ 올바른 방법 -->
<router-link :to="{ name: ROUTE_NAMES.SELLER_ORDER_LIST }">
  주문 목록
</router-link>

<button @click="router.push({ name: ROUTE_NAMES.SELLER_ASN_CREATE })">
  ASN 등록
</button>

<!-- ❌ 잘못된 방법 (하드코딩) -->
<router-link to="/seller/order">주문 목록</router-link>
<button @click="router.push('/seller/asn/create')">ASN 등록</button>
```

### 동적 라우트 파라미터

```js
// 상세 페이지로 이동 (ID 파라미터)
router.push({
  name: ROUTE_NAMES.SELLER_ORDER_DETAIL,
  params: { id: orderId }
})

// URL: /seller/orders/12345

// 쿼리 파라미터
router.push({
  name: ROUTE_NAMES.SELLER_ORDER_LIST,
  query: { page: 2, status: 'SHIPPED' }
})

// URL: /seller/orders?page=2&status=SHIPPED
```

---

## 상수 추가 절차

### 1. 새로운 상태 추가 (예: 새로운 ORDER_STATUS)

**Step 1**: `src/constants/status.js`에 상수 추가
```js
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PICKING: 'PICKING',
  PACKING: 'PACKING',
  SHIPPED: 'SHIPPED',
  RETURNED: 'RETURNED',  // 새로 추가
  CANCELLED: 'CANCELLED'
}
```

**Step 2**: `src/components/common/StatusBadge.vue`의 MAP 동기화
```js
const statusLabel = computed(() => {
  const MAP = {
    [ORDER_STATUS.PENDING]: '대기 중',
    [ORDER_STATUS.CONFIRMED]: '확인됨',
    [ORDER_STATUS.PICKING]: '피킹 중',
    [ORDER_STATUS.PACKING]: '패킹 중',
    [ORDER_STATUS.SHIPPED]: '출고 완료',
    [ORDER_STATUS.RETURNED]: '반품됨',  // 추가
    [ORDER_STATUS.CANCELLED]: '취소됨'
  }
  return MAP[props.status] || props.status
})
```

**Step 3**: 색상 매핑 추가
```js
const statusColor = computed(() => {
  const COLORS = {
    // ... 기존
    [ORDER_STATUS.RETURNED]: 'blue'  // 추가
  }
  return COLORS[props.status] || 'default'
})
```

### 2. 새로운 라우트 이름 추가

**Step 1**: `src/constants/routes.js`에 상수 추가
```js
export const ROUTE_NAMES = {
  // ... 기존
  SELLER_ORDER_RETURN_LIST: 'seller-order-return-list'
}
```

**Step 2**: `src/router/routes/seller.js`에 라우트 정의
```js
{
  path: 'orders/return',
  name: ROUTE_NAMES.SELLER_ORDER_RETURN_LIST,
  component: OrderReturnListPage,
  meta: { layout: 'AppLayout', roles: [ROLES.SELLER] }
}
```

### 3. 새로운 Role 추가 (거의 하지 않음)

백엔드 API 스펙 변경이 필요하므로 팀 협의 후 진행합니다.

---

## 동기화 체크리스트

상수를 수정할 때마다 다음 항목들을 확인하세요:

### 상태 상수 수정 시

- [ ] `src/constants/status.js` 수정
- [ ] `src/components/common/StatusBadge.vue` → `statusLabel` MAP 동기화
- [ ] `src/components/common/StatusBadge.vue` → `statusColor` MAP 동기화
- [ ] API 응답 구조 확인 (백엔드와 동일한 값 사용)
- [ ] 필요시 `src/utils/format.js` 포맷팅 함수 추가

### 라우트 이름 추가 시

- [ ] `src/constants/routes.js` 추가
- [ ] `src/router/routes/*.js`에 라우트 정의
- [ ] 라우터 가드 (meta) 설정
- [ ] 네비게이션 사용처에서 새 이름으로 변경

### Role 수정 시 (거의 없음)

- [ ] `src/constants/roles.js` 수정
- [ ] `src/router/index.js` 네비게이션 가드 수정
- [ ] `src/views/` 폴더 구조 추가
- [ ] `src/components/` 폴더 구조 추가
- [ ] 라우터 메타 정보 업데이트

---

## 참고 자료

- [Vue Router 네비게이션](https://router.vuejs.org/guide/essentials/navigation.html)
- [상수 명명 규칙 (BEM, kebab-case)](https://en.bem.info/methodology/naming-convention/)
- DIRECTORY.md — 전체 폴더 구조 확인
- CLAUDE.md — 프로젝트 전체 아키텍처 가이드
