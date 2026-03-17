<script setup>
/**
 * SellerOrderRegisterView — Seller 주문 등록 화면 골격
 *
 * 현재 단계:
 *   - 수동 단건 등록 영역 배치
 *   - 엑셀 업로드 가이드 및 포맷 미리보기 배치
 *   - 실제 제출/API 연동은 후속 단계에서 연결 예정
 */
import { ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import FileUpload from '@/components/common/FileUpload.vue'
import {
  ORDER_PREVIEW_COLUMNS,
  ORDER_TEMPLATE_PREVIEW_ROWS,
  ORDER_UPLOAD_REQUIRED_COLUMNS,
} from './orderRegister.utils'

/** Header 브레드크럼 표시용 */
const breadcrumb = [{ label: 'Seller' }, { label: '주문 등록' }]

const selectedFileName = ref('')
// TODO(frontend): 수동 등록 제출 API와 필드별 검증 규칙을 연결한다.
const manualForm = ref({
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
})
// TODO(frontend): 업로드 파일 파싱 결과를 BaseTable 미리보기에 연결한다.
</script>

<template>
  <AppLayout title="주문 등록" :breadcrumb="breadcrumb">
    <section class="order-register-page">
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
        <form class="form-card" @submit.prevent>
          <div class="section-head">
            <div>
              <p class="section-eyebrow">Manual Entry</p>
              <h3 class="section-title">단건 주문 등록</h3>
            </div>
            <span class="section-caption">필수 항목 중심</span>
          </div>

          <div class="form-grid">
            <BaseForm label="주문번호" required hint="예: ORD-20260317-001">
              <input v-model="manualForm.orderNo" type="text" placeholder="주문번호를 입력하세요" />
            </BaseForm>

            <BaseForm label="주문일자" required>
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

            <BaseForm label="수령인" required>
              <input v-model="manualForm.recipient" type="text" placeholder="수령인 이름" />
            </BaseForm>

            <BaseForm label="연락처" required hint="숫자와 하이픈 형식으로 정리 예정">
              <input v-model="manualForm.contact" type="text" placeholder="010-0000-0000" />
            </BaseForm>

            <BaseForm label="우편번호">
              <input v-model="manualForm.postalCode" type="text" placeholder="06234" />
            </BaseForm>

            <BaseForm class="form-span-2" label="기본 배송지" required>
              <input v-model="manualForm.address1" type="text" placeholder="도로명 주소를 입력하세요" />
            </BaseForm>

            <BaseForm class="form-span-2" label="상세 배송지">
              <input v-model="manualForm.address2" type="text" placeholder="상세 주소를 입력하세요" />
            </BaseForm>

            <BaseForm label="SKU" required hint="영문/숫자/하이픈 형식 검증 예정">
              <input v-model="manualForm.sku" type="text" placeholder="SKU-AMPLE-001" />
            </BaseForm>

            <BaseForm label="수량" required>
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
            <button class="ui-btn ui-btn--ghost" type="button">초기화</button>
            <button class="ui-btn ui-btn--primary" type="submit">주문 등록</button>
          </div>
        </form>

        <div class="upload-card">
          <div class="section-head">
            <div>
              <p class="section-eyebrow">Bulk Intake</p>
              <h3 class="section-title">엑셀 업로드 준비</h3>
            </div>
            <span class="section-caption">`.xlsx`, `.xls`</span>
          </div>

          <p class="upload-description">
            업로드 전에 필수 컬럼 구성을 맞춰두면 다음 단계에서 바로 미리보기와 검증을 연결할 수 있습니다.
          </p>

          <FileUpload
            @file-selected="selectedFileName = Array.isArray($event) ? $event.map((file) => file.name).join(', ') : $event?.name ?? ''"
          />

          <div class="upload-status">
            <span class="upload-status-label">선택 파일</span>
            <strong class="upload-status-value">
              {{ selectedFileName || '아직 선택된 파일이 없습니다' }}
            </strong>
          </div>

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

      <div class="preview-card">
        <div class="section-head">
          <div>
            <p class="section-eyebrow">Preview Format</p>
            <h3 class="section-title">엑셀 포맷 미리보기</h3>
          </div>
          <span class="section-caption">샘플 1행</span>
        </div>

        <p class="preview-description">
          실제 업로드 파싱 전 단계라 샘플 포맷만 먼저 노출합니다.
          다음 단계에서는 업로드 결과를 이 표에 그대로 연결합니다.
        </p>

        <BaseTable :columns="ORDER_PREVIEW_COLUMNS" :rows="ORDER_TEMPLATE_PREVIEW_ROWS" row-key="id" />
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
