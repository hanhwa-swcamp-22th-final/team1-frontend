<script setup>
/**
 * 셀러 ASN 등록 화면.
 * 피그마 스크린샷 기준으로 섹션형 입력 화면을 맞추고, 저장은 UI 메시지로만 처리한다.
 */
import { computed, reactive, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import {
  calculateAsnSummary,
  createInitialAsnFieldErrors,
  createInitialAsnForm,
  createInitialAsnLine,
  createInitialAsnLineError,
  getAsnProductBySku,
  SELLER_ASN_PRODUCT_OPTIONS,
  SELLER_ASN_WAREHOUSE_OPTIONS,
  validateAsnForm,
} from '../../utils/asnCreate.utils.js'

/** Header 브레드크럼 표시용 */
const breadcrumb = [{ label: 'Seller' }, { label: 'ASN 등록' }]

// 새 ASN 초안을 보이게 하기 위한 시퀀스 상태.
const asnSequence = ref(1)
// 품목 라인 고유 id를 만들기 위한 시퀀스 상태.
const lineSequence = ref(1)

// ASN 기본 정보, 품목 라인, 첨부 파일 이름 상태.
const asnForm = ref(createInitialAsnForm(asnSequence.value))
const lineItems = ref([createInitialAsnLine(lineSequence.value)])
const selectedAttachmentName = ref('')

// 기본 정보와 품목 라인 에러를 분리해 화면에 바로 연결한다.
const fieldErrors = reactive(createInitialAsnFieldErrors())
const lineErrors = ref([createInitialAsnLineError()])

// 버튼 클릭 후 사용자에게 보여줄 UI 메시지 상태.
const draftMessage = ref('')
const submitMessage = ref('')
const submitErrorMessage = ref('')

// 우측 요약 카드에 표시할 값을 현재 입력 상태로 계산한다.
const summary = computed(() => calculateAsnSummary(lineItems.value))
const selectedWarehouseName = computed(() => {
  return SELLER_ASN_WAREHOUSE_OPTIONS.find((item) => item.id === asnForm.value.warehouseId)?.name ?? '-'
})

// 메시지는 한 번에 하나만 보여주도록 제출 관련 문구를 초기화한다.
function clearMessages() {
  draftMessage.value = ''
  submitMessage.value = ''
  submitErrorMessage.value = ''
}

// 기본 정보 영역의 에러 상태를 초기화한다.
function clearFieldErrors() {
  const nextErrors = createInitialAsnFieldErrors()
  Object.keys(fieldErrors).forEach((key) => {
    fieldErrors[key] = nextErrors[key]
  })
}

// 현재 품목 수에 맞게 라인 에러 배열을 다시 만든다.
function resetLineErrors() {
  lineErrors.value = lineItems.value.map(() => createInitialAsnLineError())
}

// 새 초안을 시작할 때 입력값과 상태를 처음으로 되돌린다.
function resetAsnDraft() {
  asnSequence.value += 1
  lineSequence.value = 1
  asnForm.value = createInitialAsnForm(asnSequence.value)
  lineItems.value = [createInitialAsnLine(lineSequence.value)]
  selectedAttachmentName.value = ''
  clearMessages()
  clearFieldErrors()
  resetLineErrors()
}

// 입고 상품 목록에 새 라인을 추가한다.
function handleAddLine() {
  lineSequence.value += 1
  lineItems.value.push(createInitialAsnLine(lineSequence.value))
  lineErrors.value.push(createInitialAsnLineError())
}

// 최소 1개 라인은 남겨 두고 나머지만 삭제할 수 있게 한다.
function handleRemoveLine(index) {
  if (lineItems.value.length === 1) return

  lineItems.value.splice(index, 1)
  lineErrors.value.splice(index, 1)
}

// 선택한 SKU에 맞춰 상품명과 현재 가용재고를 자동 반영한다.
function handleSkuChange(index, sku) {
  const product = getAsnProductBySku(sku)

  lineItems.value[index].productName = product?.productName ?? ''
  lineItems.value[index].availableStock = product?.availableStock ?? ''
}

// 첨부 파일은 UI 확인용으로 파일명만 보여준다.
function handleAttachmentChange(event) {
  const file = event.target.files?.[0]
  selectedAttachmentName.value = file?.name ?? ''
}

// 임시저장은 실제 저장 대신 초안 메시지만 보여준다.
function handleDraftSave() {
  clearMessages()
  draftMessage.value = `${asnForm.value.asnNo} 임시저장 초안이 준비되었습니다.`
}

// 최종 등록 버튼은 필수 입력을 확인한 뒤 완료 메시지를 보여준다.
function handleSubmit() {
  clearMessages()
  clearFieldErrors()
  resetLineErrors()

  const result = validateAsnForm(asnForm.value, lineItems.value)

  Object.entries(result.fieldErrors).forEach(([key, value]) => {
    fieldErrors[key] = value
  })
  lineErrors.value = result.lineErrors

  const hasFieldError = Object.values(result.fieldErrors).some(Boolean)
  const hasLineError = result.lineErrors.some((lineError) => Object.values(lineError).some(Boolean))

  if (hasFieldError || hasLineError) {
    submitErrorMessage.value = '필수 입력값을 확인한 뒤 다시 저장하세요.'
    return
  }

  submitMessage.value = `${asnForm.value.asnNo} ASN 등록 준비가 완료되었습니다. 실제 저장은 다음 단계에서 연결합니다.`
}
</script>

<template>
  <AppLayout title="ASN 등록" :breadcrumb="breadcrumb">
    <section class="asn-register-page">
      <div class="asn-layout">
        <div class="asn-main">
          <!-- 상단 입고 정보 카드 -->
          <section class="panel-card">
            <header class="panel-header">
              <h2 class="panel-title">입고 정보</h2>
            </header>

            <div class="info-grid info-grid--4">
              <BaseForm label="ASN 번호">
                <input :value="asnForm.asnNo" type="text" readonly />
              </BaseForm>

              <BaseForm label="입고 예정일" required :error="fieldErrors.expectedDate">
                <input v-model="asnForm.expectedDate" type="date" />
              </BaseForm>

              <BaseForm label="목적 창고" required :error="fieldErrors.warehouseId">
                <select v-model="asnForm.warehouseId">
                  <option value="">창고를 선택하세요</option>
                  <option
                    v-for="warehouse in SELLER_ASN_WAREHOUSE_OPTIONS"
                    :key="warehouse.id"
                    :value="warehouse.id"
                  >
                    {{ warehouse.name }}
                  </option>
                </select>
              </BaseForm>

              <BaseForm label="운송 방법" required :error="fieldErrors.shippingMethod">
                <input v-model="asnForm.shippingMethod" type="text" placeholder="예: 해상 / 항공 / 육로" />
              </BaseForm>
            </div>
          </section>

          <!-- 발송지 입력 카드 -->
          <section class="panel-card">
            <header class="panel-header">
              <h2 class="panel-title">발송지 정보</h2>
            </header>

            <div class="info-grid info-grid--2">
              <BaseForm label="발송인">
                <input v-model="asnForm.senderName" type="text" />
              </BaseForm>

              <BaseForm label="발송 국가" required :error="fieldErrors.originCountry">
                <input v-model="asnForm.originCountry" type="text" placeholder="예: 대한민국" />
              </BaseForm>

              <BaseForm label="주소" required :error="fieldErrors.senderAddress">
                <input v-model="asnForm.senderAddress" type="text" placeholder="발송 주소를 입력하세요" />
              </BaseForm>

              <BaseForm label="연락처" required :error="fieldErrors.senderPhone">
                <input v-model="asnForm.senderPhone" type="text" placeholder="010-0000-0000" />
              </BaseForm>
            </div>
          </section>

          <!-- 상품 목록은 테이블형 입력으로 구성한다. -->
          <section class="panel-card">
            <header class="panel-header panel-header--actions">
              <h2 class="panel-title">입고 상품 목록</h2>
              <button class="ui-btn ui-btn--ghost add-item-btn" type="button" @click="handleAddLine">
                + 상품 추가
              </button>
            </header>

            <p v-if="fieldErrors.lineItems" class="panel-message panel-message--error">
              {{ fieldErrors.lineItems }}
            </p>

            <div class="line-table">
              <div class="line-table-head">
                <span>SKU</span>
                <span>상품명</span>
                <span>현재 가용재고</span>
                <span>입고 수량</span>
                <span>박스 수</span>
                <span />
              </div>

              <div
                v-for="(line, index) in lineItems"
                :key="line.id"
                class="line-table-row"
              >
                <div class="line-cell">
                  <select v-model="line.sku" @change="handleSkuChange(index, line.sku)">
                    <option value="">SKU</option>
                    <option
                      v-for="product in SELLER_ASN_PRODUCT_OPTIONS"
                      :key="product.sku"
                      :value="product.sku"
                    >
                      {{ product.sku }}
                    </option>
                  </select>
                  <p v-if="lineErrors[index]?.sku" class="cell-error">{{ lineErrors[index].sku }}</p>
                </div>

                <div class="line-cell">
                  <input :value="line.productName" type="text" placeholder="-" readonly />
                </div>

                <div class="line-cell">
                  <input :value="line.availableStock" type="text" placeholder="-" readonly />
                </div>

                <div class="line-cell">
                  <input v-model="line.quantity" type="number" min="1" step="1" placeholder="0" />
                  <p v-if="lineErrors[index]?.quantity" class="cell-error">{{ lineErrors[index].quantity }}</p>
                </div>

                <div class="line-cell">
                  <input v-model="line.cartonCount" type="number" min="1" step="1" placeholder="0" />
                  <p v-if="lineErrors[index]?.cartonCount" class="cell-error">{{ lineErrors[index].cartonCount }}</p>
                </div>

                <div class="line-cell line-cell--action">
                  <button
                    class="line-remove-btn"
                    type="button"
                    :disabled="lineItems.length === 1"
                    @click="handleRemoveLine(index)"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- 비고 입력 카드 -->
          <section class="panel-card">
            <header class="panel-header">
              <h2 class="panel-title">비고</h2>
            </header>

            <textarea
              v-model="asnForm.note"
              class="note-textarea"
              rows="4"
              placeholder="특이사항, 취급 주의사항 등을 입력하세요."
            />
          </section>

          <div class="page-actions">
            <button class="ui-btn ui-btn--ghost" type="button" @click="resetAsnDraft">
              취소
            </button>
            <button class="ui-btn ui-btn--ghost" type="button" @click="handleDraftSave">
              임시저장
            </button>
            <button class="ui-btn ui-btn--primary" type="button" @click="handleSubmit">
              ASN 등록
            </button>
          </div>

          <p v-if="draftMessage" class="panel-message panel-message--success">{{ draftMessage }}</p>
          <p v-if="submitErrorMessage" class="panel-message panel-message--error">{{ submitErrorMessage }}</p>
          <p v-if="submitMessage" class="panel-message panel-message--success">{{ submitMessage }}</p>
        </div>

        <aside class="asn-side">
          <!-- 우측 요약 카드 -->
          <section class="side-card">
            <header class="panel-header">
              <h2 class="panel-title">입고 요약</h2>
            </header>

            <div class="summary-list">
              <div class="summary-row">
                <span class="summary-key">ASN 번호</span>
                <strong class="summary-value">{{ asnForm.asnNo }}</strong>
              </div>
              <div class="summary-row">
                <span class="summary-key">목적 창고</span>
                <strong class="summary-value">{{ selectedWarehouseName }}</strong>
              </div>
              <div class="summary-row">
                <span class="summary-key">총 SKU 종류</span>
                <strong class="summary-value summary-value--accent">{{ summary.skuCount }}</strong>
              </div>
              <div class="summary-row">
                <span class="summary-key">총 입고 수량</span>
                <strong class="summary-value">{{ summary.totalQuantity }}</strong>
              </div>
            </div>
          </section>

          <!-- 첨부는 파일명만 보여주는 UI placeholder로 둔다. -->
          <section class="side-card">
            <header class="panel-header">
              <h2 class="panel-title">파일 첨부</h2>
            </header>

            <label class="upload-dropzone">
              <input class="sr-only" type="file" @change="handleAttachmentChange" />
              <span class="upload-icon">↑</span>
              <span class="upload-text">운송장, 인보이스 첨부</span>
              <span class="upload-subtext">PDF, JPG, PNG, 최대 10MB</span>
            </label>

            <p class="upload-file-name">
              {{ selectedAttachmentName || '선택된 파일이 없습니다.' }}
            </p>
          </section>

          <section class="side-card side-card--notice">
            <header class="panel-header">
              <h2 class="panel-title">입고 처리 흐름</h2>
            </header>

            <p class="notice-text">
              ASN 등록 → 입고 예정 반영 → 창고 측 확인 → 검수/실입수량 반영
            </p>
          </section>
        </aside>
      </div>
    </section>
  </AppLayout>
</template>

<style scoped>
.asn-register-page {
  display: flex;
  flex-direction: column;
}

.asn-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: var(--space-3);
  align-items: start;
}

