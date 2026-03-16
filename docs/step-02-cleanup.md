# 초기 정리 내역

> **한 줄 요약**: Vite 스캐폴드 생성 직후 CONK 프로젝트 구조에 맞추기 위해 제거/수정한 파일 목록

## 목차

- [삭제된 파일](#삭제된-파일)
- [수정된 파일](#수정된-파일)
- [신규 추가 파일](#신규-추가-파일)
- [정리 이유](#정리-이유)

---

## 삭제된 파일

### 기본 CSS 및 로고

| 파일                    | 삭제 이유                                                                             |
|-----------------------|-----------------------------------------------------------------------------------|
| `src/assets/base.css` | CONK 디자인 시스템(`src/assets/styles/variables.css`)으로 대체. Vite 기본 스타일과 프로젝트 스타일 혼재 방지 |
| `src/assets/logo.svg` | Vite 공식 로고. CONK 브랜딩과 무관하므로 제거                                                    |

### 예시 컴포넌트

| 파일                               | 삭제 이유                         |
|----------------------------------|-------------------------------|
| `src/components/HelloWorld.vue`  | Vite 기본 예시 컴포넌트. 실제 프로젝트에 불필요 |
| `src/components/TheWelcome.vue`  | Vite 기본 랜딩 페이지 컴포넌트           |
| `src/components/WelcomeItem.vue` | Vite 기본 예시 컴포넌트               |

### 기본 아이콘 세트

| 파일                                           | 삭제 이유                                     |
|----------------------------------------------|-------------------------------------------|
| `src/components/icons/IconCommunity.vue`     | Vite 기본 아이콘 세트. CONK 프로젝트에 맞는 아이콘으로 대체 예정 |
| `src/components/icons/IconDocumentation.vue` | Vite 기본 아이콘                               |
| `src/components/icons/IconEcosystem.vue`     | Vite 기본 아이콘                               |
| `src/components/icons/IconSupport.vue`       | Vite 기본 아이콘                               |
| `src/components/icons/IconTooling.vue`       | Vite 기본 아이콘                               |

---

## 수정된 파일

### 1. src/main.js

**변경 내용**:

```diff
- import './assets/base.css'
+ import '@/assets/styles/variables.css'
+ import '@/assets/styles/transitions.css'
+ import '@/assets/main.css'

  import { createApp } from 'vue'
  import App from './App.vue'
+ import router from '@/router'
+ import { createPinia } from 'pinia'
+ import createPersistedState from 'pinia-plugin-persistedstate'

- app.mount('#app')
+ const app = createApp(App)
+ const pinia = createPinia()
+ pinia.use(createPersistedState())
+
+ app.use(pinia)
+ app.use(router)
+ app.mount('#app')
```

**이유**:

- CONK 스타일 시스템 import 추가
- Vue Router 라우팅 초기화
- Pinia 상태 관리 + persistedstate 플러그인 등록

### 2. src/App.vue

**변경 전**:

```vue
<template>
  <header>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />
    <div class="wrapper">
      <HelloWorld msg="You did it!" />
    </div>
  </header>
  <main>...</main>
</template>

<script setup>
import HelloWorld from './components/HelloWorld.vue'
</script>

<style scoped>
header { ... }
</style>
```

**변경 후**:

```vue
<template>
  <RouterView />
</template>

<script setup>
import { RouterView } from 'vue-router'
</script>

<style scoped>
/* 스타일 제거 */
</style>
```

**이유**:

- SPA 라우팅 구조에 맞춰 `<RouterView>` 사용
- 모든 페이지 콘텐츠는 라우트별 View에서 렌더링

### 3. src/assets/main.css

**변경 내용**:

```diff
- @import './base.css';
+ /* CONK 공통 reset 및 기본 스타일 */
+
+ * {
+   margin: 0;
+   padding: 0;
+   box-sizing: border-box;
+ }
+
+ html, body {
+   width: 100%;
+   height: 100%;
+ }
+
+ #app {
+   width: 100%;
+   height: 100%;
+   overflow: hidden;
+ }
+
+ body {
+   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
+   font-size: 14px;
+   color: var(--text-primary);
+   background-color: var(--bg-primary);
+ }
+
+ /* 기타 reset 스타일... */
```

**이유**:

- Vite 기본 스타일 제거
- CONK UI 초기화 (버튼, 입력창 기본값 제거)
- CSS 변수 기반 색상 시스템 호환성 확보

### 4. package.json

**추가된 의존성**:

```json
{
  "dependencies": {
    "axios": "^1.13.6",
    "pinia": "^3.0.4",
    "pinia-plugin-persistedstate": "^4.7.1",
    "vue-router": "^4.6.4",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "vite-plugin-vue-devtools": "^8.0.6"
  }
}
```

**설치 명령어**:

```bash
npm install
```

---

## 신규 추가 파일

정리 과정에서 새로 생성된 파일 목록입니다. 상세 설명은 해당 문서를 참조하세요.

### 스타일 시스템 (`src/assets/styles/`)

| 파일                | 설명                           |
|-------------------|------------------------------|
| `variables.css`   | CSS 커스텀 변수 (색상, 치수, z-index) |
| `transitions.css` | Vue Transition 애니메이션 클래스     |

### 상수 (`src/constants/`)

| 파일          | 설명                                     |
|-------------|----------------------------------------|
| `index.js`  | 모든 상수 re-export                        |
| `roles.js`  | Role 상수 (SYSTEM_ADMIN, MASTER_ADMIN 등) |
| `status.js` | 상태 상수 (ORDER_STATUS, ASN_STATUS 등)     |
| `routes.js` | 라우트 이름 상수                              |

### API 레이어 (`src/api/`)

| 파일            | 설명                   |
|---------------|----------------------|
| `instance.js` | Axios 인스턴스 + 공통 인터셉터 |

### 상태 관리 (`src/stores/`)

| 파일                | 설명                          |
|-------------------|-----------------------------|
| `auth.js`         | 로그인 유저 정보, JWT 토큰 (persist) |
| `ui.js`           | 전역 로딩, 사이드바 토글              |
| `notification.js` | 인앱 알림 목록, 배지                |
| `warehouse.js`    | 창고 관리자 선택 창고 (persist)      |

### 라우터 (`src/router/`)

| 파일               | 설명                  |
|------------------|---------------------|
| `index.js`       | 라우터 인스턴스 + 네비게이션 가드 |
| `routes/auth.js` | 로그인, 비밀번호 설정 라우트    |

### 레이아웃 및 공통 컴포넌트 (`src/components/`)

| 파일                      | 설명                       |
|-------------------------|--------------------------|
| `layout/AppLayout.vue`  | 인증 후 기본 레이아웃 (사이드바 + 헤더) |
| `layout/Sidebar.vue`    | 사이드바 + 네비게이션 메뉴          |
| `layout/Header.vue`     | 헤더 (사용자 프로필, 알림, 로그아웃)   |
| `common/BaseButton.vue` | 기본 버튼 컴포넌트               |
| `common/BaseInput.vue`  | 기본 입력창 컴포넌트              |
| 등                       | 10개 공통 컴포넌트              |

### 유틸리티 (`src/utils/`)

| 파일            | 설명                 |
|---------------|--------------------|
| `format.js`   | 날짜, 금액, 상태 포맷팅     |
| `validate.js` | 이메일, 전화번호 등 유효성 검사 |
| `excel.js`    | Excel 파싱 및 생성      |
| `storage.js`  | localStorage 편의 함수 |

---

## 정리 이유

### 1. 명확한 프로젝트 구조 확립

Vite 스캐폴드의 예시 코드를 제거함으로써 다음을 달성:

- 팀 전체가 동일한 프로젝트 구조 인식
- 불필요한 파일 탐색 시간 제거
- "이 폴더는 뭐 하는 곳인가?" 같은 혼란 최소화

### 2. 통일된 스타일 시스템

- Vite 기본 스타일 대신 **CONK 커스텀 디자인 시스템** 적용
- CSS 변수 기반으로 색상, 치수, 애니메이션 중앙 관리
- 팀 전체가 동일한 UI 토큰 사용 가능

### 3. 라우팅 및 상태관리 구조

- Vue Router 라우팅 명확히 구성
- Pinia 상태 관리 초기화
- Role별 화면 분리 구조 준비

### 4. API 통신 표준화

- Axios 인스턴스 + 인터셉터로 JWT, 테넌트 코드 자동 처리
- 모든 API 호출을 `src/api/` 함수로 통일

---

## 다음 단계

정리 완료 후 다음 문서들을 참조하여 개발을 시작하세요:

1. **step-00-packages.md** — 각 패키지의 역할 및 선택 이유
2. **step-01-env.md** — 환경변수 설정
3. **step-03-styles.md** — 스타일 시스템 상세 가이드
4. **step-04-constants.md** — 상수 레퍼런스
5. **step-05-api.md** — API 레이어 구조 및 사용법

또한 프로젝트 루트의 **DIRECTORY.md**에서 전체 폴더 구조를 확인하세요.

---

## 참고 자료

- [Vite 공식 문서](https://vitejs.dev/)
- [Vue 3 마이그레이션 가이드](https://v3-migration.vuejs.org/)
