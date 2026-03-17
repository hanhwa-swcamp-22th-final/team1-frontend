<script setup>
/**
 * 셀러 주문 등록 화면.
 * 수동 등록 검증과 엑셀 업로드 미리보기까지 한 화면에서 처리한다.
 */
import { reactive, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import FileUpload from '@/components/common/FileUpload.vue'
import { parseExcel } from '@/utils/excel'
import {
  ORDER_PREVIEW_COLUMNS,
  ORDER_TEMPLATE_PREVIEW_ROWS,
  ORDER_UPLOAD_REQUIRED_COLUMNS,
  getMissingOrderUploadColumns,
  mapOrderUploadRows,
  validateOrderForm,
} from './orderRegister.utils'

/** Header 브레드크럼 표시용 */
const breadcrumb = [{ label: 'Seller' }, { label: '주문 등록' }]

// 업로드 영역에서 선택한 파일 이름을 즉시 보여주기 위한 상태값.
const selectedFileName = ref('')
// 실제 제출 API 연결 전까지 임시 완료 메시지를 보여준다.
const submitMessage = ref('')
// 업로드 처리 결과를 구분해서 보여주기 위한 성공/실패 상태값.
const uploadErrorMessage = ref('')
const uploadSuccessMessage = ref('')
// 업로드 전에는 샘플 포맷을, 성공 후에는 실제 업로드 결과를 표에 표시한다.
const previewRows = ref(ORDER_TEMPLATE_PREVIEW_ROWS)
const isPreviewSample = ref(true)

// 초기화 시 동일한 기본값을 재사용하기 위한 폼 생성 함수.
function createInitialForm() {
  return {
    orderNo: '',
    orderDate: '',
    salesChannel: '자사몰',
    recipient: '',
    contact: '',
    postalCode: '',
    address1: '',
    address2: '',
    sku: '',
    quantity: 1,
    memo: '',
  }
}

// 수동 단건 등록에 사용하는 메인 폼 상태.
const manualForm = ref(createInitialForm())
// BaseForm 에 바로 연결되는 필드별 검증 에러 상태.
const formErrors = reactive({
  orderNo: '',
  orderDate: '',
  recipient: '',
  contact: '',
  address1: '',
  sku: '',
  quantity: '',
})

// 제출 전이나 초기화 시 기존 검증 결과를 비운다.
function clearFormErrors() {
  Object.keys(formErrors).forEach((key) => {
    formErrors[key] = ''
  })
}

// 폼 값, 에러, 완료 메시지를 한 번에 초기 상태로 되돌린다.
function handleReset() {
  manualForm.value = createInitialForm()
  submitMessage.value = ''
  clearFormErrors()
}

// 로컬 검증을 수행하고 모든 항목이 통과한 경우에만 완료 메시지를 보여준다.
function handleManualSubmit() {
  submitMessage.value = ''
  clearFormErrors()

  const errors = validateOrderForm(manualForm.value)
  Object.entries(errors).forEach(([key, value]) => {
    formErrors[key] = value
  })

  if (Object.values(errors).some(Boolean)) return

  // TODO(frontend): 수동 등록 제출 API와 성공 응답 후처리를 연결한다.
  submitMessage.value = '주문 등록 준비가 완료되었습니다.'
}

// 업로드 실패나 초기 상태에서는 기본 샘플 미리보기로 되돌린다.
function resetUploadPreview() {
  previewRows.value = ORDER_TEMPLATE_PREVIEW_ROWS
  isPreviewSample.value = true
}

// 선택한 엑셀 파일을 파싱하고 필수 헤더 검증 후 미리보기 표에 반영한다.
async function handleFileSelected(file) {
  const targetFile = Array.isArray(file) ? file[0] : file

  selectedFileName.value = targetFile?.name ?? ''
  uploadErrorMessage.value = ''
  uploadSuccessMessage.value = ''

  if (!targetFile) {
    resetUploadPreview()
    return
  }

  try {
    const rows = await parseExcel(targetFile)

    if (!rows.length) {
      resetUploadPreview()
      uploadErrorMessage.value = '업로드한 파일에 주문 데이터가 없습니다.'
      return
    }

    const missingColumns = getMissingOrderUploadColumns(Object.keys(rows[0] ?? {}))
    if (missingColumns.length) {
      resetUploadPreview()
      uploadErrorMessage.value = `필수 컬럼이 누락되었습니다: ${missingColumns.join(', ')}`
      return
    }

    previewRows.value = mapOrderUploadRows(rows)
    isPreviewSample.value = false
    uploadSuccessMessage.value = `${targetFile.name} 파일에서 ${previewRows.value.length}건을 불러왔습니다.`
  } catch (error) {
    resetUploadPreview()
    uploadErrorMessage.value = '엑셀 파일을 읽지 못했습니다. 파일 형식을 확인하세요.'
  }
}
</script>

<template>
  <AppLayout title="주문 등록" :breadcrumb="breadcrumb">
    <section class="order-register-page">
      <!-- 현재 주문 등록 화면에서 다루는 범위를 먼저 안내하는 소개 카드 -->
      <div class="intro-card">
        <div>
          <p class="intro-eyebrow">Seller Order Intake</p>
          <h2 class="intro-title">단건 주문 등록과 엑셀 업로드를 한 화면에서 준비합니다.</h2>
          <p class="intro-description">
            이번 단계에서는 입력 화면 골격과 업로드 포맷을 먼저 정리합니다.
            실제 저장, 업로드 파싱, 검증 메시지는 다음 단계에서 연결합니다.
          </p>
        </div>

        <div class="intro-tags">
          <span class="intro-tag">단건 등록</span>
          <span class="intro-tag">엑셀 업로드</span>
          <span class="intro-tag">포맷 미리보기</span>
        </div>
      </div>

      <div class="register-grid">
        <!-- 단건 주문을 직접 입력하는 수동 등록 폼 -->
        <form class="form-card" @submit.prevent="handleManualSubmit">
          <div class="section-head">
            <div>
              <p class="section-eyebrow">Manual Entry</p>
              <h3 class="section-title">단건 주문 등록</h3>
            </div>
            <span class="section-caption">필수 항목 중심</span>
          </div>

          <div class="form-grid">
            <BaseForm label="주문번호" required hint="예: ORD-20260317-001" :error="formErrors.orderNo">
              <input v-model="manualForm.orderNo" type="text" placeholder="주문번호를 입력하세요" />
            </BaseForm>

            <BaseForm label="주문일자" required :error="formErrors.orderDate">
              <input v-model="manualForm.orderDate" type="date" />
            </BaseForm>

            <BaseForm label="판매 채널" required>
              <select v-model="manualForm.salesChannel">
                <option value="자사몰">자사몰</option>
                <option value="쿠팡">쿠팡</option>
                <option value="스마트스토어">스마트스토어</option>
                <option value="Amazon">Amazon</option>
              </select>
            </BaseForm>

            <BaseForm label="수령인" required :error="formErrors.recipient">
              <input v-model="manualForm.recipient" type="text" placeholder="수령인 이름" />
            </BaseForm>

            <BaseForm label="연락처" required hint="숫자와 하이픈 형식으로 정리 예정" :error="formErrors.contact">
              <input v-model="manualForm.contact" type="text" placeholder="010-0000-0000" />
            </BaseForm>

            <BaseForm label="우편번호">
              <input v-model="manualForm.postalCode" type="text" placeholder="06234" />
            </BaseForm>

            <BaseForm class="form-span-2" label="기본 배송지" required :error="formErrors.address1">
              <input v-model="manualForm.address1" type="text" placeholder="도로명 주소를 입력하세요" />
            </BaseForm>

            <BaseForm class="form-span-2" label="상세 배송지">
              <input v-model="manualForm.address2" type="text" placeholder="상세 주소를 입력하세요" />
            </BaseForm>

            <BaseForm label="SKU" required hint="영문/숫자/하이픈 형식 검증 예정" :error="formErrors.sku">
              <input v-model="manualForm.sku" type="text" placeholder="SKU-AMPLE-001" />
            </BaseForm>

            <BaseForm label="수량" required :error="formErrors.quantity">
              <input v-model="manualForm.quantity" type="number" min="1" step="1" />
            </BaseForm>

            <BaseForm class="form-span-2" label="배송 요청사항">
              <textarea
                v-model="manualForm.memo"
                rows="4"
                placeholder="공동현관 비밀번호, 부재 시 요청사항 등을 입력하세요"
              />
            </BaseForm>
          </div>

          <div class="form-actions">
            <button class="ui-btn ui-btn--ghost" type="button" @click="handleReset">초기화</button>
            <button class="ui-btn ui-btn--primary" type="submit">주문 등록</button>
          </div>

          <!-- 실제 주문 등록 API 연결 전까지 임시 완료 상태를 보여주는 안내 문구 -->
          <p v-if="submitMessage" class="submit-message">{{ submitMessage }}</p>
        </form>

        <!-- 이후 엑셀 업로드 기능 확장을 위한 안내 영역 -->
        <div class="upload-card">
          <div class="section-head">
            <div>
              <p class="section-eyebrow">Bulk Intake</p>
              <h3 class="section-title">엑셀 업로드 준비</h3>
            </div>
            <span class="section-caption">`.xlsx`, `.xls`</span>
          </div>

          <p class="upload-description">
            업로드 전에 필수 컬럼 구성을 맞춰두면 파일 선택 즉시 미리보기와 헤더 검증을 확인할 수 있습니다.
          </p>

          <FileUpload @file-selected="handleFileSelected" />

          <div class="upload-status">
            <span class="upload-status-label">선택 파일</span>
            <strong class="upload-status-value">
              {{ selectedFileName || '아직 선택된 파일이 없습니다' }}
            </strong>
          </div>

          <!-- 업로드 직후 파싱 성공 또는 실패 결과를 바로 알려준다. -->
          <p v-if="uploadErrorMessage" class="upload-feedback upload-feedback--error">
            {{ uploadErrorMessage }}
          </p>
          <p v-else-if="uploadSuccessMessage" class="upload-feedback upload-feedback--success">
            {{ uploadSuccessMessage }}
          </p>

          <div class="guide-card">
            <p class="guide-title">필수 컬럼</p>
            <ul class="guide-list">
              <li v-for="column in ORDER_UPLOAD_REQUIRED_COLUMNS" :key="column" class="guide-item">
                <span class="guide-dot" />
                <span>{{ column }}</span>
              </li>
            </ul>
            <p class="guide-note">
              `요청사항`, `판매채널` 같은 보조 컬럼은 다음 단계에서 선택 확장 가능합니다.
            </p>
          </div>
        </div>
      </div>

      <!-- 셀러가 확인할 업로드 포맷 예시를 보여주는 미리보기 테이블 -->
      <div class="preview-card">
        <div class="section-head">
          <div>
            <p class="section-eyebrow">Preview Format</p>
            <h3 class="section-title">엑셀 포맷 미리보기</h3>
          </div>
          <span class="section-caption">{{ isPreviewSample ? '샘플 1행' : `업로드 ${previewRows.length}건` }}</span>
        </div>

        <p class="preview-description">
          {{ isPreviewSample
            ? '업로드 전에는 샘플 포맷을 먼저 보여줍니다.'
            : '현재 표에는 업로드한 엑셀 데이터를 그대로 표시하고 있습니다.' }}
        </p>

        <BaseTable :columns="ORDER_PREVIEW_COLUMNS" :rows="previewRows" row-key="id" />
      </div>
    </section>
  </AppLayout>
</template>

<style scoped>
.order-register-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.intro-card,
.form-card,
.upload-card,
.preview-card {
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.intro-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-6);
  background:
    linear-gradient(135deg, rgba(76, 116, 255, 0.08), rgba(245, 166, 35, 0.08)),
    var(--surface);
}