.asn-main,
.asn-side {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.panel-card,
.side-card {
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.panel-header--actions {
  margin-bottom: var(--space-3);
}

.panel-title {
  position: relative;
  margin: 0;
  padding-left: 10px;
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--t1);
}

.panel-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  width: 3px;
  height: 12px;
  border-radius: var(--radius-full);
  background: var(--gold);
}

.info-grid {
  display: grid;
  gap: var(--space-3);
}

.info-grid--4 {
  grid-template-columns: repeat(4, minmax(140px, 1fr));
}

.info-grid--2 {
  grid-template-columns: repeat(2, minmax(180px, 1fr));
}

.add-item-btn {
  min-height: 32px;
  padding: 0 var(--space-3);
  font-size: var(--font-size-sm);
}

.line-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.line-table-head,
.line-table-row {
  display: grid;
  grid-template-columns: 1.15fr 1.45fr 1fr 0.8fr 0.8fr 0.45fr;
  gap: 10px;
  align-items: start;
}

.line-table-head {
  padding: var(--space-3) var(--space-4);
  background: var(--surface-2);
  color: var(--t3);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.line-table-row {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border);
}

.line-cell {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.line-cell select,
.line-cell input,
.note-textarea {
  width: 100%;
  min-height: 36px;
  padding: 9px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
  outline: none;
  transition:
    border-color var(--ease-fast),
    box-shadow var(--ease-fast),
    background var(--ease-fast);
}

.line-cell select:focus,
.line-cell input:focus,
.note-textarea:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--blue-pale);
}

