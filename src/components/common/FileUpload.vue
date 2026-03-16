<script setup>
/**
 * FileUpload — 파일 업로드 (드래그앤드롭 + 클릭)
 *
 * Props:
 *   accept   : string  — 허용 파일 형식 (기본 '.xlsx,.xls')
 *   multiple : boolean — true면 여러 파일 선택 가능
 *   disabled : boolean — true면 클릭/드래그 비활성화
 *
 * Emits:
 *   file-selected(File | File[])
 *     — multiple=false: 단일 File 객체
 *     — multiple=true:  File[] 배열
 *
 * 드래그 이벤트 흐름:
 *   1. dragover  → isDragging=true  (파란 테두리 활성화)
 *                  .prevent: 브라우저의 파일 열기 기본 동작 차단
 *   2. dragleave → isDragging=false (테두리 원복)
 *   3. drop      → isDragging=false → handleFiles(e.dataTransfer.files)
 *                  .prevent: 브라우저가 파일을 직접 열지 않도록 차단
 *
 * multiple 모드 차이:
 *   false(기본): emit('file-selected', files[0])       — File 단일 객체
 *   true:        emit('file-selected', Array.from(files)) — File 배열
 *
 * 사용 예:
 *   <!-- Excel 단일 파일 업로드 -->
 *   <FileUpload @file-selected="onFileSelected" />
 *
 *   <!-- 이미지 다중 업로드 -->
 *   <FileUpload
 *     accept=".jpg,.jpeg,.png,.webp"
 *     :multiple="true"
 *     @file-selected="onFilesSelected"
 *   />
 */
import { ref } from 'vue'

const props = defineProps({
  accept: { type: String, default: '.xlsx,.xls' },
  multiple: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['file-selected'])

const isDragging = ref(false)
/** 숨겨진 input[type="file"]에 대한 ref — 클릭 시 programmatic 트리거 */
const inputRef = ref(null)

/**
 * 파일 처리 공통 로직
 * @param {FileList} files
 */
function handleFiles(files) {
  if (!files?.length || props.disabled) return
  // multiple 모드: 배열로 변환, 단일 모드: 첫 번째 파일만
  emit('file-selected', props.multiple ? Array.from(files) : files[0])
}

/**
 * drop 이벤트 핸들러
 * @param {DragEvent} e
 */
function onDrop(e) {
  isDragging.value = false
  handleFiles(e.dataTransfer.files)
}
</script>

<template>
  <div
    :aria-disabled="disabled"
    :class="{ dragging: isDragging, disabled }"
    class="upload-zone"
    role="button"
    tabindex="0"
    @click="!disabled && inputRef?.click()"
    @dragleave="isDragging = false"
    @dragover.prevent="!disabled && (isDragging = true)"
    @drop.prevent="onDrop"
    @keydown.enter="!disabled && inputRef?.click()"
  >
    <!-- input은 숨겨두고 zone 클릭 시 programmatic click으로 파일 선택 다이얼로그 열기 -->
    <input
      ref="inputRef"
      :accept="accept"
      :multiple="multiple"
      class="hidden-input"
      type="file"
      @change="handleFiles($event.target.files)"
    />

    <div class="upload-icon">
      <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
        <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        <polyline points="16 12 12 8 8 12" />
        <line x1="12" x2="12" y1="8" y2="20" />
      </svg>
    </div>

    <p class="upload-label">
      <strong>파일을 드래그</strong>하거나 <strong>클릭</strong>하여 업로드
    </p>
    <p class="upload-hint">{{ accept }} 형식 지원</p>
  </div>
</template>

<style scoped>
.hidden-input {
  display: none;
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 36px 24px;
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  cursor: pointer;
  transition: all var(--ease-default);
  text-align: center;
}
.upload-zone:hover,
.upload-zone.dragging {
  border-color: var(--blue);
  background: var(--blue-pale);
}
.upload-zone.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: var(--blue-pale);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--blue);
}
.upload-icon svg {
  width: 24px;
  height: 24px;
}

.upload-label {
  font-size: var(--font-size-md);
  color: var(--t2);
}
.upload-label strong {
  color: var(--blue);
}

.upload-hint {
  font-size: var(--font-size-xs);
  color: var(--t4);
}
</style>
