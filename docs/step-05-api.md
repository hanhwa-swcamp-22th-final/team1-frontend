# API 레이어 문서

> **한 줄 요약**: Axios 인스턴스 설정, 인터셉터 처리, API 함수 작성 방법 및 에러 처리 패턴 완전 가이드

## 목차
- [파일 구조](#파일-구조)
- [Axios 인스턴스 (instance.js)](#axios-인스턴스-instancejs)
- [인터셉터 흐름](#인터셉터-흐름)
- [API 파일 작성 가이드](#api-파일-작성-가이드)
- [에러 처리](#에러-처리)
- [인증 및 테넌트 처리](#인증-및-테넌트-처리)
- [사용 패턴 및 Best Practices](#사용-패턴-및-best-practices)
- [참고 자료](#참고-자료)

---

## 파일 구조

```
src/api/
├── instance.js            ← Axios 인스턴스 (공통 인터셉터 정의)
│   └── baseURL, JWT 토큰 자동 주입, X-Tenant-Code 헤더 등
│
├── member.js              ← 로그인, 계정, 테넌트, RBAC (팀원 작업)
│   ├── login()
│   ├── getProfile()
│   ├── changePassword()
│   └── ...
│
├── wms.js                 ← 창고, 재고, ASN, 로케이션 (팀원 작업)
│   ├── getWarehouses()
│   ├── getInventory()
│   ├── submitASN()
│   └── ...
│
├── order.js               ← 주문 등록, 조회, 출고 (팀원 작업)
│   ├── createOrder()
│   ├── getOrders()
│   ├── updateOrderStatus()
│   └── ...
│
├── notification.js        ← 인앱 알림 (팀원 작업)
│   ├── getNotifications()
│   ├── markAsRead()
│   └── ...
│
└── integration.js         ← Amazon SP-API, 마진 시뮬레이터 (팀원 작업)
    ├── getAmazonAuthURL()
    ├── getProductMargin()
    └── ...
```

---

## Axios 인스턴스 (instance.js)

### 파일 내용 개요

```js
// src/api/instance.js
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { ROUTE_NAMES } from '@/constants'

const baseURL = import.meta.env.VITE_API_BASE_URL

const instance = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 요청 인터셉터
instance.interceptors.request.use(
  (config) => {
    // JWT 토큰 자동 주입
    // X-Tenant-Code 헤더 주입
    return config
  },
  (error) => Promise.reject(error)
)

// 응답 인터셉터
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 처리: 로그인 페이지로 리다이렉트
    // 기타 에러: Promise.reject
    return Promise.reject(error)
  }
)

export default instance
```

### 상세 구현

#### 1. Axios 인스턴스 생성

```js
const baseURL = import.meta.env.VITE_API_BASE_URL

const instance = axios.create({
  baseURL: baseURL,        // '.env.local'에서 로드: http://localhost:8080/api
  timeout: 10000,          // 10초 타임아웃
  headers: {
    'Content-Type': 'application/json'
  }
})
```

#### 2. 요청 인터셉터 (JWT + 테넌트 코드)

```js
instance.interceptors.request.use(
  (config) => {
    const auth = useAuthStore()

    // JWT 토큰 자동 주입
    if (auth.token) {
      config.headers.Authorization = `Bearer ${auth.token}`
    }

    // X-Tenant-Code 헤더 자동 주입
    if (auth.tenantCode) {
      config.headers['X-Tenant-Code'] = auth.tenantCode
    }

    return config
  },
  (error) => Promise.reject(error)
)
```

**동작 흐름**:
```
[API 함수 호출]
   ↓
[인스턴스.post('/orders', data)]
   ↓
[요청 인터셉터 실행]
   ├─ Authorization 헤더 추가
   │  Header: "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   │
   ├─ X-Tenant-Code 헤더 추가
   │  Header: "X-Tenant-Code: warehouse-001"
   │
   └─ config 반환
   ↓
[백엔드 서버로 전송]
   POST http://localhost:8080/api/orders
   Headers: {
     Authorization: Bearer ...,
     X-Tenant-Code: warehouse-001,
     Content-Type: application/json
   }
```

#### 3. 응답 인터셉터 (에러 처리)

```js
instance.interceptors.response.use(
  (response) => {
    // 2xx 상태 코드: 그대로 반환
    return response
  },
  (error) => {
    const ui = useUiStore()
    const router = useRouter()

    // 401 Unauthorized: JWT 만료 또는 무효
    if (error.response?.status === 401) {
      const auth = useAuthStore()
      auth.logout()  // 로그인 상태 초기화
      router.push({ name: ROUTE_NAMES.LOGIN })
      return Promise.reject(error)
    }

    // 403 Forbidden: 권한 없음
    if (error.response?.status === 403) {
      router.push({ name: ROUTE_NAMES.FORBIDDEN })
      return Promise.reject(error)
    }

    // 기타 에러: 호출한 쪽에서 처리
    return Promise.reject(error)
  }
)
```

**에러 처리 흐름**:
```
[백엔드 응답]
   ├─ 200-299 ✅
   │  응답 그대로 반환
   │
   ├─ 401 🔐
   │  localStorage 삭제 → /login으로 리다이렉트
   │
   ├─ 403 🚫
   │  /forbidden으로 리다이렉트
   │
   └─ 기타 (4xx, 5xx)
      호출한 컴포넌트에서 catch로 처리
```

---

## 인터셉터 흐름

### 완전한 요청/응답 흐름

```
┌──────────────────────────────────────────────────────────────┐
│ 1. View/Component/Store에서 API 함수 호출                      │
│    const res = await getOrders({ page: 1 })                 │
└─────────────────────────┬──────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. API 함수 (src/api/order.js)                                │
│    return instance.get('/orders', { params })               │
└─────────────────────────┬──────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. 요청 인터셉터 (instance.interceptors.request)               │
│    ├─ Authorization 헤더 추가                                 │
│    ├─ X-Tenant-Code 헤더 추가                                │
│    └─ config 반환                                           │
└─────────────────────────┬──────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. 백엔드 HTTP 요청                                           │
│    GET http://localhost:8080/api/orders?page=1              │
│    Headers: {                                               │
│      Authorization: Bearer ...,                            │
│      X-Tenant-Code: warehouse-001,                         │
│      Content-Type: application/json                        │
│    }                                                        │
└─────────────────────────┬──────────────────────────────────┘
                          ↓
     ┌────────────────────────────────┬────────────────────────┐
     │                                │                        │
     ↓ (성공)                         ↓ (실패)                 ↓ (실패)
┌─────────────┐             ┌──────────────────┐      ┌────────────┐
│ 200 OK      │             │ 401 Unauthorized │      │ 403 Error  │
│ Response    │             │                  │      │            │
└────┬────────┘             └────┬─────────────┘      └────┬───────┘
     │                           │                        │
     ↓                           ↓                        ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. 응답 인터셉터 (instance.interceptors.response)              │
│    ├─ 2xx: response 그대로 반환                              │
│    ├─ 401: logout() + /login으로 리다이렉트                  │
│    └─ 403: /forbidden으로 리다이렉트                        │
└─────────────────────────┬──────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. API 함수 반환                                             │
│    return response (또는 Promise.reject(error))             │
└─────────────────────────┬──────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 7. View/Component/Store에서 처리                             │
│    try-catch로 성공/실패 처리                               │
│    - 성공: res.data 사용                                    │
│    - 실패: error 캐치                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## API 파일 작성 가이드

각 API 파일(`member.js`, `wms.js`, `order.js` 등)의 작성 방법을 설명합니다.

### 기본 패턴

```js
// src/api/order.js
import instance from './instance.js'

/**
 * 주문 목록 조회
 * @param {{ page?: number, size?: number, status?: string }} params
 * @returns {Promise<{ data: Array, total: number }>}
 */
export async function getOrders(params = {}) {
  const response = await instance.get('/orders', { params })
  return response.data
}

/**
 * 주문 생성
 * @param {{ items: Array, shippingAddress: string }} payload
 * @returns {Promise<{ id: string, status: string }>}
 */
export async function createOrder(payload) {
  const response = await instance.post('/orders', payload)
  return response.data
}

/**
 * 주문 상태 업데이트
 * @param {string} orderId
 * @param {{ status: string }} payload
 * @returns {Promise<{ id: string, status: string }>}
 */
export async function updateOrderStatus(orderId, payload) {
  const response = await instance.patch(`/orders/${orderId}`, payload)
  return response.data
}

/**
 * 주문 삭제
 * @param {string} orderId
 * @returns {Promise<void>}
 */
export async function deleteOrder(orderId) {
  await instance.delete(`/orders/${orderId}`)
}
```

### JSDoc 작성 규칙

모든 함수는 JSDoc 주석을 포함해야 합니다:

```js
/**
 * [함수 설명] - 한 줄 설명
 * @param {타입} paramName - 파라미터 설명
 * @returns {Promise<타입>} - 반환값 설명
 */
```

예시:
```js
/**
 * 사용자 프로필 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<{ id: string, name: string, email: string }>}
 */
export async function getUserProfile(userId) {
  const response = await instance.get(`/users/${userId}`)
  return response.data
}
```

### 요청 메서드별 사용법

#### GET (조회)

```js
// 단순 GET
export async function getInventory() {
  const response = await instance.get('/inventory')
  return response.data
}

// 쿼리 파라미터 포함
export async function getWarehouseInventory(params) {
  const response = await instance.get('/inventory/warehouse', { params })
  return response.data
}

// 예시:
// getWarehouseInventory({ warehouseId: '123', page: 1 })
// → GET /inventory/warehouse?warehouseId=123&page=1
```

#### POST (생성)

```js
// 요청 body 포함
export async function createOrder(orderData) {
  const response = await instance.post('/orders', orderData)
  return response.data
}

// 예시:
// createOrder({ items: [...], totalPrice: 50000 })
// → POST /orders with body { items: [...] }
```

#### PATCH (부분 업데이트)

```js
// 특정 필드만 업데이트
export async function updateOrderStatus(orderId, status) {
  const response = await instance.patch(`/orders/${orderId}`, { status })
  return response.data
}

// 예시:
// updateOrderStatus('order-123', 'SHIPPED')
// → PATCH /orders/order-123 with body { status: 'SHIPPED' }
```

#### DELETE (삭제)

```js
// 삭제
export async function deleteOrder(orderId) {
  await instance.delete(`/orders/${orderId}`)
}

// 예시:
// deleteOrder('order-123')
// → DELETE /orders/order-123
```

### 파일 organization 예시 (member.js)

```js
// src/api/member.js
import instance from './instance.js'

/**
 * ==================
 * 인증 관련 (Authentication)
 * ==================
 */

/**
 * 로그인
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ token: string, user: { ... } }>}
 */
export async function login(credentials) {
  const response = await instance.post('/auth/login', credentials)
  return response.data
}

/**
 * 로그아웃
 */
export async function logout() {
  await instance.post('/auth/logout')
}

/**
 * ==================
 * 계정 관리 (Account)
 * ==================
 */

/**
 * 내 프로필 조회
 */
export async function getMyProfile() {
  const response = await instance.get('/me')
  return response.data
}

/**
 * 비밀번호 변경
 * @param {{ oldPassword: string, newPassword: string }} payload
 */
export async function changePassword(payload) {
  await instance.post('/me/password', payload)
}

/**
 * ==================
 * 테넌트 (Tenant)
 * ==================
 */

/**
 * 테넌트 목록 조회
 */
export async function getTenants() {
  const response = await instance.get('/tenants')
  return response.data
}
```

---

## 에러 처리

### 컴포넌트에서의 에러 처리

```vue
<script setup>
import { ref } from 'vue'
import { createOrder } from '@/api/order'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const orderForm = ref({ /* ... */ })
const isLoading = ref(false)

const handleSubmit = async () => {
  isLoading.value = true
  try {
    const result = await createOrder(orderForm.value)
    // 성공 처리
    console.log('주문 생성 성공:', result)
    // UI 피드백
    ui.showToast('주문이 등록되었습니다', 'success')
  } catch (error) {
    // 에러 처리
    const message = error.response?.data?.message ?? '주문 등록에 실패했습니다'
    console.error('주문 생성 실패:', error)
    ui.showToast(message, 'error')
  } finally {
    isLoading.value = false
  }
}
</script>
```

### 에러 객체 구조

```js
// error.response가 있는 경우 (서버 응답)
error.response.status      // 400, 401, 500 등
error.response.data.message // 백엔드에서 보낸 에러 메시지
error.response.data.code    // 에러 코드 (선택사항)
error.response.headers      // 응답 헤더

// error.response가 없는 경우 (네트워크 에러, 타임아웃)
error.message               // "Network Error", "timeout"
error.code                  // "ECONNABORTED", "ENOTFOUND"
```

### 에러 처리 패턴 (고급)

```js
// src/utils/api-error.js
export class ApiError extends Error {
  constructor(error) {
    super()
    this.status = error.response?.status
    this.message = error.response?.data?.message || error.message
    this.code = error.response?.data?.code
    this.originalError = error
  }

  isUnauthorized() {
    return this.status === 401
  }

  isForbidden() {
    return this.status === 403
  }

  isNotFound() {
    return this.status === 404
  }

  isValidationError() {
    return this.status === 400
  }
}

// src/api/order.js에서 사용
import { ApiError } from '@/utils/api-error'

export async function createOrder(payload) {
  try {
    const response = await instance.post('/orders', payload)
    return response.data
  } catch (error) {
    throw new ApiError(error)
  }
}

// 컴포넌트에서 사용
try {
  await createOrder(data)
} catch (error) {
  if (error.isValidationError()) {
    // 유효성 검사 실패 (400)
  } else if (error.isUnauthorized()) {
    // 인증 실패 (401)
  } else {
    // 기타 에러
  }
}
```

---

## 인증 및 테넌트 처리

### JWT 토큰 저장 및 로드

Pinia store (`src/stores/auth.js`)에서 JWT 토큰을 관리합니다:

```js
// src/stores/auth.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as apiLogin } from '@/api/member'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(null)
  const user = ref(null)
  const tenantCode = ref(null)

  // API 호출
  async function login(email, password) {
    const data = await apiLogin({ email, password })
    token.value = data.token
    user.value = data.user
    tenantCode.value = data.tenantCode
  }

  function logout() {
    token.value = null
    user.value = null
    tenantCode.value = null
  }

  return { token, user, tenantCode, login, logout }
}, {
  persist: {
    enabled: true,
    strategies: [{
      key: 'conk-auth',
      storage: localStorage,
      paths: ['token', 'user', 'tenantCode']
    }]
  }
})
```

**주요 특징**:
- `pinia-plugin-persistedstate` 사용으로 새로고침 후에도 토큰 유지
- 인터셉터가 자동으로 `token`과 `tenantCode` 읽음

### 테넌트 코드 (X-Tenant-Code)

멀티테넌트 시스템에서 각 API 요청은 테넌트를 구분하기 위해 헤더에 테넌트 코드를 포함합니다:

```js
// src/api/instance.js에서 자동 처리
if (auth.tenantCode) {
  config.headers['X-Tenant-Code'] = auth.tenantCode
}
```

컴포넌트에서는 별도 처리 불필요:
```js
// ✅ 올바른 방법 (헤더는 인터셉터가 자동으로 추가)
const orders = await getOrders()

// ❌ 잘못된 방법 (헤더 수동 추가)
const orders = await instance.get('/orders', {
  headers: { 'X-Tenant-Code': '...' }
})
```

---

## 사용 패턴 및 Best Practices

### 1. API 함수는 항상 src/api/에서 import

```vue
<script setup>
// ✅ 올바른 방법
import { getOrders, createOrder } from '@/api/order'

// ❌ 금지: instance 직접 사용
import instance from '@/api/instance'
const orders = await instance.get('/orders')

// ❌ 금지: fetch 사용
const orders = await fetch('http://localhost:8080/api/orders')
</script>
```

### 2. Store에서 API 호출 후 상태 저장

```js
// src/stores/order.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getOrders as fetchOrders } from '@/api/order'

export const useOrderStore = defineStore('order', () => {
  const orders = ref([])
  const loading = ref(false)

  async function loadOrders() {
    loading.value = true
    try {
      orders.value = await fetchOrders()
    } catch (error) {
      console.error('주문 로드 실패:', error)
    } finally {
      loading.value = false
    }
  }

  return { orders, loading, loadOrders }
})
```

### 3. 컴포넌트에서 Store 함수 호출

```vue
<script setup>
import { useOrderStore } from '@/stores/order'

const orderStore = useOrderStore()

// Composition API
const { orders, loading } = orderStore
const loadOrders = async () => {
  await orderStore.loadOrders()
}
</script>

<template>
  <div>
    <button @click="loadOrders" :disabled="loading">
      {{ loading ? '로딩 중...' : '주문 로드' }}
    </button>
    <ul>
      <li v-for="order in orders" :key="order.id">
        {{ order.id }}
      </li>
    </ul>
  </div>
</template>
```

### 4. 로딩 상태 관리

```js
// src/stores/ui.js
export const useUiStore = defineStore('ui', () => {
  const isLoading = ref(false)

  const setLoading = (value) => {
    isLoading.value = value
  }

  return { isLoading, setLoading }
})
```

컴포넌트에서 사용:
```vue
<script setup>
import { useUiStore } from '@/stores/ui'
import { createOrder } from '@/api/order'

const ui = useUiStore()

const handleSubmit = async () => {
  ui.setLoading(true)
  try {
    await createOrder(formData)
  } finally {
    ui.setLoading(false)
  }
}
</script>
```

### 5. 폼 검증 후 API 호출

```vue
<script setup>
import { reactive } from 'vue'
import { validateEmail } from '@/utils/validate'
import { createOrder } from '@/api/order'

const form = reactive({
  email: '',
  quantity: 0
})

const errors = reactive({})

const handleSubmit = async () => {
  // 1. 폼 검증
  errors.email = validateEmail(form.email) ? '' : '유효한 이메일을 입력하세요'
  errors.quantity = form.quantity > 0 ? '' : '수량은 1개 이상이어야 합니다'

  if (errors.email || errors.quantity) {
    return  // 검증 실패
  }

  // 2. API 호출
  try {
    await createOrder(form)
  } catch (error) {
    errors.general = '주문 생성에 실패했습니다'
  }
}
</script>
```

### 6. 페이지네이션 처리

```vue
<script setup>
import { ref, computed } from 'vue'
import { getOrders } from '@/api/order'

const page = ref(1)
const pageSize = ref(10)
const orders = ref([])
const totalCount = ref(0)

const loadOrders = async () => {
  const response = await getOrders({
    page: page.value,
    size: pageSize.value
  })
  orders.value = response.data
  totalCount.value = response.total
}

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

const goToPage = (pageNum) => {
  page.value = pageNum
  loadOrders()
}
</script>

<template>
  <div>
    <table>
      <tr v-for="order in orders" :key="order.id">
        <td>{{ order.id }}</td>
      </tr>
    </table>

    <pagination
      :current="page"
      :total="totalPages"
      @change="goToPage"
    />
  </div>
</template>
```

### 7. 데이터 변환 (Serialization)

백엔드 응답 형식과 프론트엔드 형식이 다를 경우:

```js
// src/api/order.js
export async function getOrders(params) {
  const response = await instance.get('/orders', { params })

  // 응답 데이터 변환
  return {
    orders: response.data.orders.map(order => ({
      id: order.id,
      orderNo: order.order_number,  // snake_case → camelCase
      createdAt: new Date(order.created_at),
      total: parseFloat(order.total_price)
    })),
    total: response.data.total_count
  }
}
```

---

## 참고 자료

- [Axios 공식 문서](https://axios-http.com/)
- [REST API 설계 모범 사례](https://restfulapi.net/)
- [JWT (JSON Web Token) 이해](https://jwt.io/introduction)
- [멀티테넌트 SaaS 아키텍처](https://en.wikipedia.org/wiki/Multitenancy)
- [Pinia 공식 문서](https://pinia.vuejs.org/)
