<script setup>
/**
 * Seller 상품 상세 모달.
 * 상품 기본 정보와 가격, 재고, 운영 메모를 한 번에 확인한다.
 */
import SellerBaseModal from '@/components/seller/SellerBaseModal.vue'
import { getSellerProductStatusMeta } from '@/utils/seller/productList.utils.js'

defineProps({
  isOpen: { type: Boolean, required: true },
  product: { type: Object, default: null },
  detail: { type: Object, default: null },
})

defineEmits(['cancel'])

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`
}
</script>

<template>
  <SellerBaseModal
    :isOpen="isOpen"
    :title="product?.sku ? `${product.sku} 상품 상세` : '상품 상세'"
    size="tall"
    @cancel="$emit('cancel')"
  >
    <div v-if="product && detail" class="product-detail-modal">
      <section class="hero-card">
        <div class="hero-copy-wrap">
          <p class="hero-eyebrow">Seller Product Detail</p>
          <h2 class="hero-title">{{ product.productName }}</h2>
          <p class="hero-description">{{ detail.description }}</p>
        </div>

        <div class="hero-meta">
          <span class="sku-chip">{{ product.sku }}</span>
          <span
            class="product-status-badge"
            :class="`product-status-badge--${getSellerProductStatusMeta(product.status).tone}`"
          >
            {{ getSellerProductStatusMeta(product.status).label }}
          </span>
        </div>
      </section>

      <div class="summary-grid">
        <section class="summary-card">
          <span class="summary-label">판매가</span>
          <strong>{{ formatCurrency(product.salePrice) }}</strong>
        </section>
        <section class="summary-card">
          <span class="summary-label">원가</span>
          <strong>{{ formatCurrency(product.costPrice) }}</strong>
        </section>
        <section class="summary-card">
          <span class="summary-label">마진</span>
          <strong>{{ formatCurrency(detail.marginAmount) }}</strong>
          <span class="summary-sub">{{ detail.marginRate }}%</span>
        </section>
        <section class="summary-card">
          <span class="summary-label">총 재고</span>
          <strong>{{ detail.totalStock }}</strong>
          <span class="summary-sub">가용 {{ product.availableStock }} / 할당 {{ product.allocatedStock }}</span>
        </section>
      </div>

      <div class="info-grid">
        <section class="detail-card">
          <h3 class="detail-title">상품 정보</h3>
          <dl class="detail-list">
            <div>
              <dt>브랜드</dt>
              <dd>{{ detail.brand }}</dd>
            </div>
            <div>
              <dt>카테고리</dt>
              <dd>{{ product.category }}</dd>
            </div>
            <div>
              <dt>보관 창고</dt>
              <dd>{{ product.warehouseName }}</dd>
            </div>
            <div>
              <dt>바코드</dt>
              <dd>{{ detail.barcode }}</dd>
            </div>
          </dl>
        </section>

        <section class="detail-card">
          <h3 class="detail-title">통관 / 규격</h3>
          <dl class="detail-list">
            <div>
              <dt>원산지</dt>
              <dd>{{ detail.originCountry }}</dd>
            </div>
            <div>
              <dt>HS Code</dt>
              <dd>{{ detail.hsCode }}</dd>
            </div>
            <div>
              <dt>신고가</dt>
              <dd>{{ formatCurrency(detail.customsValue) }}</dd>
            </div>
            <div>
              <dt>중량 / 치수</dt>
              <dd>{{ detail.unitWeightLbs }} lbs / {{ detail.dimensions }}</dd>
            </div>
          </dl>
        </section>

        <section class="detail-card">
          <h3 class="detail-title">운영 정보</h3>
          <dl class="detail-list">
            <div>
              <dt>리드타임</dt>
              <dd>{{ detail.leadTimeDays }}일</dd>
            </div>
            <div>
              <dt>유통기한</dt>
              <dd>{{ detail.shelfLifeMonths }}개월</dd>
            </div>
            <div>
              <dt>운영 메모</dt>
              <dd>{{ detail.memo }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section class="detail-card">
        <div class="detail-head">
          <h3 class="detail-title">태그</h3>
          <span class="detail-count">{{ detail.keywords.length }}개</span>
        </div>

        <div class="keyword-list">
          <span v-for="keyword in detail.keywords" :key="keyword" class="keyword-chip">
            {{ keyword }}
          </span>
        </div>
      </section>
    </div>

    <template #footer>
      <button type="button" class="ui-btn ui-btn--ghost" @click="$emit('cancel')">닫기</button>
    </template>
  </SellerBaseModal>
</template>

<style scoped>
.product-detail-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.hero-card,
.detail-card,
.summary-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5);
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

.hero-description {
  margin: 0;
  color: var(--t3);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-content: flex-start;
  gap: var(--space-2);
}

.sku-chip,
.product-status-badge,
.keyword-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
  white-space: nowrap;
}

.sku-chip {
  background: rgba(15, 23, 42, 0.08);
  color: var(--t1);
}

.product-status-badge--green {
  background: var(--green-pale);
  color: var(--green);
}

.product-status-badge--amber {
  background: var(--gold-pale);
  color: #92400e;
}

.product-status-badge--red {
  background: var(--red-pale);
  color: #7f1d1d;
}

.product-status-badge--blue {
  background: var(--blue-pale);
  color: #3730a3;
}

.product-status-badge--default {
  background: var(--surface);
  color: var(--t3);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

.summary-card,
.detail-card {
  padding: var(--space-4);
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-card strong {
  color: var(--t1);
  font-size: var(--font-size-lg);
}

.summary-label,
.summary-sub {
  color: var(--t3);
  font-size: var(--font-size-xs);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.detail-title {
  margin: 0 0 var(--space-4);
  color: var(--t1);
  font-size: var(--font-size-md);
}

.detail-count {
  color: var(--t3);
  font-size: var(--font-size-sm);
  font-weight: 600;
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

.keyword-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.keyword-chip {
  background: rgba(59, 130, 246, 0.1);
  color: var(--blue);
}

@media (max-width: 960px) {
  .hero-card,
  .hero-meta {
    flex-direction: column;
  }

  .summary-grid,
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
