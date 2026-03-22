<script setup>
/**
 * Seller 재고 상세 모달.
 * 재고 수량과 보관 위치, 회전 정보를 한 번에 보여준다.
 */
import SellerBaseModal from '@/components/seller/SellerBaseModal.vue'
import { getSellerInventoryStatusMeta } from '@/utils/seller/inventoryList.utils.js'

defineProps({
  isOpen: { type: Boolean, required: true },
  inventory: { type: Object, default: null },
  detail: { type: Object, default: null },
})

defineEmits(['cancel'])
</script>

<template>
  <SellerBaseModal
    :isOpen="isOpen"
    :title="inventory?.sku ? `${inventory.sku} 재고 상세` : '재고 상세'"
    size="tall"
    @cancel="$emit('cancel')"
  >
    <div v-if="inventory && detail" class="inventory-detail-modal">
      <section class="hero-card">
        <div>
          <p class="hero-eyebrow">Seller Inventory Detail</p>
          <h2 class="hero-title">{{ inventory.productName }}</h2>
          <p class="hero-copy">{{ detail.memo }}</p>
        </div>

        <div class="hero-meta">
          <span class="hero-chip">{{ inventory.warehouseName }}</span>
          <span
            class="inventory-status-badge"
            :class="`inventory-status-badge--${getSellerInventoryStatusMeta(inventory.status).tone}`"
          >
            {{ getSellerInventoryStatusMeta(inventory.status).label }}
          </span>
        </div>
      </section>

      <div class="summary-grid">
        <section class="summary-card">
          <span class="summary-label">가용재고</span>
          <strong>{{ inventory.availableStock.toLocaleString() }}</strong>
          <span class="summary-sub">{{ detail.availableRate }}%</span>
        </section>
        <section class="summary-card">
          <span class="summary-label">할당재고</span>
          <strong>{{ inventory.allocatedStock.toLocaleString() }}</strong>
          <span class="summary-sub">{{ detail.allocatedRate }}%</span>
        </section>
        <section class="summary-card">
          <span class="summary-label">총재고</span>
          <strong>{{ inventory.totalStock.toLocaleString() }}</strong>
        </section>
        <section class="summary-card">
          <span class="summary-label">입고예정</span>
          <strong>{{ inventory.inboundExpected.toLocaleString() }}</strong>
        </section>
      </div>

      <div class="info-grid">
        <section class="detail-card">
          <h3 class="detail-title">보관 정보</h3>
          <dl class="detail-list">
            <div>
              <dt>SKU</dt>
              <dd>{{ inventory.sku }}</dd>
            </div>
            <div>
              <dt>보관 위치</dt>
              <dd>{{ detail.locationCode }}</dd>
            </div>
            <div>
              <dt>최근 입고일</dt>
              <dd>{{ inventory.lastInboundDate }}</dd>
            </div>
            <div>
              <dt>최근 실사일</dt>
              <dd>{{ detail.lastCycleCount }}</dd>
            </div>
          </dl>
        </section>

        <section class="detail-card">
          <h3 class="detail-title">운영 지표</h3>
          <dl class="detail-list">
            <div>
              <dt>경고 임계치</dt>
              <dd>{{ inventory.warningThreshold }}</dd>
            </div>
            <div>
              <dt>안전재고 일수</dt>
              <dd>{{ detail.safetyStockDays }}일</dd>
            </div>
            <div>
              <dt>커버리지</dt>
              <dd>{{ detail.coverageDays }}일</dd>
            </div>
            <div>
              <dt>회전율</dt>
              <dd>{{ detail.turnoverRate }}</dd>
            </div>
          </dl>
        </section>

        <section class="detail-card">
          <h3 class="detail-title">연계 정보</h3>
          <dl class="detail-list">
            <div>
              <dt>다음 입고 ASN</dt>
              <dd>{{ detail.nextInboundAsnNo }}</dd>
            </div>
            <div>
              <dt>판매 채널</dt>
              <dd>{{ detail.salesChannel }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>

    <template #footer>
      <button type="button" class="ui-btn ui-btn--ghost" @click="$emit('cancel')">닫기</button>
    </template>
  </SellerBaseModal>
</template>

<style scoped>
.inventory-detail-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.hero-card,
.summary-card,
.detail-card {
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

.hero-copy {
  margin: 0;
  color: var(--t3);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: flex-end;
  gap: var(--space-2);
}

.hero-chip,
.inventory-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.hero-chip {
  background: rgba(15, 23, 42, 0.08);
  color: var(--t1);
}

.inventory-status-badge--green {
  background: var(--green-pale);
  color: var(--green);
}

.inventory-status-badge--amber {
  background: var(--gold-pale);
  color: #92400e;
}

.inventory-status-badge--red {
  background: var(--red-pale);
  color: #7f1d1d;
}

.inventory-status-badge--default {
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

.summary-label,
.summary-sub {
  color: var(--t3);
  font-size: var(--font-size-xs);
}

.summary-card strong {
  color: var(--t1);
  font-size: var(--font-size-lg);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.detail-title {
  margin: 0 0 var(--space-4);
  color: var(--t1);
  font-size: var(--font-size-md);
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
