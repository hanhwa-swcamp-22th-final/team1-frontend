<script setup>
/**
 * Seller 모달 쇼케이스 화면.
 * Seller 전용 모달을 한 화면에서 열어 보며 UI 상태를 빠르게 점검한다.
 */
import { reactive, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import SellerAsnDetailModal from '@/components/seller/SellerAsnDetailModal.vue'
import SellerChannelConnectModal from '@/components/seller/SellerChannelConnectModal.vue'
import SellerConfirmDialog from '@/components/seller/SellerConfirmDialog.vue'
import SellerExcelUploadResultModal from '@/components/seller/SellerExcelUploadResultModal.vue'
import SellerInventoryDetailModal from '@/components/seller/SellerInventoryDetailModal.vue'
import SellerOrderDetailModal from '@/components/seller/SellerOrderDetailModal.vue'
import SellerProductDetailModal from '@/components/seller/SellerProductDetailModal.vue'
import {
  createSellerModalShowcaseChannelForm,
  createSellerModalShowcaseSamples,
  SELLER_MODAL_SHOWCASE_GROUPS,
} from '@/utils/sellerModalShowcase.utils.js'

const breadcrumb = [{ label: 'Seller' }, { label: '모달 쇼케이스' }]
const activeModal = ref('')
const showcaseSamples = createSellerModalShowcaseSamples()
const channelForm = reactive(createSellerModalShowcaseChannelForm())
const totalModalCount = SELLER_MODAL_SHOWCASE_GROUPS.reduce((sum, group) => sum + group.items.length, 0)
</script>

<template>
  <AppLayout title="모달 쇼케이스" :breadcrumb="breadcrumb">
    <section class="seller-modal-showcase-page">
      <section class="intro-card">
        <div>
          <p class="intro-eyebrow">Seller Modal Showcase</p>
          <h2 class="intro-title">상세, 확인, 연동 모달을 한 화면에서 빠르게 검토합니다.</h2>
          <p class="intro-copy">
            Seller 전용 모달만 묶어서 화면 열기, 크기감, 내용 밀도를 한 번에 확인합니다.
          </p>
        </div>

        <div class="intro-badges">
          <span class="intro-badge">총 {{ totalModalCount }}개</span>
          <span class="intro-badge">Compact / Default / Tall</span>
          <span class="intro-badge">Seller Only</span>
        </div>
      </section>

      <section class="summary-grid">
        <article class="summary-card">
          <span class="summary-label">상세 모달</span>
          <strong>{{ SELLER_MODAL_SHOWCASE_GROUPS[0].items.length }}</strong>
        </article>
        <article class="summary-card">
          <span class="summary-label">확인 모달</span>
          <strong>{{ SELLER_MODAL_SHOWCASE_GROUPS[1].items.length }}</strong>
        </article>
        <article class="summary-card">
          <span class="summary-label">연동 모달</span>
          <strong>{{ SELLER_MODAL_SHOWCASE_GROUPS[2].items.length }}</strong>
        </article>
      </section>

      <section
        v-for="group in SELLER_MODAL_SHOWCASE_GROUPS"
        :key="group.key"
        class="showcase-card"
      >
        <header class="section-head">
          <div>
            <p class="section-eyebrow">Modal Group</p>
            <h3 class="section-title">{{ group.title }}</h3>
          </div>
          <p class="section-copy">{{ group.description }}</p>
        </header>

        <div class="modal-grid">
          <article
            v-for="item in group.items"
            :key="item.key"
            class="modal-item-card"
          >
            <div class="modal-item-head">
              <div>
                <p class="modal-item-eyebrow">{{ group.title }}</p>
                <h4 class="modal-item-title">{{ item.label }}</h4>
              </div>
              <span class="size-chip">{{ item.sizeLabel }}</span>
            </div>

            <p class="modal-item-copy">{{ item.description }}</p>

            <button
              type="button"
              class="ui-btn ui-btn--primary modal-open-btn"
              @click="activeModal = item.key"
            >
              열어보기
            </button>
          </article>
        </div>
      </section>

      <SellerOrderDetailModal
        :isOpen="activeModal === 'order-detail'"
        :order="showcaseSamples.order"
        :detail="showcaseSamples.orderDetail"
        @cancel="activeModal = ''"
      />

      <SellerProductDetailModal
        :isOpen="activeModal === 'product-detail'"
        :product="showcaseSamples.product"
        :detail="showcaseSamples.productDetail"
        @cancel="activeModal = ''"
      />

      <SellerAsnDetailModal
        :isOpen="activeModal === 'asn-detail'"
        :asn="showcaseSamples.asn"
        :detail="showcaseSamples.asnDetail"
        @cancel="activeModal = ''"
      />

      <SellerInventoryDetailModal
        :isOpen="activeModal === 'inventory-detail'"
        :inventory="showcaseSamples.inventory"
        :detail="showcaseSamples.inventoryDetail"
        @cancel="activeModal = ''"
      />

      <SellerConfirmDialog
        :isOpen="activeModal === 'order-cancel-confirm'"
        title="주문 취소 확인"
        message="ORD-2026-0311-003 주문을 취소 처리할까요?"
        confirm-label="주문 취소"
        danger
        @cancel="activeModal = ''"
        @confirm="activeModal = ''"
      />

      <SellerConfirmDialog
        :isOpen="activeModal === 'product-status-confirm'"
        title="상품 상태 변경"
        message="LB-SRM-50 상품을 비활성 처리할까요?"
        confirm-label="비활성 처리"
        @cancel="activeModal = ''"
        @confirm="activeModal = ''"
      />

      <SellerConfirmDialog
        :isOpen="activeModal === 'asn-cancel-confirm'"
        title="ASN 취소 확인"
        message="ASN-20260318-001 ASN 접수를 취소할까요?"
        confirm-label="ASN 취소"
        danger
        @cancel="activeModal = ''"
        @confirm="activeModal = ''"
      />

      <SellerConfirmDialog
        :isOpen="activeModal === 'asn-csv-confirm'"
        title="ASN CSV 내보내기"
        message="현재 필터 기준 ASN 목록을 CSV로 내보낼까요?"
        confirm-label="내보내기"
        @cancel="activeModal = ''"
        @confirm="activeModal = ''"
      />

      <SellerChannelConnectModal
        :isOpen="activeModal === 'channel-connect'"
        :channelCard="showcaseSamples.channelCard"
        :form="channelForm"
        @cancel="Object.assign(channelForm, createSellerModalShowcaseChannelForm()); activeModal = ''"
        @confirm="Object.assign(channelForm, createSellerModalShowcaseChannelForm()); activeModal = ''"
      />

      <SellerExcelUploadResultModal
        :isOpen="activeModal === 'upload-result'"
        :summary="showcaseSamples.uploadSummary"
        @cancel="activeModal = ''"
      />
    </section>
  </AppLayout>
</template>

<style scoped>
.seller-modal-showcase-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.intro-card,
.showcase-card,
.summary-card,
.modal-item-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.intro-card {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-6);
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 28%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.02), rgba(255, 255, 255, 0.95));
}

