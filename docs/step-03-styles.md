# 스타일 시스템 문서

> **한 줄 요약**: CONK 프론트엔드의 CSS 변수 기반 디자인 토큰, 색상 팔레트, 트랜지션 애니메이션 완전 가이드

## 목차

- [파일 구조](#파일-구조)
- [레이아웃 치수](#레이아웃-치수)
- [폰트 시스템](#폰트-시스템)
- [색상 토큰](#색상-토큰)
- [Z-index 레이어](#z-index-레이어)
- [트랜지션 애니메이션](#트랜지션-애니메이션)
- [전역 스타일](#전역-스타일)
- [컴포넌트별 스타일 예시](#컴포넌트별-스타일-예시)
- [Dark Mode (선택사항)](#dark-mode-선택사항)

---

## 파일 구조

```
src/assets/
├── main.css                    ← 전역 CSS 진입점 (main.js에서 import)
│   └── src/main.js에서 호출됨
│
└── styles/
    ├── variables.css           ← CSS 커스텀 변수 (색상, 치수, z-index)
    │   └── :root { --var: value }
    │
    └── transitions.css         ← Vue Transition 클래스
        └── .fade, .slide-left, .modal-overlay 등
```

### Import 순서

**src/main.js**:

```js
import '@/assets/styles/variables.css'    // 1순위: 변수 정의
import '@/assets/styles/transitions.css'  // 2순위: 트랜지션 (변수 의존)
import '@/assets/main.css'                 // 3순위: 전역 스타일
```

---

## 레이아웃 치수

CONK는 **1920×1080 기준**으로 설계되었으며, `clamp(min, preferred, max)` CSS 함수를 사용하여 반응형을 구현합니다.

### Clamp 함수 원리

```css
--sidebar-width: clamp(200px, 13vw, 260px);
```

**의미**:

- **200px** = 최소값 (작은 화면에서 이 크기 이하로 안 줄어듦)
- **13vw** = 선호값 (1920px 기준 약 249.6px)
- **260px** = 최대값 (큰 화면에서 이 크기 이상으로 안 커짐)

**계산 예시**:

- 1920px 화면: 13vw = 1920 × 13% = 249.6px → **250px 적용**
- 1540px 화면: 13vw = 1540 × 13% = 200.2px → **200px 적용** (min 초과)
- 2560px 화면: 13vw = 2560 × 13% = 332.8px → **260px 적용** (max 초과)

### 전체 CSS 변수 테이블

#### 너비 (Width)

| 변수                | CSS 값                       | 1920px 기준값          | 768px 기준 | 용도         |
|-------------------|-----------------------------|---------------------|----------|------------|
| `--sidebar-width` | `clamp(200px, 13vw, 260px)` | 249.6px ≈ **250px** | ~99px    | Sidebar 너비 |

#### 높이 (Height)

| 변수                    | CSS 값                          | 1920px 기준값 | 1080px 기준        | 용도            |
|-----------------------|--------------------------------|------------|------------------|---------------|
| `--header-height`     | `clamp(68px, 10vh, 108px)`     | **108px**  | 10vh = 10%       | 헤더 높이         |
| `--footer-height`     | `clamp(76px, 9.72vh, 105px)`   | **105px**  | 9.72vh = 9.72%   | 사이드바 푸터       |
| `--sidebar-logo-h`    | `clamp(68px, 10vh, 108px)`     | **108px**  | 헤더와 동일           | Sidebar 로고/헤더 |
| `--sidebar-profile-h` | `clamp(124px, 13.52vh, 160px)` | **146px**  | 13.52vh = 13.52% | 사이드바 프로필      |

#### 계산 공식

**vw/vh 계산**:

```
vw% = (desired_px ÷ 1920) × 100
vh% = (desired_px ÷ 1080) × 100
```

**예시**:

- `--header-height: 108px` → 108 ÷ 1080 × 100 = 10vh
- `--sidebar-width: 250px` → 250 ÷ 1920 × 100 = 13vw

### 레이아웃 구조 (1920×1080)

```
┌─────────────────────────────────────────────────────────────┐ ↑
│                     Header (h=108px)                        │ 108px
│                                                             │ ↓
├────────────┬───────────────────────────────────────────────┤
│ Sidebar    │                                               │
│ (w=250px)  │          Main Content Area                   │
│            │          (w = 1920 - 250 = 1670px)           │
│ ┌────────┐ │                                               │
│ │ Logo   │ │  Height = 1080 - 108 - 105 = 867px           │
│ │(108px) │ │                                               │
│ ├────────┤ │                                               │
│ │Profile │ │                                               │
│ │(146px) │ │                                               │
│ │ top    │ │                                               │
│ │divider │ │                                               │
│ │ bottom │ │                                               │
│ ├────────┤ │                                               │
│ │ Nav    │ │  Nav height ≈ 867 - 108 - 146 = 613px        │
│ │(flex:1)│ │                                               │
│ └────────┘ │                                               │
├────────────┴───────────────────────────────────────────────┤
│                   Footer (h=105px, fixed bottom)           │
└────────────────────────────────────────────────────────────┘
```

### 사이드바 접힘 상태 (Collapsed)

```css
--sidebar-width-collapsed: 64px;  /* 아이콘만 표시 */
```

레이아웃:

```
┌──────────────────────────────────────────────────────────────┐
│  Header (h=108px)                                            │
├──┬────────────────────────────────────────────────────────────┤
│  │                                                            │
│  │  Main Content (w = 1920 - 64 = 1856px)                   │
│  │                                                            │
│ 64│                                                            │
│px │                                                            │
│  │                                                            │
├──┴────────────────────────────────────────────────────────────┤
│  Footer                                                        │
└────────────────────────────────────────────────────────────────┘
```

---

## 폰트 시스템

CONK는 용도에 따라 3종 폰트를 구분하여 사용합니다.

### 폰트 패밀리

| CSS 변수             | 폰트               | 용도                        |
|--------------------|------------------|---------------------------|
| `--font-base`      | Inter            | 본문, 상태 배지, 수치 보조          |
| `--font-barlow`    | Barlow           | UI 라벨, 버튼, 네비게이션, 테이블 헤더  |
| `--font-condensed` | Barlow Condensed | 페이지 타이틀, 섹션 제목, KPI 대형 수치 |
| `--font-mono`      | IBM Plex Sans    | ASN번호, 코드형 식별자            |

### Google Fonts Import

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,600&family=Barlow+Condensed:wght@600;700&family=IBM+Plex+Sans:wght@400;500&family=Inter:wght@300;400;500;600;700&display=swap');
```

### 컴포넌트 적용 현황

| 컴포넌트        | 요소                 | 폰트                 |
|-------------|--------------------|--------------------|
| Header.vue  | `.page-title`      | `--font-condensed` |
| Header.vue  | `.breadcrumb`      | `--font-barlow`    |
| Footer.vue  | `.footer-brand`    | `--font-condensed` |
| Sidebar.vue | `.logo-brand`      | `--font-condensed` |
| Sidebar.vue | `.nav-group-label` | `--font-barlow`    |
| Sidebar.vue | `.nav-item`        | `--font-barlow`    |

---

## 색상 토큰

CONK는 **Cool Slate 팔레트** 기반의 시맨틱 색상 시스템을 사용합니다.

### 시맨틱 색상 (Semantic Colors)

| CSS 변수          | 16진 값     | RGB                | 용도              | UI 예시             |
|-----------------|-----------|--------------------|-----------------|-------------------|
| `--blue`        | `#4C74FF` | rgb(76, 116, 255)  | 정보, 링크, 활성 상태   | 활성 버튼, 링크, 강조 텍스트 |
| `--blue-pale`   | `#EEF2FF` | rgb(238, 242, 255) | blue 배경, 호버     | 버튼 호버, 배지 배경      |
| `--green`       | `#2ECC87` | rgb(46, 204, 135)  | 성공, 완료, 긍정      | 성공 메시지, 체크 아이콘    |
| `--green-pale`  | `#E8F9F1` | rgb(232, 249, 241) | green 배경        | 성공 배지 배경          |
| `--amber`       | `#F5C842` | rgb(245, 200, 66)  | 경고, 대기, 진행 예정   | 경고 배지, 주의 아이콘     |
| `--amber-pale`  | `#FFFBE8` | rgb(255, 251, 232) | amber 배경        | 경고 배지 배경          |
| `--red`         | `#EF4444` | rgb(239, 68, 68)   | 오류, 취소, 삭제      | 오류 메시지, 삭제 버튼     |
| `--red-pale`    | `#FEE2E2` | rgb(254, 226, 226) | red 배경          | 오류 배지 배경          |
| `--purple`      | `#7C3AED` | rgb(124, 58, 237)  | 진행 중 상태 (피킹/패킹) | 진행 중 배지           |
| `--purple-pale` | `#EDE9FE` | rgb(237, 233, 254) | purple 배경       | 진행 중 배지 배경        |
| `--gold`        | `#F5A623` | rgb(245, 166, 35)  | 브랜드 강조색, 별      | 중요 강조, 별점         |
| `--gold-pale`   | `#FEF3DC` | rgb(254, 243, 220) | gold 배경         | 강조 배경             |

### 중성 색상 (Neutral Colors)

| CSS 변수             | 16진 값     | 용도             |
|--------------------|-----------|----------------|
| `--text-primary`   | `#0F172A` | 본문 텍스트         |
| `--text-secondary` | `#64748B` | 보조 텍스트, 비활성    |
| `--text-disabled`  | `#CBD5E1` | 비활성 텍스트        |
| `--bg-primary`     | `#FFFFFF` | 주 배경색          |
| `--bg-secondary`   | `#F1F5F9` | 보조 배경색 (섹션 구분) |
| `--border`         | `#E2E8F0` | 테두리            |
| `--border-dark`    | `#94A3B8` | 어두운 테두리        |

### 색상 팔레트 시각화

```
Primary (Blue)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#4C74FF (strong)  ██████ 정보, 링크, 활성
#EEF2FF (pale)    ██████ 배경, 호버

Success (Green)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#2ECC87 (strong)  ██████ 성공 상태
#E8F9F1 (pale)    ██████ 성공 배경

Warning (Amber)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#F5C842 (strong)  ██████ 경고, 대기 중
#FFFBE8 (pale)    ██████ 경고 배경

Error (Red)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#EF4444 (strong)  ██████ 오류, 삭제
#FEE2E2 (pale)    ██████ 오류 배경

Processing (Purple)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#7C3AED (strong)  ██████ 진행 중 (피킹/패킹)
#EDE9FE (pale)    ██████ 진행 배경

Brand (Gold)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#F5A623 (strong)  ██████ 브랜드 강조, 별점
#FEF3DC (pale)    ██████ 강조 배경
```

### CSS 변수 사용 예시

```css
/* variables.css 정의 */
:root {
  --blue: #4C74FF;
  --blue-pale: #EEF2FF;
  --text-primary: #0F172A;
  --bg-primary: #FFFFFF;
}

/* 컴포넌트에서 사용 */
button.primary {
  background-color: var(--blue);      /* #4C74FF */
  color: white;
}

button.primary:hover {
  background-color: var(--blue-pale); /* #EEF2FF */
  color: var(--blue);                 /* #4C74FF */
}
```

---

## Z-index 레이어

Modal, Toast, Dropdown 등의 겹침 순서를 명확히 하기 위해 z-index 레이어를 정의합니다.

```
레이어 구조 (아래 → 위):

┌─────────────────────────────────┐  z-index: 400 ← Toast (최상단)
│  Toast (알림 메시지)             │
└─────────────────────────────────┘

┌────────────────────────────────────────────────────────┐  z-index: 300
│  Modal (다이얼로그 박스)                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Modal Content                                    │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐  z-index: 200
│  Dropdown (헤더 알림, 프로필 메뉴)    │
│  ┌───────────────────────────────┐  │
│  │ • Dropdown Item 1            │  │
│  │ • Dropdown Item 2            │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

┌────────────────────────────────────────────────┐  z-index: 110
│  Header (일반적인 UI 요소)                      │
└────────────────────────────────────────────────┘

┌──┬─────────────────────────────────────────────┐  z-index: 100
│  │ Sidebar                                     │
│  │                                             │
│  │ (sticky, 항상 보임)                        │
│  │                                             │
└──┴─────────────────────────────────────────────┘

Document Flow (z-index: auto)
┌────────────────────────────────────────────────────┐
│  Main Content                                      │
│  - Tables                                          │
│  - Forms                                           │
│  - Cards                                           │
└────────────────────────────────────────────────────┘
```

### CSS 변수 정의

```css
:root {
  --z-sidebar: 100;
  --z-header: 110;
  --z-dropdown: 200;
  --z-modal: 300;
  --z-toast: 400;
}
```

### 사용 예시

```css
/* Sidebar */
.sidebar {
  position: sticky;
  top: 0;
  z-index: var(--z-sidebar);  /* 100 */
}

/* Header */
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);   /* 110 - Sidebar보다 앞 */
}

/* Dropdown */
.dropdown-menu {
  position: absolute;
  z-index: var(--z-dropdown); /* 200 */
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--z-modal);    /* 300 */
}

/* Toast */
.toast-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: var(--z-toast);    /* 400 - 최상단 */
}
```

---

## 트랜지션 애니메이션

`src/assets/styles/transitions.css`에 정의된 Vue Transition 클래스들입니다.

### 1. Fade (페이드)

**용도**: 페이지 전환, Sidebar 텍스트 숨김/표시

```vue
<Transition name="fade" mode="out-in">
  <div v-if="show">내용</div>
</Transition>
```

**CSS**:

```css
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

**효과**: 0.3초 동안 투명도만 변화

### 2. Slide Left (좌측 슬라이드)

**용도**: 페이지 네비게이션

```vue
<RouterView>
  <template #default="{ Component }">
    <Transition name="slide-left" mode="out-in">
      <component :is="Component" />
    </Transition>
  </template>
</RouterView>
```

**CSS**:

```css
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(-100%);
}
```

**효과**: 새 페이지는 우측에서 좌측으로, 이전 페이지는 좌측으로 사라짐

### 3. Modal Overlay (모달 배경)

**용도**: Modal 배경 페이드

```vue
<Transition name="modal-overlay">
  <div v-if="visible" class="modal-overlay">
    <!-- ... -->
  </div>
</Transition>
```

**CSS**:

```css
.modal-overlay-enter-active,
.modal-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.modal-overlay-enter-from,
.modal-overlay-leave-to {
  opacity: 0;
}
```

### 4. Modal Panel (모달 패널)

**용도**: Modal 콘텐츠 위에서 내려오기

```vue
<Transition name="modal-panel">
  <div v-if="visible" class="modal-panel">
    <!-- 모달 내용 -->
  </div>
</Transition>
```

**CSS**:

```css
.modal-panel-enter-active,
.modal-panel-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-panel-enter-from {
  transform: translateY(-50px);
  opacity: 0;
}

.modal-panel-leave-to {
  transform: translateY(-50px);
  opacity: 0;
}
```

**효과**: 0.3초 동안 위에서 내려오며 페이드 인

### 5. Toast (토스트 메시지)

**용도**: 우상단 알림 메시지

```vue
<Transition name="toast">
  <div v-if="visible" class="toast-message">
    {{ message }}
  </div>
</Transition>
```

**CSS**:

```css
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(400px);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(400px);
  opacity: 0;
}
```

**효과**: 우측에서 좌측으로 슬라이드 인

### 6. Dropdown (드롭다운 메뉴)

**용도**: 헤더 알림 패널, 프로필 메뉴

```vue
<Transition name="dropdown">
  <div v-if="open" class="dropdown-menu">
    <!-- 메뉴 아이템 -->
  </div>
</Transition>
```

**CSS**:

```css
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.dropdown-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
```

**효과**: 위에서 내려오며 페이드 인

---

## 전역 스타일

`src/assets/main.css`에서 정의된 전역 스타일입니다.

### CSS Reset

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
}

#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
```

### 기본 폰트 및 색상

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
               'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
  background-color: var(--bg-primary);
}

h1, h2, h3, h4, h5, h6 {
  color: var(--text-primary);
  font-weight: 600;
}

a {
  color: var(--blue);
  text-decoration: none;
  cursor: pointer;
}

a:hover {
  color: var(--blue);
  text-decoration: underline;
}
```

### 버튼 및 입력 기본값 제거

```css
button {
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
}

input,
textarea,
select {
  font: inherit;
  color: inherit;
}

input:focus,
textarea:focus,
select:focus {
  outline: 2px solid var(--blue);
  outline-offset: 2px;
}
```

---

## 컴포넌트별 스타일 예시

### BaseButton 컴포넌트

```vue
<template>
  <button :class="[`btn-${variant}`, { 'btn-disabled': disabled }]">
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  disabled: { type: Boolean, default: false }
})
</script>

<style scoped>
.btn-primary {
  padding: 8px 16px;
  background-color: var(--blue);
  color: white;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.btn-primary:hover:not(.btn-disabled) {
  background-color: var(--blue);
  filter: brightness(1.1);
}

.btn-primary:active:not(.btn-disabled) {
  filter: brightness(0.9);
}

.btn-disabled {
  background-color: var(--text-disabled);
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-secondary {
  padding: 8px 16px;
  background-color: transparent;
  color: var(--blue);
  border: 1px solid var(--border);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: var(--blue-pale);
  border-color: var(--blue);
}

.btn-danger {
  background-color: var(--red);
  color: white;
}

.btn-danger:hover {
  filter: brightness(1.1);
}
</style>
```

### StatusBadge 컴포넌트

```vue
<template>
  <span :class="['badge', `badge-${status}`]">
    {{ statusLabel }}
  </span>
</template>

<script setup>
const props = defineProps({
  status: { type: String, required: true }
})

const statusLabel = computed(() => {
  const MAP = {
    'PENDING': '대기 중',
    'CONFIRMED': '확인됨',
    'PICKING': '피킹 중',
    'PACKING': '패킹 중',
    'SHIPPED': '출고 완료',
    'CANCELLED': '취소됨'
  }
  return MAP[props.status] || props.status
})
</script>

<style scoped>
.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.badge-PENDING {
  background-color: var(--amber-pale);
  color: var(--amber);
}

.badge-CONFIRMED {
  background-color: var(--blue-pale);
  color: var(--blue);
}

.badge-PICKING {
  background-color: var(--purple-pale);
  color: var(--purple);
}

.badge-SHIPPED {
  background-color: var(--green-pale);
  color: var(--green);
}

.badge-CANCELLED {
  background-color: var(--red-pale);
  color: var(--red);
}
</style>
```

---

## Dark Mode (선택사항)

향후 Dark Mode를 추가할 경우, 다음과 같이 CSS 변수를 확장할 수 있습니다:

```css
:root {
  /* Light Mode (기본) */
  --text-primary: #0F172A;
  --bg-primary: #FFFFFF;
  --border: #E2E8F0;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark Mode */
    --text-primary: #F1F5F9;
    --bg-primary: #0F172A;
    --border: #334155;
  }
}

/* 또는 수동 토글 */
html.dark {
  --text-primary: #F1F5F9;
  --bg-primary: #0F172A;
  --border: #334155;
}
```

---

## 참고 자료

- [MDN CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Vue Transition 공식 문서](https://vuejs.org/guide/built-ins/transition.html)
- [clamp() 함수 가이드](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp())
- [CSS Z-index 스택킹 컨텍스트](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioned_Layout/Understanding_z-index/The_stacking_context)
