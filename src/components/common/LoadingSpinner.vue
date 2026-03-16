<script setup>
/**
 * LoadingSpinner — CSS 스피너 컴포넌트
 *
 * Props:
 *   size       : 'sm' | 'md' | 'lg' — 스피너 크기 (기본 'md')
 *                sm=16px, md=28px, lg=44px
 *   fullscreen : boolean — true면 화면 전체 반투명 오버레이 위에 표시
 *   color      : string — CSS color 값 (기본 var(--blue) 사용)
 *
 * fullscreen 오버레이:
 *   z-index: var(--z-modal) = 300 — 모달과 같은 레벨로 최상위 표시
 *   background: rgba(244, 246, 250, 0.75) — 반투명 배경
 *   backdrop-filter: blur(2px)
 *   → 페이지 전환, 전체 데이터 로딩 시 사용
 *   → ui.setLoading(true) + <LoadingSpinner fullscreen v-if="ui.isLoading" /> 패턴
 *
 * color prop 커스터마이징 시점:
 *   - 기본(빈 문자열): var(--blue) 사용 (CSS에서 기본값)
 *   - 어두운 배경 위: color="#fff" 또는 color="var(--gold)"
 *
 * 사용 예:
 *   <!-- 인라인 소형 스피너 (테이블 로딩) -->
 *   <LoadingSpinner size="sm" />
 *
 *   <!-- 전체 화면 로딩 오버레이 -->
 *   <LoadingSpinner fullscreen v-if="ui.isLoading" />
 *
 *   <!-- 커스텀 색상 -->
 *   <LoadingSpinner size="lg" color="var(--gold)" />
 */
defineProps({
  size: { type: String, default: 'md' },
  fullscreen: { type: Boolean, default: false },
  color: { type: String, default: '' },
})
</script>

<template>
  <!-- fullscreen=true: 오버레이 div로 감쌈 -->
  <div v-if="fullscreen" class="fullscreen-overlay">
    <span
      :class="`spinner--${size}`"
      :style="color ? { borderTopColor: color } : {}"
      class="spinner"
    />
  </div>
  <!-- fullscreen=false: 인라인 span으로 바로 표시 -->
  <span
    v-else
    :class="`spinner--${size}`"
    :style="color ? { borderTopColor: color } : {}"
    class="spinner"
  />
</template>

<style scoped>
.spinner {
  display: inline-block;
  border-radius: 50%;
  border: 2px solid var(--border); /* 회색 기본 테두리 */
  border-top-color: var(--blue); /* 파란 회전 색상 (color prop으로 override 가능) */
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

/* 크기 변형: sm/md/lg에 따라 크기와 border-width 조정 */
.spinner--sm {
  width: 16px;
  height: 16px;
  border-width: 2px;
}
.spinner--md {
  width: 28px;
  height: 28px;
  border-width: 3px;
}
.spinner--lg {
  width: 44px;
  height: 44px;
  border-width: 4px;
}

.fullscreen-overlay {
  position: fixed;
  inset: 0;
  background: rgba(244, 246, 250, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal); /* 300: 모달과 동일 레벨 */
  backdrop-filter: blur(2px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
