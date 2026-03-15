<script setup>
/**
 * ToastMessage — 우하단 고정 토스트 알림 (Teleport)
 *
 * Props:
 *   visible  : boolean — 표시 여부 (v-model:visible 사용 권장)
 *   message  : string  — 표시할 메시지 (필수)
 *   type     : 'success' | 'error' | 'info' | 'warning' — 색상 결정 (기본 'info')
 *   duration : number  — 자동 닫힘 시간(ms). 0이면 자동 닫힘 없음 (기본 3500)
 *
 * Emits:
 *   update:visible(false) — 닫힐 때 발생 (v-model:visible 지원)
 *   close                 — 닫힐 때 발생 (추가 처리 필요 시)
 *
 * v-model:visible 사용법:
 *   <ToastMessage v-model:visible="showToast" message="저장되었습니다" type="success" />
 *
 * :visible + @close 사용법 (v-model 대안):
 *   <ToastMessage :visible="showToast" message="오류 발생" type="error" @close="showToast=false" />
 *
 * duration=0 사용 시점:
 *   진행 중 상태 (업로드 중 등) — 완료 후 수동으로 visible=false 처리
 *
 * timer 클리어 시점:
 *   - watch(visible): visible 변경 시마다 기존 timer 클리어 후 재시작
 *     (visible이 true→false→true 반복될 때 timer 누적 방지)
 *   - onUnmounted: 컴포넌트 제거 시 남은 timer 정리 (메모리 누수 방지)
 */
import { watch, onUnmounted, ref } from 'vue'

const props = defineProps({
  visible:  { type: Boolean, default: false },
  message:  { type: String,  required: true },
  type:     { type: String,  default: 'info' },
  duration: { type: Number,  default: 3500 },
})

const emit = defineEmits(['update:visible', 'close'])

let timer = null

/** visible=false로 emit. timer 클리어 후 닫힘 이벤트 발생. */
function close() {
  clearTimeout(timer)
  emit('update:visible', false)
  emit('close')
}

/**
 * visible 변화 감지:
 *   - true → duration > 0이면 duration ms 후 자동 close()
 *   - false/변경 → 기존 timer 클리어 (중복 timer 방지)
 * immediate: true → 초기 렌더 시에도 즉시 평가
 */
watch(() => props.visible, (val) => {
  clearTimeout(timer)
  if (val && props.duration > 0) {
    timer = setTimeout(close, props.duration)
  }
}, { immediate: true })

/** 컴포넌트 제거 시 남은 timer 정리 */
onUnmounted(() => clearTimeout(timer))

/** 타입별 아이콘 */
const ICONS = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
}
</script>

<template>
  <!--
    Teleport: body 직하위에 렌더링하여 z-index 최상위(--z-toast: 400) 보장.
    position: fixed; bottom/right 로 우하단 고정.
  -->
  <Teleport to="body">
    <!-- transitions.css: name="toast" (우에서 슬라이드 인) -->
    <Transition name="toast">
      <div v-if="visible" class="toast" :class="`toast--${type}`" role="alert">
        <!-- 타입에 해당하는 아이콘. 알 수 없는 타입은 'ℹ' fallback -->
        <span class="toast-icon">{{ ICONS[type] ?? ICONS.info }}</span>
        <span class="toast-message">{{ message }}</span>
        <button class="toast-close" @click="close" aria-label="닫기">✕</button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: 28px; right: 28px;
  display: flex; align-items: center; gap: 10px;
  min-width: 280px; max-width: 420px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-toast);    /* 400: 모달(300)보다 위 */
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.toast--success { background: var(--green);  color: #fff; }
.toast--error   { background: var(--red);    color: #fff; }
.toast--info    { background: var(--blue);   color: #fff; }
.toast--warning { background: var(--amber);  color: var(--t1); }  /* amber는 어두운 텍스트 */

.toast-icon   { font-size: 16px; flex-shrink: 0; }
.toast-message { flex: 1; line-height: 1.4; }

.toast-close {
  background: transparent; border: none;
  color: inherit; opacity: 0.7;
  font-size: 13px; padding: 0 2px;
  flex-shrink: 0;
  transition: opacity var(--ease-fast);
}
.toast-close:hover { opacity: 1; }
</style>
