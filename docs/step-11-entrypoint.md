# 앱 진입점 문서

> **한 줄 요약**: main.js에서 Vue, Pinia, Router를 올바른 순서로 등록하고, App.vue를 마운트하는 과정.

## 목차 (Table of Contents)

- [main.js 구조](#mainjs-구조)
- [플러그인 등록 순서](#플러그인-등록-순서)
- [App.vue 구조](#appvue-구조)
- [인증 흐름](#인증-흐름)
- [자주 묻는 질문](#자주-묻는-질문)

---

## main.js 구조

### 전체 코드 (src/main.js)

```js
import './assets/main.css'              // (1) CSS 최우선 로드
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedstate from 'pinia-plugin-persistedstate'
import router from '@/router'
import App from './App.vue'

// (2) Pinia 인스턴스 생성
const pinia = createPinia()

// (3) Persist 플러그인 등록 (반드시 use(pinia) 전에)
pinia.use(piniaPersistedstate)

// (4) Vue 앱 생성 및 플러그인 등록 순서 준수
createApp(App)
  .use(pinia)              // Pinia 등록 (라우터보다 먼저)
  .use(router)             // Router 등록
  .mount('#app')           // DOM에 마운트
```

### 단계별 설명

#### (1) CSS 최우선 로드

```js
import './assets/main.css'
```

- 모든 import 문 최상단에 배치
- 글로벌 스타일 정의 (reset, 기본 색상, 타이포그래피)
- Pinia 스토어나 라우터보다 먼저 로드되어야 함

#### (2) Pinia 인스턴스 생성

```js
const pinia = createPinia()
```

- Vue 앱 생성 전에 Pinia 인스턴스 생성
- 이후 플러그인 등록 가능

#### (3) Persist 플러그인 등록

```js
pinia.use(piniaPersistedstate)
```

**⚠️ 중요**: `.use(pinia)` 호출 **전에** 등록 필요

- `pinia.use()` — Pinia 플러그인 등록 메서드
- 플러그인이 등록되어야 `useAuthStore()` 등 호출 시 localStorage 자동 저장 동작
- 순서 반대 시 persist 동작 안 됨

#### (4) Vue 앱에 플러그인 등록

```js
createApp(App)
  .use(pinia)    // Pinia 먼저
  .use(router)   // Router 나중
  .mount('#app')
```

**플러그인 등록 순서 규칙**:

1. **Pinia 먼저**: 라우터 가드에서 스토어 접근할 수 있도록
2. **Router 나중**: 라우터 가드 내에서 Pinia 스토어 사용 가능

### 순서가 잘못되면?

```js
// ❌ 잘못된 순서 1: persist 플러그인을 .use(pinia) 후에 등록
const pinia = createPinia()
createApp(App).use(pinia)  // 먼저 등록!
pinia.use(piniaPersistedstate)  // 나중 등록 → 동작 안 함

// ❌ 잘못된 순서 2: Router를 Pinia보다 먼저 등록
createApp(App)
  .use(router)   // 먼저 등록 → 라우터 가드에서 스토어 미접근 가능
  .use(pinia)    // 나중 등록

// ✅ 올바른 순서
const pinia = createPinia()
pinia.use(piniaPersistedstate)
createApp(App)
  .use(pinia)
  .use(router)
  .mount('#app')
```

---

## 플러그인 등록 순서

### 플러그인 등록의 중요성

Vue 플러그인은 `install()` 메서드를 호출하여 Vue 앱에 기능을 추가합니다.

```
createApp(App)
    ↓
  .use(pinia)      ← Pinia 플러그인 install 호출
                     → Vue.prototype.$pinia 설정
                     → useAuthStore() 사용 가능
    ↓
  .use(router)     ← Router 플러그인 install 호출
                     → Vue.prototype.$router 설정
                     → beforeEach 가드에서 useAuthStore() 호출 가능
    ↓
  .mount('#app')   ← DOM에 마운트
```

### 라우터 가드에서 Pinia 접근

```js
// src/router/index.js
import { useAuthStore } from '@/stores/auth'

router.beforeEach((to, from, next) => {
  // useAuthStore() 호출
  const auth = useAuthStore()

  if (!auth.isLoggedIn && !to.meta.public) {
    // 미로그인 → 로그인 페이지로 리다이렉트
    return next({ name: 'login' })
  }

  next()
})
```

**이 코드가 정상 동작하려면**:

- Pinia가 Vue 앱에 등록되어 있어야 함 (`.use(pinia)` 호출됨)
- 라우터가 등록될 때 Pinia가 이미 준비되어 있어야 함

따라서 **반드시 Pinia → Router 순서**로 등록해야 합니다.

### Persist 플러그인의 특수성

```js
// persist 플러그인을 먼저 등록하지 않으면?
const pinia = createPinia()
createApp(App).use(pinia)  // Pinia 등록

// 이후에 persist 플러그인을 등록
pinia.use(piniaPersistedstate)

// 결과: localStorage 자동 저장 안 됨!
// useAuthStore().setAuth(...) 호출 후 localStorage 확인
// → 'conk-auth' 키 없음 (저장 안 됨)
```

**이유**: Pinia 플러그인은 **Pinia 인스턴스 생성 후, Vue 앱 등록 전에** 모두 등록되어야 그 이후의 스토어 접근에 적용됩니다.

---

## App.vue 구조

### 전체 코드 (src/App.vue)

```vue
<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>
```

### 최소 구조의 의미

- **RouterView만 렌더링**: 라우터가 매칭된 컴포넌트를 여기에 주입
- **레이아웃은 View에서**: 각 View가 필요시 `<AppLayout>`을 감싸서 사용

### 렌더링 흐름

```
<App.vue>
  ↓
  <RouterView />
    ↓ (라우터 매칭)
    ↓
    <SpecificView.vue>  (예: OrderListView.vue)
      ↓
      <AppLayout>       (인증된 화면에서만)
        ↓
        <Sidebar />     (자동 마운트)
        <Header />      (자동 마운트)
        <slot />        (View의 본문)
      </AppLayout>
    </SpecificView.vue>
```

### 왜 App.vue가 최소화되어 있나?

```
장점:
1. 유연성: 로그인 페이지와 대시보드 레이아웃이 다를 수 있음
2. 단순성: App.vue는 라우팅만 담당
3. 확장성: 향후 모달/토스트 등 전역 컴포넌트 추가 시 여기에 추가

예시:
<App.vue>
  <RouterView />
  <GlobalModal />      ← 추가 가능
  <GlobalToast />      ← 추가 가능
</App.vue>
```

---

## 인증 흐름

### 전체 진입 흐름

```
1. 브라우저가 index.html 요청
         ↓
2. main.js 실행
   - CSS 로드
   - Vue 앱 생성
   - Pinia 등록 (persist 플러그인 포함)
   - Router 등록
   - #app DOM 요소에 마운트
         ↓
3. App.vue 렌더링
   - <RouterView /> 마운트
         ↓
4. Router 시작
   - 현재 URL을 라우트와 매칭
   - beforeEach 가드 실행 (4단계)
         ↓
5. 가드 통과 여부에 따라
   - 통과 → View 컴포넌트 렌더링
   - 실패 → 리다이렉트
         ↓
6. View 컴포넌트 마운트
   - 인증된 화면 → AppLayout 감싸기
   - 로그인 화면 → 자체 레이아웃
```

### 라우터 가드의 4단계

**src/router/index.js**에서:

```js
router.beforeEach((to, from) => {
  const auth = useAuthStore()

  // [가드 #1] 로그인 중복 접근 방지
  if (auth.isLoggedIn && to.name === ROUTE_NAMES.LOGIN) {
    return router.replace({
      name: DASHBOARD_BY_ROLE[auth.role]
    })
  }

  // [가드 #2] 인증 필요 페이지 보호
  if (!to.meta.public && !auth.isLoggedIn) {
    return router.replace({
      name: ROUTE_NAMES.LOGIN,
      query: { redirect: to.fullPath }
    })
  }

  // [가드 #3] 임시 비밀번호 강제 변경
  if (auth.user?.status === 'TEMP_PASSWORD' &&
      to.name !== ROUTE_NAMES.CHANGE_PASSWORD) {
    return router.replace({
      name: ROUTE_NAMES.CHANGE_PASSWORD
    })
  }

  // [가드 #4] Role 검증
  if (to.meta.role && to.meta.role !== auth.role) {
    return router.replace({
      name: ROUTE_NAMES.FORBIDDEN
    })
  }

  // 모든 가드 통과
})
```

### 시나리오 별 흐름

#### 시나리오 1: 비로그인 사용자가 /seller/orders 접근

```
1. URL: /seller/orders 입력
         ↓
2. 라우터 beforeEach 가드 시작
         ↓
3. 가드 #1: auth.isLoggedIn = false → 통과
         ↓
4. 가드 #2: to.meta.public = false && !auth.isLoggedIn
             → 조건 일치! 리다이렉트
             return router.replace({
               name: 'login',
               query: { redirect: '/seller/orders' }
             })
         ↓
5. /login?redirect=/seller/orders로 이동
         ↓
6. LoginView.vue 렌더링
         ↓
7. 로그인 성공 후
   auth.setAuth(response.data)
         ↓
8. route.query.redirect 확인
   if (redirect) {
     router.push(redirect)  // /seller/orders로 이동
   }
```

#### 시나리오 2: SELLER가 /wh-manager/dashboard 접근

```
1. URL: /wh-manager/dashboard 입력
         ↓
2. 라우터 beforeEach 가드 시작
         ↓
3. 가드 #1: auth.isLoggedIn = true, to.name ≠ 'login' → 통과
         ↓
4. 가드 #2: to.meta.public = false && auth.isLoggedIn = true → 통과
         ↓
5. 가드 #3: auth.user.status ≠ 'TEMP_PASSWORD' → 통과
         ↓
6. 가드 #4: to.meta.role = WH_MANAGER
             auth.role = SELLER
             → 불일치! 리다이렉트
             return router.replace({
               name: ROUTE_NAMES.FORBIDDEN
             })
         ↓
7. /403 페이지 렌더링
```

#### 시나리오 3: 새 사용자 첫 로그인 (임시 비밀번호)

```
1. 로그인 성공
   auth.user.status = 'TEMP_PASSWORD'
         ↓
2. 사용자가 /seller/dashboard 접근 시도
         ↓
3. 라우터 가드 #3 동작
   auth.user.status === 'TEMP_PASSWORD' &&
   to.name !== 'change-password'
   → 조건 일치! 리다이렉트
         ↓
4. /change-password 페이지로 강제 이동
         ↓
5. 비밀번호 변경 완료
   auth.user.status = 'ACTIVE'
         ↓
6. 이제 모든 페이지 접근 가능
```

---

## 자주 묻는 질문

### Q1: useAuthStore() 호출 시 "undefined" 에러 발생

**원인**: Pinia가 Vue 앱에 등록되지 않았음.

```js
// ❌ 잘못된 main.js
const pinia = createPinia()
createApp(App).mount('#app')  // Pinia 등록 안 함!

// ✅ 올바른 main.js
const pinia = createPinia()
pinia.use(piniaPersistedstate)
createApp(App)
  .use(pinia)  // 반드시 등록
  .use(router)
  .mount('#app')
```

### Q2: localStorage에 'conk-auth' 키가 저장되지 않음

**원인**: persist 플러그인이 등록되지 않았거나 순서가 잘못됨.

```js
// ❌ 잘못된 순서 1
const pinia = createPinia()
createApp(App).use(pinia)
pinia.use(piniaPersistedstate)  // 너무 늦음!

// ❌ 잘못된 순서 2
const pinia = createPinia()
pinia.use(piniaPersistedstate)
createApp(App).use(router).use(pinia)  // Router가 먼저!

// ✅ 올바른 순서
const pinia = createPinia()
pinia.use(piniaPersistedstate)
createApp(App).use(pinia).use(router).mount('#app')
```

### Q3: 라우터 가드에서 useAuthStore() 호출 시 여전히 undefined

**원인**: Router가 등록되기 전에 가드를 호출하려고 함.

**해결**: Router 객체를 별도로 import하고, beforeEach 가드는 Router 생성 후 등록.

```js
// src/router/index.js
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 라우터 생성 후 가드 등록
router.beforeEach((to, from) => {
  // 이 시점에 Pinia가 이미 준비됨
  const auth = useAuthStore()
  // ...
})

export default router
```

### Q4: CSS가 로드되지 않은 상태에서 HTML이 렌더링됨

**원인**: `import './assets/main.css'`가 main.js 최상단에 없음.

```js
// ❌ 잘못된 위치
import { createApp } from 'vue'
import './assets/main.css'  // CSS 나중에 로드 → FOUC(Flash of Unstyled Content)

// ✅ 올바른 위치 (최상단)
import './assets/main.css'  // CSS 먼저 로드
import { createApp } from 'vue'
// ...
```

### Q5: `<AppLayout>`을 사용해야 하는데, 로그인 페이지에서는 사용하지 않나?

**정답**: 맞습니다. 로그인 페이지는 `<AppLayout>` 미사용.

```vue
<!-- LoginView.vue (AppLayout 미사용) -->
<template>
  <div class="login-page">
    <div class="login-form">
      <!-- 로그인 폼 -->
    </div>
  </div>
</template>

<!-- OrderListView.vue (AppLayout 사용) -->
<template>
  <AppLayout title="주문 목록">
    <BaseTable :columns="cols" :rows="rows" />
  </AppLayout>
</template>
```

각 View가 필요한 레이아웃을 결정합니다.

---

## 초기화 체크리스트

새 프로젝트 셋업 시 확인 항목:

- [ ] `main.js`에 `import './assets/main.css'` (최상단)
- [ ] Pinia 인스턴스 생성
- [ ] `pinia.use(piniaPersistedstate)` (`.use(pinia)` 전)
- [ ] `createApp().use(pinia)` (`.use(router)` 전)
- [ ] `createApp().use(router)`
- [ ] `router.beforeEach()` 가드 등록
- [ ] `App.vue`에서 `<RouterView />` 렌더링
- [ ] `src/router/routes/auth.js`에 로그인 라우트 정의
- [ ] 각 Role 라우트 파일에 `meta.role` 설정
- [ ] 로그인 성공 후 `auth.setAuth()` 호출

---

## 관련 문서

- [step-06-stores.md](./step-06-stores.md) — Pinia 스토어 및 persist 설정
- [step-08-router.md](./step-08-router.md) — 라우터 가드 상세 설명
- [step-10-components-layout.md](./step-10-components-layout.md) — AppLayout 컴포넌트
