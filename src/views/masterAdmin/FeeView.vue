<script setup>
/**
 * FeeView — 총괄관리자 현재 설정 요금 조회 (Read-only)
 *
 * 레이아웃:
 *   2열 그리드
 *   왼쪽: 보관비 카드 + 피킹/패킹 카드
 *   오른쪽: 라스트마일 요율 테이블
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

// ── 기본값 (API 실패 시 fallback) ─────────────────────────────────────────────
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
  lastMile: {
    USPS: ['4.20', '5.10', '7.80', '9.50'],
    UPS:  ['5.50', '6.80', '10.40', '14.60'],
    FedEx:['5.90', '7.30', '11.20', '15.80'],
  },
}

const fee = ref({ ...DEFAULT_FEE })

const WEIGHT_BANDS = ['0–1 lb', '1–2 lb', '2–3 lb', '3–5 lb', '5–10 lb', '10 lb+']
const CARRIERS = [
  { key: 'USPS',  color: '#005EA6' },
  { key: 'UPS',   color: '#7A4A0A' },
  { key: 'FedEx', color: '#4C1D95' },
]

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
      <!-- ── 왼쪽 컬럼 ── -->
      <div class="left-col">

        <!-- 보관비 카드 -->
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

        <!-- 피킹/패킹 카드 -->
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

      </div><!-- /left-col -->

      <!-- ── 오른쪽 컬럼 ── -->
      <div class="right-col">

        <!-- 라스트마일 카드 -->
        <div class="rate-card">
          <div class="rate-card-header">
            <div class="rate-icon rate-icon--blue">
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
                <path d="M12 7h2.5a1.5 1.5 0 011.5 1.5v4.5h-4M5 13v2M13 13v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="rate-card-title">라스트마일 표준 요율 (Last-Mile)</span>
          </div>
          <div class="rate-card-body">
            <div class="rate-table-wrap">
              <table class="rate-table">
                <thead>
                  <tr>
                    <th>배송사</th>
                    <th v-for="band in WEIGHT_BANDS" :key="band">{{ band }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="carrier in CARRIERS" :key="carrier.key">
                    <td>
                      <span class="carrier-dot" :style="{ background: carrier.color }"></span>
                      {{ carrier.key }}
                    </td>
                    <td v-for="(rate, i) in fee.lastMile[carrier.key]" :key="i">
                      {{ rate }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div><!-- /right-col -->
    </div>
  </AppLayout>
</template>

<style scoped>
.rate-grid {
  display: grid;
  grid-template-columns: 480px 1fr;
  gap: 24px;
  align-items: start;
}

.left-col,
.right-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── 카드 ── */
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

.rate-icon--gold  { background: var(--gold-pale);  color: #92400E; }
.rate-icon--blue  { background: var(--blue-pale);  color: var(--blue); }

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

/* ── 필드 행 ── */
.field-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.field-row:last-child { margin-bottom: 0; }

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

/* ── 라스트마일 테이블 ── */
.rate-table-wrap {
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}

.rate-table {
  width: 100%;
  border-collapse: collapse;
  text-align: right;
}

.rate-table th {
  padding: 12px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: var(--t3);
  text-align: center;
  white-space: nowrap;
}

.rate-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--t2);
}

.rate-table td:first-child {
  text-align: left;
  font-weight: 600;
  color: var(--t1);
}

.rate-table tr:last-child td { border-bottom: none; }

.carrier-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 4px;
  margin-right: 8px;
  vertical-align: middle;
}
</style>
