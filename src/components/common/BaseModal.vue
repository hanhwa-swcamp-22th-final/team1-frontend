<script setup>
/**
 * BaseModal — 공통 모달 컴포넌트
 *
 * Teleport to="body" 사용 이유:
 *   모달이 부모 컴포넌트의 z-index 스택 컨텍스트에 갇히지 않도록
 *   DOM을 <body> 직접 하위에 렌더링. --z-modal(300)이 항상 최상위 보장.
 *
 * Props:
 *   title      : string  — 모달 헤더 제목 (필수)
 *   isOpen     : boolean — 모달 표시 여부 (필수)
 *   width      : string  — 모달 패널 너비 (기본 '520px')
 *   hideFooter : boolean — true면 기본 취소/확인 버튼 숨김
 *
 * Emits:
 *   confirm — 확인 버튼 클릭 (기본 footer)
 *   cancel  — 취소 버튼 클릭 또는 오버레이/X 클릭
 *
 * Slots:
 *   default — 모달 본문 콘텐츠
 *   footer  — 커스텀 footer (hideFooter=false일 때만 렌더링)
 *
 * 오버레이 클릭 닫힘 동작:
 *   .overlay에 @click.self 이벤트로 cancel emit.
 *   패널(.panel) 클릭은 .self 조건으로 무시됨.
 *
 * hideFooter 사용 패턴:
 *   - 단순 정보 표시 모달: hideFooter=true + 본문 내 직접 버튼 배치
 *   - ConfirmDialog는 hide-footer를 사용하고 자체 액션 버튼을 구성함
 *
 * 사용 예:
 *   <BaseModal title="재고 수정" :isOpen="isOpen" @confirm="save" @cancel="isOpen=false">
 *     <BaseForm label="수량"><input v-model="qty" type="number" /></BaseForm>
 *   </BaseModal>
 *
 *   <!-- 커스텀 footer -->
 *   <BaseModal title="미리보기" :isOpen="isOpen" @cancel="close">
 *     <template #footer>
 *       <button class="btn-gold" @click="download">다운로드</button>
 *     </template>
 *     ...
 *   </BaseModal>
 */
defineProps({
  title:      { type: String,  required: true },
  isOpen:     { type: Boolean, required: true },
  width:      { type: String,  default: '520px' },
  hideFooter: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <!--
    Teleport: DOM을 <body> 직하위에 삽입하여 z-index 컨텍스트 문제 해결.
    SFC 내 어느 위치에서 사용해도 항상 body 끝에 렌더링됨.
  -->
  <Teleport to="body">
    <!-- 오버레이 페이드 전환 (transitions.css: modal-overlay) -->
    <Transition name="modal-overlay">
      <div
        v-if="isOpen"
        class="overlay"
        @click.self="emit('cancel')"  <!-- 오버레이 클릭(패널 외부)만 닫힘 -->
      >
        <!-- 패널 슬라이드+페이드 전환 (transitions.css: modal-panel) -->
        <Transition name="modal-panel">
          <div v-if="isOpen" :style="{ width }" class="panel">
            <!-- 헤더 -->
            <div class="modal-header">
              <h3 class="modal-title">{{ title }}</h3>
              <button aria-label="닫기" class="close-btn" @click="emit('cancel')">✕</button>
            </div>

            <!-- 본문 (overflow-y: auto로 긴 콘텐츠 스크롤) -->
            <div class="modal-body">
              <slot />
            </div>

            <!--
              기본 footer: 취소/확인 버튼
              hideFooter=true 이면 숨김 (ConfirmDialog, 커스텀 footer 사용 시)
              footer 슬롯으로 버튼 전체 교체 가능
            -->
            <div v-if="!hideFooter" class="modal-footer">
              <slot name="footer">
                <button class="ui-btn ui-btn--ghost" @click="emit('cancel')">취소</button>
                <button class="ui-btn ui-btn--primary" @click="emit('confirm')">확인</button>
              </slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(26, 26, 46, 0.55);
  display: flex; align-items: center; justify-content: center;
  z-index: var(--z-modal);
  backdrop-filter: blur(2px);
}

.panel {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-height: 90vh;
  display: flex; flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--t1);
}

.close-btn {
  width: 32px; height: 32px;
  border: none; border-radius: var(--radius-sm);
  background: transparent;
  color: var(--t3);
  font-size: 14px;
  transition: all var(--ease-fast);
}
.close-btn:hover { background: var(--surface-2); color: var(--t1); }

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
</style>
