# 패키지 목록 및 역할

> **한 줄 요약**: CONK 프론트엔드에서 사용하는 모든 npm 패키지와 선택 이유를 정리한 레퍼런스

## 목차

- [프로덕션 의존성](#프로덕션-의존성)
- [개발 의존성](#개발-의존성)
- [Node.js 요구사항](#nodejs-요구사항)
- [패키지 추가 정책](#패키지-추가-정책)

---

## 프로덕션 의존성

| 패키지                           | 버전      | 역할           | 선택 이유                                                 |
|-------------------------------|---------|--------------|-------------------------------------------------------|
| `vue`                         | ^3.5.29 | UI 프레임워크     | Composition API + `<script setup>` 지원, Vue 2 대비 성능 향상 |
| `vue-router`                  | ^4.6.4  | 클라이언트 라우팅    | Vue 공식 라우터, 네비게이션 가드, 동적 라우트 로딩 지원                    |
| `pinia`                       | ^3.0.4  | 상태 관리        | Vuex 대체, Composition API 기반, 타입 안전, DevTools 지원       |
| `pinia-plugin-persistedstate` | ^4.7.1  | Pinia 상태 영속화 | localStorage/sessionStorage 자동 동기화 (새로고침 후 state 유지)  |
| `axios`                       | ^1.13.6 | HTTP 클라이언트   | 인터셉터 지원, 타임아웃, 요청 취소, 체계적 에러 처리                       |
| `xlsx`                        | ^0.18.5 | Excel 파싱/생성  | 순수 JS 구현, 서버 요청 불필요, 클라이언트 측 처리 가능                    |

### 각 패키지 상세 설명

#### Vue 3 (^3.5.29)

- **Composition API**: `<script setup>` 문법으로 간결한 컴포넌트 구성
- **성능**: Vue 2 대비 번들 크기 감소, 렌더링 성능 향상
- **사용 예**:
  ```vue
  <script setup>
  import { ref, computed } from 'vue'

  const count = ref(0)
  const doubled = computed(() => count.value * 2)
  </script>
  ```

#### Vue Router 4 (^4.6.4)

- **네비게이션 가드**: 인증 확인, Role 기반 접근 제어
- **동적 라우트**: 메뉴 권한에 따른 라우트 로딩
- **사용 예**:
  ```js
  // src/router/index.js
  router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !auth.isLoggedIn) {
      next('/login')
    }
  })
  ```

#### Pinia (^3.0.4)

- **Composition API 기반**: Store를 JS 함수로 정의
- **플러그인 생태계**: persistedstate 플러그인으로 자동 영속화
- **사용 예**:
  ```js
  // src/stores/auth.js
  export const useAuthStore = defineStore('auth', () => {
    const token = ref(null)
    const setToken = (t) => { token.value = t }
    return { token, setToken }
  })
  ```

#### pinia-plugin-persistedstate (^4.7.1)

- **자동 동기화**: Store 변경 시 자동으로 localStorage 업데이트
- **새로고침 복구**: 페이지 새로고침 후에도 상태 유지
- **사용 예**:
  ```js
  // pinia.js
  app.use(createPinia().use(createPersistedState({
    key: 'conk-auth',
    paths: ['token', 'user']
  })))
  ```

#### Axios (^1.13.6)

- **인터셉터**: 요청/응답에 JWT 토큰, 테넌트 코드 자동 주입
- **취소 토큰**: 요청 진행 중 취소 가능
- **사용 예**:
  ```js
  // src/api/instance.js
  instance.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${token}`
    config.headers['X-Tenant-Code'] = tenantCode
    return config
  })
  ```

#### xlsx (^0.18.5)

- **클라이언트 측 Excel 처리**: 백엔드 API 호출 없이 브라우저에서 직접 처리
- **용도**:
    - 재고 대량 업로드 (Excel → JSON)
    - 주문 내역 다운로드 (JSON → Excel)
- **사용 예**:
  ```js
  import * as XLSX from 'xlsx'
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, 'inventory.xlsx')
  ```

---

## 개발 의존성

| 패키지                        | 버전     | 역할                        |
|----------------------------|--------|---------------------------|
| `vite`                     | ^7.3.1 | 빌드 도구, 개발 서버 (HMR 지원)     |
| `@vitejs/plugin-vue`       | ^6.0.4 | Vue SFC (.vue 파일) 변환 플러그인 |
| `vite-plugin-vue-devtools` | ^8.0.6 | Vue DevTools 브라우저 확장 통합   |

### Vite (^7.3.1)

- **개발 속도**: ES 모듈 기반 빌드로 HMR(Hot Module Replacement) 초고속
- **프로덕션 최적화**: Rollup 기반 번들링으로 최소 번들 크기
- **설정**: `vite.config.js`에서 `@` alias 등 커스터마이징

### @vitejs/plugin-vue (^6.0.4)

- **SFC 지원**: `<template>`, `<script>`, `<style>` 블록을 JS로 변환
- **필수 플러그인**: Vite에서 Vue를 사용하려면 반드시 필요

### vite-plugin-vue-devtools (^8.0.6)

- **디버깅 편의**: 브라우저의 Vue DevTools 탭에서 컴포넌트 상태 확인
- **개발 환경 전용**: 프로덕션 빌드에는 미포함

---

## Node.js 요구사항

```json
"engines": {
  "node": "^20.19.0 || >=22.12.0"
}
```

### 요구사항 설명

- **Node 20.x**: LTS 버전, 안정성과 장기 지원
- **Node 22.x 이상**: 최신 안정 버전, 신규 JavaScript 기능 지원

### 버전 확인

```bash
node --version
# v20.19.0 또는 v22.12.0 이상
```

### 버전 업그레이드

nvm 사용 시:

```bash
nvm install 22
nvm use 22
node --version
```

---

## 패키지 추가 정책

### 금지된 패키지

다음 패키지는 **절대 추가하면 안 됩니다**:

| 종류            | 패키지 예                           | 이유                                      |
|---------------|---------------------------------|-----------------------------------------|
| UI 컴포넌트 라이브러리 | Element Plus, Vuetify, PrimeVue | CONK 커스텀 디자인 시스템 유지 필요                  |
| CSS 프레임워크     | Tailwind CSS, Bootstrap         | `src/assets/styles/variables.css` 기반 운영 |
| 상태관리 라이브러리    | Vuex, Redux                     | Pinia만 사용하도록 통일                         |

### 새 패키지 추가 절차

1. 팀 채널에서 **추가 이유와 영향도** 협의
2. 승인 후에만 `npm install` 실행
3. `package-lock.json`과 함께 커밋

### 추가 권장 패키지 (사전 승인됨)

| 패키지                   | 사용 시점              |
|-----------------------|--------------------|
| `date-fns` 또는 `dayjs` | 날짜 포맷팅이 필요한 경우     |
| `lodash-es`           | 유틸리티 함수가 많이 필요한 경우 |

---

## 참고 자료

- [Vue 3 공식 문서](https://vuejs.org/)
- [Pinia 공식 문서](https://pinia.vuejs.org/)
- [Vite 공식 문서](https://vitejs.dev/)
- [Axios 문서](https://axios-http.com/)
- [SheetJS (xlsx) 문서](https://sheetjs.com/)