.line-cell input[readonly] {
  background: var(--surface-2);
  color: var(--t3);
}

.line-remove-btn {
  align-self: center;
  margin-top: 5px;
  border: 0;
  background: transparent;
  color: var(--t3);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.line-remove-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cell-error,
.panel-message {
  margin: 0;
  font-size: var(--font-size-xs);
  line-height: 1.5;
}

.panel-message--error,
.cell-error {
  color: var(--red);
}

.panel-message--success {
  color: var(--green);
}

.note-textarea {
  min-height: 74px;
  resize: vertical;
}

.page-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.page-actions .ui-btn {
  min-width: 72px;
  min-height: 34px;
  padding: 0 var(--space-3);
  font-size: var(--font-size-sm);
}

.summary-list {
  display: flex;
  flex-direction: column;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border);
}

.summary-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.summary-key {
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.summary-value {
  color: var(--t1);
  font-size: var(--font-size-sm);
  font-weight: 700;
  text-align: right;
}

.summary-value--accent {
  color: var(--gold);
}

.upload-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-height: 116px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-2);
  text-align: center;
  cursor: pointer;
  transition:
    border-color var(--ease-fast),
    background var(--ease-fast);
}

.upload-dropzone:hover {
  border-color: var(--blue);
  background: var(--blue-pale);
}

.upload-icon {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-dk);
  border-radius: var(--radius-sm);
  color: var(--t4);
  font-size: var(--font-size-sm);
}

.upload-text {
  color: var(--t2);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.upload-subtext {
  color: var(--t4);
  font-size: var(--font-size-xs);
}

.upload-file-name {
  margin: var(--space-3) 0 0;
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.side-card--notice {
  border-color: #f3d48d;
  background: #fffaf0;
}

.notice-text {
  margin: 0;
  color: #8a5a00;
  font-size: var(--font-size-sm);
  line-height: 1.7;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 1200px) {
  .asn-layout {
    grid-template-columns: 1fr;
  }

  .asn-side {
    order: -1;
  }
}

@media (max-width: 960px) {
  .info-grid--4,
  .info-grid--2,
  .line-table-head,
  .line-table-row {
    grid-template-columns: 1fr;
  }

  .line-table-head {
    display: none;
  }

  .line-table-row {
    padding: 12px 0;
  }

  .line-cell--action {
    align-items: flex-end;
  }
}
</style>