.intro-eyebrow,
.section-eyebrow,
.modal-item-eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--blue);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.intro-title,
.section-title,
.modal-item-title {
  margin: 0;
  color: var(--t1);
}

.intro-title {
  font-size: var(--font-size-2xl);
}

.intro-copy,
.section-copy,
.modal-item-copy {
  margin: var(--space-2) 0 0;
  color: var(--t3);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.intro-badges {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: flex-end;
  gap: var(--space-2);
}

.intro-badge,
.size-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
  white-space: nowrap;
}

.intro-badge {
  background: rgba(15, 23, 42, 0.08);
  color: var(--t2);
}

.size-chip {
  background: var(--gold-pale);
  color: #92400e;
}

.summary-grid,
.modal-grid {
  display: grid;
  gap: var(--space-3);
}

.summary-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--space-4);
}

.summary-label {
  color: var(--t3);
  font-size: var(--font-size-xs);
}

.summary-card strong {
  color: var(--t1);
  font-size: var(--font-size-xl);
}

.showcase-card {
  padding: var(--space-5);
}

.section-head,
.modal-item-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.section-head {
  margin-bottom: var(--space-4);
}

.section-copy {
  max-width: 360px;
  text-align: right;
}

.modal-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.modal-item-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
}

.modal-open-btn {
  align-self: flex-start;
}

@media (max-width: 960px) {
  .intro-card,
  .section-head,
  .modal-item-head {
    flex-direction: column;
  }

  .section-copy {
    max-width: none;
    text-align: left;
  }

  .summary-grid,
  .modal-grid {
    grid-template-columns: 1fr;
  }
}
</style>
