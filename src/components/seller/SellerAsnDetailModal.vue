<script setup>
/**
 * Seller ASN 상세 모달.
 * ASN 기본 정보와 운송/서류/품목 구성을 한 번에 보여준다.
 */
import SellerBaseModal from '@/components/seller/SellerBaseModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

defineProps({
  isOpen: { type: Boolean, required: true },
  asn: { type: Object, default: null },
  detail: { type: Object, default: null },
})

defineEmits(['cancel'])
</script>

<template>
  <SellerBaseModal
    :isOpen="isOpen"
    :title="asn?.asnNo ? `${asn.asnNo} 상세` : 'ASN 상세'"
    size="tall"
    @cancel="$emit('cancel')"
  >
    <div v-if="asn && detail" class="asn-detail-modal">
      <section class="hero-card">
        <div>
          <p class="hero-eyebrow">Seller ASN Detail</p>
          <h2 class="hero-title">{{ asn.asnNo }}</h2>
          <p class="hero-copy">{{ asn.note }}</p>
        </div>

        <div class="hero-meta">
          <span class="hero-chip">{{ asn.warehouseName }}</span>
          <StatusBadge :status="asn.status" type="asn" />
        </div>
      </section>

      <div class="summary-grid">
        <section class="summary-card">
          <span class="summary-label">SKU 수</span>
          <strong>{{ asn.skuCount }}종</strong>
        </section>
        <section class="summary-card">
          <span class="summary-label">총 수량</span>
          <strong>{{ asn.totalQuantity.toLocaleString() }}</strong>
        </section>
        <section class="summary-card">
          <span class="summary-label">총 박스 수</span>
          <strong>{{ detail.totalCartons }}</strong>
        </section>
        <section class="summary-card">
          <span class="summary-label">입고 예정일</span>
          <strong>{{ asn.expectedDate }}</strong>
        </section>
      </div>

      <div class="info-grid">
        <section class="detail-card">
          <h3 class="detail-title">기본 정보</h3>
          <dl class="detail-list">
            <div>
              <dt>참조 번호</dt>
              <dd>{{ asn.referenceNo }}</dd>
            </div>
            <div>
              <dt>등록일</dt>
              <dd>{{ asn.createdAt }}</dd>
            </div>
            <div>
              <dt>공급처</dt>
              <dd>{{ detail.supplierName }}</dd>
            </div>
            <div>
              <dt>운영 메모</dt>
              <dd>{{ asn.note }}</dd>
            </div>
          </dl>
        </section>

        <section class="detail-card">
          <h3 class="detail-title">운송 정보</h3>
          <dl class="detail-list">
            <div>
              <dt>출발지</dt>
              <dd>{{ detail.originCountry }} / {{ detail.originPort }}</dd>
            </div>
            <div>
              <dt>운송 방식</dt>
              <dd>{{ detail.transportMode }}</dd>
            </div>
            <div>
              <dt>Incoterms</dt>
              <dd>{{ detail.incoterms }}</dd>
            </div>
            <div>
              <dt>Carrier / Booking</dt>
              <dd>{{ detail.carrier }} / {{ detail.bookingNo }}</dd>
            </div>
          </dl>
        </section>

        <section class="detail-card">
          <h3 class="detail-title">서류 / 일정</h3>
          <dl class="detail-list">
            <div>
              <dt>도착 윈도우</dt>
              <dd>{{ detail.arrivalWindow }}</dd>
            </div>
            <div>
              <dt>서류</dt>
              <dd>{{ detail.documents.join(', ') }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section class="detail-card">
        <div class="detail-head">
          <h3 class="detail-title">입고 품목</h3>
          <span class="detail-count">{{ detail.items.length }}건</span>
        </div>

        <div class="table-wrap">
          <table class="detail-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>상품명</th>
                <th>수량</th>
                <th>박스 수</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in detail.items" :key="`${asn.id}-${item.sku}`">
                <td>{{ item.sku }}</td>
                <td>{{ item.productName }}</td>
                <td>{{ Number(item.quantity).toLocaleString() }}</td>
                <td>{{ item.cartons }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <template #footer>
      <button type="button" class="ui-btn ui-btn--ghost" @click="$emit('cancel')">닫기</button>
    </template>
  </SellerBaseModal>
</template>

<style scoped>
.asn-detail-modal {
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
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: flex-end;
  gap: var(--space-2);
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: rgba(15, 23, 42, 0.08);
  color: var(--t1);
  font-size: var(--font-size-xs);
  font-weight: 700;
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

.summary-label {
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

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
}

.detail-table thead tr {
  background: var(--surface-2);
}

.detail-table th,
.detail-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--t2);
  font-size: var(--font-size-sm);
  text-align: left;
}

.detail-table tbody tr:last-child td {
  border-bottom: none;
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
