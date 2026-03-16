<script setup>
/**
 * AppLayout — 인증된 전체 화면 레이아웃 컴포넌트
 *
 * 1920×1080 기준 구조:
 *
 *   ┌─────────────┬──────────────────────────────────────────────┐
 *   │             │  Header (fixed, 108px)                        │
 *   │  Sidebar    ├──────────────────────────────────────────────┤
 *   │  (fixed,    │                                              │
 *   │   250px)    │  main.app-content                            │
 *   │             │  (margin-top: 108px, padding-bottom: +105px) │
 *   │             │                                              │
 *   └─────────────┴──────────────────────────────────────────────┘
 *                 │  Footer (fixed, 105px)                        │
 *                 └──────────────────────────────────────────────┘
 *
 * fixed 사이드바로 인한 margin 구조:
 *   Sidebar: position fixed → 자신은 문서 흐름에서 벗어남
 *   .app-main: margin-left = --sidebar-width (250px) → 사이드바 너비만큼 밀림
 *   .app-content: margin-top = --header-height (108px) → 헤더 높이만큼 밀림
 *   → 콘텐츠는 사이드바와 헤더가 차지하는 영역을 피해서 렌더링됨
 *
 * Props:
 *   title      : string — 헤더 페이지 제목 (Header에 전달)
 *   breadcrumb : Array  — 헤더 브레드크럼 (Header에 전달)
 *
 * Slots:
 *   default       — 페이지 콘텐츠 (main 태그 내부)
 *   header-action — Header 우측 커스텀 액션 버튼
 *
 * 사용 예:
 *   <AppLayout title="주문 목록" :breadcrumb="[{ label: '홈', to: '/' }, { label: '주문' }]">
 *     <template #header-action>
 *       <button class="btn-gold" @click="register">주문 등록</button>
 *     </template>
 *
 *     <!-- 페이지 본문 -->
 *     <BaseTable :columns="cols" :rows="rows" />
 *   </AppLayout>
 */
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import Footer from './Footer.vue'

defineProps({
  title: { type: String, default: '' },
  breadcrumb: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="app-layout">
    <!-- 사이드바 (position: fixed, 250px) -->
    <Sidebar />

    <!-- 우측 메인 영역 (사이드바 너비만큼 margin-left) -->
    <div class="app-main">
      <!-- 헤더 (position: fixed, 108px) — header-action 슬롯 전달 -->
      <Header :breadcrumb="breadcrumb" :title="title">
        <template #action>
          <slot name="header-action" />
        </template>
      </Header>

      <!-- 콘텐츠 영역 (헤더 높이만큼 margin-top, 푸터 높이만큼 padding-bottom) -->
      <main class="app-content">
        <slot />
      </main>
    </div>

    <!-- 하단 고정 푸터 (left: sidebar-width, right: 0) -->
    <Footer />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--bg);
}

/*
  사이드바가 fixed이므로 우측 main 영역에 margin-left 적용.
*/
.app-main {
  margin-left: var(--sidebar-width); /* 250px */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-content {
  margin-top: var(--header-height); /* 108px */
  flex: 1;
  padding: var(--content-py) var(--content-px);
  padding-bottom: calc(var(--content-py) + var(--footer-height)); /* 푸터에 가려지지 않도록 */
  background: var(--bg);
  min-height: calc(100vh - var(--header-height));
}
</style>
