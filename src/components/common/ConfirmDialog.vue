<script setup>
/**
 * ConfirmDialog — 삭제/경고 확인 다이얼로그
 *
 * BaseModal의 래퍼 패턴:
 *   BaseModal에 hide-footer를 전달하여 기본 버튼을 숨기고,
 *   이 컴포넌트의 본문에서 직접 취소/확인 버튼을 구성함.
 *   → 간단한 confirm/cancel만 필요한 경우 BaseModal 직접 사용 대신 이 컴포넌트 사용.
 *
 * Props:
 *   isOpen       : boolean — 다이얼로그 표시 여부 (필수)
 *   title        : string  — 제목 (기본 '확인')
 *   message      : string  — 본문 메시지 (필수)
 *   confirmLabel : string  — 확인 버튼 텍스트 (기본 '확인')
 *   cancelLabel  : string  — 취소 버튼 텍스트 (기본 '취소')
 *   danger       : boolean — true면 확인 버튼 빨간색 (삭제/위험 동작 시)
 *
 * Emits:
 *   confirm — 확인 버튼 클릭
 *   cancel  — 취소 버튼 또는 모달 닫기
 *
 * danger prop 사용 시점:
 *   - 삭제 확인: <ConfirmDialog message="정말 삭제하겠습니까?" :danger="true" />
 *   - 일반 확인: danger 생략 (파란색 버튼)
 *
 * 사용 예:
 *   <ConfirmDialog
 *     :isOpen="showConfirm"
 *     title="ASN 삭제"
 *     message="삭제하면 복구할 수 없습니다. 정말 삭제하겠습니까?"
 *     confirmLabel="삭제"
 *     :danger="true"
 *     @confirm="deleteAsn"
 *     @cancel="showConfirm = false"
 *   />
 */
import BaseModal from './BaseModal.vue'

defineProps({
  isOpen:       { type: Boolean, required: true },
  title:        { type: String,  default: '확인' },
  message:      { type: String,  required: true },
  confirmLabel: { type: String,  default: '확인' },
  cancelLabel:  { type: String,  default: '취소' },
  danger:       { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <!--
    BaseModal에 hide-footer 전달 → 기본 취소/확인 버튼 숨김.
    이 컴포넌트의 .actions div에서 직접 버튼 구성.
  -->
  <BaseModal
    :title="title"
    :isOpen="isOpen"
    width="420px"
    hide-footer
    @cancel="emit('cancel')"
  >
    <p class="message">{{ message }}</p>

    <div class="actions">
      <button class="ui-btn ui-btn--ghost" @click="emit('cancel')">{{ cancelLabel }}</button>
      <button
        class="ui-btn"
        :class="danger ? 'ui-btn--danger' : 'ui-btn--primary'"  <!-- danger=true면 빨간 버튼 -->
        @click="emit('confirm')"
      >{{ confirmLabel }}</button>
    </div>
  </BaseModal>
</template>

<style scoped>
.message {
  font-size: var(--font-size-md);
  color: var(--t2);
  line-height: 1.6;
  padding-bottom: 4px;
}

.actions {
  display: flex; justify-content: flex-end; gap: 8px;
  margin-top: 20px;
}
</style>
