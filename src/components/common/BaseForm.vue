<script setup>
/**
 * BaseForm — 폼 필드 래퍼 (라벨 + 입력 슬롯 + 에러/힌트 메시지)
 *
 * Props:
 *   label    : string  — 필드 라벨 (없으면 라벨 영역 숨김)
 *   error    : string  — 에러 메시지 (있으면 빨간 테두리 + 에러 텍스트)
 *   required : boolean — true면 라벨 오른쪽에 * 표시
 *   hint     : string  — 안내 메시지 (error가 없을 때만 표시)
 *
 * 에러/힌트 우선순위:
 *   error가 있으면 hint는 표시하지 않음 (v-if/v-else-if 구조)
 *   에러 상태: .form-field.has-error 클래스 추가 → 입력 테두리 빨간색
 *
 * 사용 예:
 *   <BaseForm label="이메일" :error="errors.email" required>
 *     <input v-model="form.email" type="email" placeholder="user@example.com" />
 *   </BaseForm>
 *
 *   <BaseForm label="SKU" hint="영문+숫자 4~32자">
 *     <input v-model="form.sku" type="text" />
 *   </BaseForm>
 */
defineProps({
  label: { type: String, default: '' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  hint: { type: String, default: '' },
})
</script>

<template>
  <div :class="{ 'has-error': error }" class="form-field">
    <label v-if="label" class="field-label">
      {{ label }}
      <span v-if="required" aria-hidden="true" class="required-mark">*</span>
    </label>

    <div class="field-input">
      <slot />
    </div>

    <!-- 에러 우선, 에러 없을 때만 힌트 표시 -->
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
    <p v-else-if="hint" class="field-hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--t2);
}

.required-mark {
  color: var(--red);
  margin-left: 2px;
}

/*
  :deep() 사용 이유:
  BaseForm은 슬롯으로 input/select/textarea를 받으므로
  scoped CSS가 슬롯 내부 자식 요소에 적용되지 않음.
  :deep()으로 슬롯 내 하위 요소까지 스타일 관통.
*/
.field-input :deep(input),
.field-input :deep(select),
.field-input :deep(textarea) {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-md);
  outline: none;
  transition:
    border-color var(--ease-fast),
    box-shadow var(--ease-fast);
}
.field-input :deep(input):focus,
.field-input :deep(select):focus,
.field-input :deep(textarea):focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--blue-pale);
}

/* has-error 상태: 테두리 빨간색 + 포커스 시 빨간 glow */
.has-error .field-input :deep(input),
.has-error .field-input :deep(select),
.has-error .field-input :deep(textarea) {
  border-color: var(--red);
}
.has-error .field-input :deep(input):focus,
.has-error .field-input :deep(select):focus,
.has-error .field-input :deep(textarea):focus {
  box-shadow: 0 0 0 3px var(--red-pale);
}

.field-input :deep(input::placeholder),
.field-input :deep(textarea::placeholder) {
  color: var(--t4);
}

.field-error {
  font-size: var(--font-size-xs);
  color: var(--red);
}
.field-hint {
  font-size: var(--font-size-xs);
  color: var(--t3);
}
</style>
