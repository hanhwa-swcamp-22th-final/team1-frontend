<script setup>
/**
 * Seller 엑셀 업로드 결과 모달.
 * 업로드한 주문 파일 요약 결과를 보여준다.
 */
import SellerBaseModal from '@/components/seller/SellerBaseModal.vue'

defineProps({
  isOpen: { type: Boolean, required: true },
  summary: { type: Object, default: null },
})

const emit = defineEmits(['cancel'])
</script>

<template>
  <SellerBaseModal
    :isOpen="isOpen"
    title="엑셀 업로드 결과"
    size="default"
    @cancel="emit('cancel')"
  >
    <div v-if="summary" class="upload-result-modal">
      <section class="hero-card">
        <div>
          <p class="hero-eyebrow">Seller Upload Result</p>
          <h2 class="hero-title">{{ summary.fileName || '업로드 파일' }}</h2>
          <p class="hero-copy">
            {{ summary.errorCount
              ? `검증 오류 ${summary.errorCount}건을 수정한 뒤 다시 업로드하세요.`
              : '업로드 검증이 완료되었습니다.' }}
          </p>
        </div>
      </section>

      <div class="summary-grid">
        <section class="summary-card">
          <span class="summary-label">업로드 주문 수</span>
          <strong>{{ summary.rowCount }}</strong>
        </section>
        <section class="summary-card">
          <span class="summary-label">총 수량</span>
          <strong>{{ summary.totalQuantity }}</strong>
        </section>
        <section class="summary-card">
          <span class="summary-label">고유 SKU</span>
          <strong>{{ summary.uniqueSkuCount }}</strong>
        </section>
        <section class="summary-card">
          <span class="summary-label">수령인 수</span>
          <strong>{{ summary.uniqueRecipientCount }}</strong>
        </section>
      </div>

      <section class="detail-card">
        <dl class="detail-list">
          <div>
            <dt>첫 주문번호</dt>
            <dd>{{ summary.firstOrderNo }}</dd>
          </div>
          <div>
            <dt>검증 대상 행</dt>
            <dd>{{ summary.totalRows }}</dd>
          </div>
          <div>
            <dt>검증 통과 행</dt>
            <dd>{{ summary.validRows }}</dd>
          </div>
          <div>
            <dt>검증 오류</dt>
            <dd>{{ summary.errorCount ? `${summary.errorCount}건` : '없음' }}</dd>
          </div>
          <div>
            <dt>안내</dt>
            <dd>
              {{ summary.errorCount
                ? '오류 행을 수정한 뒤 다시 검증하세요.'
                : '미리보기를 확인한 뒤 업로드 주문 저장을 진행하세요.' }}
            </dd>
          </div>
        </dl>

        <div v-if="summary.errorCount" class="validation-errors">
          <strong class="validation-errors__title">검증 오류 목록</strong>
          <ul class="validation-errors__list">
            <li
              v-for="error in summary.errors"
              :key="`${error.row}-${error.message}`"
              class="validation-errors__item"
            >
              <span class="validation-errors__row">{{ error.row ? `${error.row}행` : '행 정보 없음' }}</span>
              <span>{{ error.message }}</span>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <template #footer>
      <button type="button" class="ui-btn ui-btn--ghost" @click="emit('cancel')">닫기</button>
      <button type="button" class="ui-btn ui-btn--primary" @click="emit('cancel')">미리보기 확인</button>
    </template>
  </SellerBaseModal>
</template>

<style scoped>
.upload-result-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.hero-card,
.summary-card,
.detail-card {
  padding: var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.hero-card {
  background: var(--surface-2);
}

.hero-eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--blue);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-title {
  margin: 0 0 var(--space-2);
  color: var(--t1);
  font-size: var(--font-size-xl);
}

.hero-copy {
  margin: 0;
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-label {
  color: var(--t3);
  font-size: var(--font-size-xs);
}

.summary-card strong {
  color: var(--t1);
  font-size: var(--font-size-lg);
}

.detail-list {
  display: grid;
  gap: var(--space-3);
  margin: 0;
}

.detail-list div {
  display: grid;
  gap: 4px;
}

.detail-list dt {
  color: var(--t3);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
}

.detail-list dd {
  margin: 0;
  color: var(--t1);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.validation-errors {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.validation-errors__title {
  color: var(--red);
  font-size: var(--font-size-sm);
}

.validation-errors__list {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding-left: 18px;
}

.validation-errors__item {
  color: var(--t2);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.validation-errors__row {
  margin-right: 6px;
  color: var(--red);
  font-weight: 700;
}

@media (max-width: 720px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