.intro-eyebrow,
.section-eyebrow {
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--blue);
}

.intro-title {
  margin-top: var(--space-2);
  font-family: var(--font-condensed);
  font-size: 32px;
  line-height: 1.1;
  color: var(--t1);
}

.intro-description,
.upload-description,
.preview-description {
  margin-top: var(--space-3);
  max-width: 720px;
  font-size: var(--font-size-md);
  line-height: 1.6;
  color: var(--t3);
}

.intro-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.intro-tag {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(76, 116, 255, 0.12);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--t2);
}

.register-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.95fr);
  gap: var(--space-5);
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.section-title {
  margin-top: 4px;
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--t1);
}

.section-caption {
  font-size: var(--font-size-sm);
  color: var(--t3);
  white-space: nowrap;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.form-span-2 {
  grid-column: span 2;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.submit-message {
  margin-top: var(--space-4);
  padding: 12px 14px;
  border: 1px solid rgba(46, 204, 135, 0.24);
  border-radius: var(--radius-md);
  background: rgba(46, 204, 135, 0.08);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: #0f6b4b;
}

.upload-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.upload-status {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--surface-2);
}

.upload-status-label {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--t4);
}

.upload-status-value {
  font-size: var(--font-size-sm);
  color: var(--t2);
  word-break: break-word;
}

.upload-feedback {
  margin-top: calc(var(--space-4) * -0.5);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.upload-feedback--error {
  color: var(--danger, #d14343);
}

.upload-feedback--success {
  color: var(--success, #0f6b4b);
}

.guide-card {
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: linear-gradient(180deg, rgba(244, 246, 250, 0.7), rgba(255, 255, 255, 0.9));
}

.guide-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--t1);
}

.guide-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.guide-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-sm);
  color: var(--t2);
}

.guide-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background: var(--gold);
}

.guide-note {
  margin-top: var(--space-3);
  font-size: var(--font-size-xs);
  line-height: 1.5;
  color: var(--t3);
}

.preview-card {
  display: flex;
  flex-direction: column;
}

@media (max-width: 1200px) {
  .register-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .intro-card {
    flex-direction: column;
  }

  .intro-title {
    font-size: 28px;
  }

  .form-grid,
  .guide-list {
    grid-template-columns: 1fr;
  }

  .form-span-2 {
    grid-column: span 1;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
