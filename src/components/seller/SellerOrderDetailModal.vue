<script setup>
/**
 * Seller 주문 상세 모달.
 * 주문/수령자/배송 정보와 SKU 테이블, 5단계 출고 스텝퍼를 한 번에 보여준다.
 */
import { computed } from 'vue'

import TimelineStepper from '@/components/common/TimelineStepper.vue'
import SellerBaseModal from '@/components/seller/SellerBaseModal.vue'
import {
  getSellerOrderChannelMeta,
  getSellerOrderProgressStep,
  getSellerOrderStatusMeta,
  SELLER_ORDER_PROGRESS_STEPS,
} from '@/utils/orderList.utils.js'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  order: { type: Object, default: null },
  detail: { type: Object, default: null },
})

defineEmits(['cancel'])

const currentStep = computed(() => getSellerOrderProgressStep(props.order?.status))

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`
}
</script>

<template>
  <SellerBaseModal
    :isOpen="isOpen"
    :title="order?.orderNo ? `${order.orderNo} 주문 상세` : '주문 상세'"
    size="tall"
    @cancel="$emit('cancel')"
  >
    <div v-if="order && detail" class="order-detail-modal">
      <section class="hero-card">
        <div class="hero-head">
          <div>
            <p class="hero-eyebrow">Seller Order Detail</p>
            <h2 class="hero-title">{{ order.orderNo }}</h2>
            <p class="hero-copy">{{ detail.memo }}</p>
          </div>

          <div class="hero-meta">
            <span
              class="channel-tag"
              :class="`channel-tag--${getSellerOrderChannelMeta(order.channel).tone}`"
            >
              {{ getSellerOrderChannelMeta(order.channel).label }}
            </span>
            <span
              class="order-status-badge"
              :class="`order-status-badge--${getSellerOrderStatusMeta(order.status).tone}`"
            >
              {{ getSellerOrderStatusMeta(order.status).label }}
            </span>
          </div>
        </div>

        <div class="hero-stepper">
          <TimelineStepper :steps="SELLER_ORDER_PROGRESS_STEPS" :current-step="currentStep" />
          <p v-if="order.status === 'CANCELLED'" class="hero-note">
            취소된 주문은 접수 시점 기준으로 처리 흐름을 표시합니다.
          </p>
        </div>
      </section>

      <div class="info-grid">
        <section class="detail-card">
          <h3 class="detail-title">주문 정보</h3>
          <dl class="detail-list">
            <div>
              <dt>주문번호</dt>
              <dd>{{ order.orderNo }}</dd>
            </div>
            <div>
              <dt>주문일</dt>
              <dd>{{ order.orderedAt }}</dd>
            </div>
            <div>
              <dt>채널</dt>
              <dd>{{ order.channel }}</dd>
            </div>
            <div>
              <dt>현재 상태</dt>
              <dd>{{ getSellerOrderStatusMeta(order.status).label }}</dd>
            </div>
          </dl>
        </section>

        <section class="detail-card">
          <h3 class="detail-title">수령자 정보</h3>
          <dl class="detail-list">
            <div>
              <dt>수령자</dt>
              <dd>{{ order.recipient }}</dd>
            </div>
            <div>
              <dt>연락처</dt>
              <dd>{{ detail.receiverPhone }}</dd>
            </div>
            <div>
              <dt>State / City</dt>
              <dd>{{ detail.state }} / {{ detail.city }}</dd>
            </div>
            <div>
              <dt>Zip</dt>
              <dd>{{ detail.zipCode }}</dd>
            </div>
          </dl>
        </section>

        <section class="detail-card">
          <h3 class="detail-title">배송 정보</h3>
          <dl class="detail-list">
            <div>
              <dt>주소</dt>
              <dd>{{ detail.addressLine }}</dd>
            </div>
            <div>
              <dt>배송 방식</dt>
              <dd>{{ detail.shippingMethod }}</dd>
            </div>
            <div>
              <dt>택배사</dt>
              <dd>{{ detail.carrier }}</dd>
            </div>
            <div>
              <dt>송장번호</dt>
              <dd>{{ order.trackingNo || '미발급' }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section class="detail-card">
        <div class="detail-head">
          <h3 class="detail-title">주문 상품</h3>
          <span class="detail-count">{{ detail.items.length }}건</span>
        </div>

        <div class="table-wrap">
          <table class="detail-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>상품명</th>
                <th>수량</th>
                <th>단가</th>
                <th>소계</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in detail.items" :key="`${order.id}-${item.sku}`">
                <td>{{ item.sku }}</td>
                <td>{{ item.productName }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ formatCurrency(item.unitPrice) }}</td>
                <td>{{ formatCurrency(item.amount) }}</td>
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
.order-detail-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.hero-card,
.detail-card {
  padding: var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.hero-card {
  background: var(--surface-2);
}

.hero-head,
.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
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

.hero-copy,
.hero-note {
  margin: 0;
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}

.hero-stepper {
  margin-top: var(--space-4);
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

.channel-tag,
.order-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
  white-space: nowrap;
}

.channel-tag--amazon {
  background: #fff3e0;
  color: #e65100;
}

.channel-tag--manual {
  background: var(--surface);
  color: var(--t2);
}

.channel-tag--excel {
  background: var(--blue-pale);
  color: var(--blue);
}

.channel-tag--default,
.order-status-badge--default {
  background: var(--surface);
  color: var(--t3);
}

.order-status-badge--blue {
  background: var(--blue-pale);
  color: var(--blue);
}

.order-status-badge--indigo {
  background: rgba(99, 102, 241, 0.12);
  color: #4338ca;
}

.order-status-badge--amber {
  background: var(--amber-pale);
  color: #b45309;
}

.order-status-badge--gold {
  background: var(--gold-pale);
  color: #92400e;
}

.order-status-badge--green {
  background: var(--green-pale);
  color: var(--green);
}

.order-status-badge--red {
  background: var(--red-pale);
  color: var(--red);
}

@media (max-width: 960px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
