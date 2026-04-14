<script setup>
/**
 * FeeView — 총괄관리자 현재 설정 요금 조회 (Read-only)
 *
 * 레이아웃:
 *   보관비 카드 + 피킹/패킹 카드 2열 레이아웃
 *
 * 데이터: /wms/fee-settings GET (실패 시 기본값 fallback)
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getFeeSettings } from '@/api/wms'
import AppLayout from '@/components/layout/AppLayout.vue'

const breadcrumb = [{ label: '요금 설정' }, { label: '현재 설정 요금 조회' }]
const router = useRouter()
const isLoading = ref(false)

const DEFAULT_FEE = {
  storage: {
    palletRate: '28.50',
    minBillingUnit: '1',
    proRataRule: '입고일 포함',
  },
  pickPack: {
    basePickRate: '2.50',
    additionalSkuRate: '0.75',
    packingMaterialRate: '0.30',
  },
}

const fee = ref({ ...DEFAULT_FEE })

async function fetchFee() {
  isLoading.value = true
  try {
    const res = await getFeeSettings()
    if (res.data?.data) fee.value = res.data.data
  } catch {
    // 기본값 유지
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchFee)
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="현재 설정 요금 조회" :loading="isLoading">
    <template #header-action>
      <button
        class="ui-btn ui-btn--ghost"
        @click="router.push({ name: 'master-fee-settings' })"
      >
        요금 설정 수정하기
      </button>
    </template>

    <div class="rate-grid">
      <div class="rate-card">
        <div class="rate-card-header">
          <div class="rate-icon rate-icon--gold">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
              <path d="M9 5v8M6 9h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="rate-card-title">보관비 (Storage)</span>
        </div>
        <div class="rate-card-body">
          <div class="field-row">
            <span class="field-label">팔레트 보관 단가</span>
            <span class="field-value">{{ fee.storage.palletRate }}</span>
            <span class="field-unit">$ / pallet / 월</span>
          </div>
          <div class="field-row">
            <span class="field-label">최소 청구 단위</span>
            <span class="field-value">{{ fee.storage.minBillingUnit }}</span>
            <span class="field-unit">pallet</span>
          </div>
          <div class="field-row">
            <span class="field-label">일할 계산 기준</span>
            <span class="field-value">{{ fee.storage.proRataRule }}</span>
          </div>
        </div>
      </div>

      <div class="rate-card">
        <div class="rate-card-header">
          <div class="rate-icon rate-icon--gold">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
              <path d="M9 2l7 4v6l-7 4-7-4V6l7-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M2 6l7 4 7-4M9 10v6" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="rate-card-title">피킹/패킹 (Pick &amp; Pack)</span>
        </div>
        <div class="rate-card-body">
          <div class="field-row">
            <span class="field-label">기본 피킹 단가</span>
            <span class="field-value">{{ fee.pickPack.basePickRate }}</span>
            <span class="field-unit">$ / 건 (1 SKU)</span>
          </div>
          <div class="field-row">
            <span class="field-label">추가 SKU 단가</span>
            <span class="field-value">{{ fee.pickPack.additionalSkuRate }}</span>
            <span class="field-unit">$ / SKU</span>
          </div>
          <div class="field-row">
            <span class="field-label">기본 패킹 자재비</span>
            <span class="field-value">{{ fee.pickPack.packingMaterialRate }}</span>
            <span class="field-unit">$ / box</span>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.rate-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  align-items: start;
}

.rate-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.rate-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 24px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.rate-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rate-icon--gold {
  background: var(--gold-pale);
  color: #92400e;
}

.rate-card-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 17px;
  letter-spacing: 0.5px;
  color: var(--t1);
}

.rate-card-body {
  padding: 24px;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.field-row:last-child {
  margin-bottom: 0;
}

.field-label {
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: var(--t3);
  width: 140px;
  flex-shrink: 0;
}

.field-value {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--t1);
}

.field-unit {
  font-family: 'Barlow', sans-serif;
  font-size: 12px;
  color: var(--t4);
}

@media (max-width: 960px) {
  .rate-grid {
    grid-template-columns: 1fr;
  }
}
</style>
