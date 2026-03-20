<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUiStore } from '@/stores/ui'
import { formatDate, formatNumber } from '@/utils/format'
import { getOutboundStats, getCurrentRevenue, getMonthlyRevenue } from '@/api/order'
import { getAsnStats, getInventoryStats, getWarehouseStatus, getStorageBilling } from '@/api/wms'
import { getSellerStats, getSellerReceivables } from '@/api/member'
import { ROUTE_NAMES } from '@/constants'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import VueApexCharts from 'vue3-apexcharts'

const breadcrumb = [{ label: 'CONK' }, { label: '대시보드' }]

const ui                = useUiStore()
const summaryCards      = ref([])
const warehouses        = ref([])
const storageBilling    = ref([])
const sellerFees        = ref([])
const monthlyRevenue    = ref([])
const fetchedAt         = ref(null)
const errorMsg          = ref('')

// ── 테이블 컬럼 정의 ──────────────────────────────────────────────────────────

const BILLING_COLUMNS = [
  { key: 'warehouseName', label: '창고' },
  { key: 'storageQty',    label: '재고(SKU)',  align: 'right',  width: '90px'  },
  { key: 'locationUtil',  label: '사용률',     align: 'center', width: '120px' },
  { key: 'amount',        label: '청구액',     align: 'right',  width: '110px' },
  { key: 'status',        label: '상태',       align: 'center', width: '90px'  },
]

const SELLER_FEE_COLUMNS = [
  { key: 'sellerName',  label: '셀러' },
  { key: 'totalBilled', label: '총 청구액', align: 'right',  width: '140px' },
  { key: 'paid',        label: '수납액',    align: 'right',  width: '130px' },
  { key: 'unpaid',      label: '미수금',    align: 'right',  width: '130px' },
  { key: 'daysOverdue', label: '연체일',    align: 'center', width: '80px'  },
]

// ── 차트 옵션 ─────────────────────────────────────────────────────────────────

const sectionDate = computed(() =>
  fetchedAt.value ? formatDate(fetchedAt.value, 'datetime') + ' 실시간 기준' : ''
)

const chartOptions = computed(() => ({
  chart:      { type: 'area', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
  stroke:     { curve: 'smooth', width: 2.5 },
  fill:       { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0, stops: [0, 100] } },
  colors:     ['#4C74FF'],
  dataLabels: { enabled: false },
  xaxis: {
    categories: monthlyRevenue.value.map(d => d.label),
    axisBorder: { show: false },
    axisTicks:  { show: false },
    labels:     { style: { colors: '#7B859A', fontSize: '11px' } },
  },
  yaxis: {
    labels: {
      style:     { colors: '#7B859A', fontSize: '11px' },
      formatter: v => `₩${(v / 1_000_000).toFixed(0)}M`,
    },
  },
  grid:    { borderColor: '#E4E8F0', strokeDashArray: 4 },
  tooltip: { y: { formatter: v => `₩${formatNumber(v)}` } },
}))

const chartSeries = computed(() => [{
  name: '매출액',
  data: monthlyRevenue.value.map(d => d.revenue),
}])

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────

function billingStatusLabel(status) {
  return status === 'BILLED' ? '청구 완료' : '청구 예정'
}

// ── 데이터 fetch ──────────────────────────────────────────────────────────────

async function fetchDashboard() {
  errorMsg.value = ''
  ui.setLoading(true)
  try {
    const [outboundRes, asnRes, inventoryRes, sellerRes, whRes,
           revenueRes, monthlyRes, billingRes, sellerRecRes] = await Promise.all([
      getOutboundStats(),
      getAsnStats(),
      getInventoryStats(),
      getSellerStats(),
      getWarehouseStatus(),
      getCurrentRevenue(),
      getMonthlyRevenue(),
      getStorageBilling(),
      getSellerReceivables(),
    ])

    const o = outboundRes.data.data
    const a = asnRes.data.data
    const i = inventoryRes.data.data
    const s = sellerRes.data.data
    const r = revenueRes.data.data

    summaryCards.value = [
      { label: '당월 총 매출',        value: `₩${formatNumber(r.totalRevenue)}`, trend: r.trend, trendLabel: r.trendLabel, trendType: r.trendType, valueColor: 'blue'  },
      { label: '전체 출고 예정 건수',  value: formatNumber(o.pendingOutboundCount), trend: o.trend, trendLabel: o.trendLabel, trendType: o.trendType },
      { label: '미처리 ASN (검수 대기)', value: String(a.unprocessedCount), trend: a.trend, trendLabel: a.trendLabel, trendType: a.trendType, valueColor: 'amber' },
      { label: '재고 부족 경고 SKU',   value: String(i.lowStockSkuCount),  trend: i.trend, trendLabel: i.trendLabel, trendType: i.trendType, valueColor: 'red'   },
      { label: '활성 셀러 업체 수',    value: String(s.activeSellerCount), trend: `${s.newThisMonth}개사`, trendLabel: '이번 달 신규', trendType: s.trendType },
    ]

    warehouses.value     = whRes.data.data
    monthlyRevenue.value = monthlyRes.data.data
    storageBilling.value = billingRes.data.data
    sellerFees.value     = sellerRecRes.data.data
    fetchedAt.value      = new Date()
  } catch (err) {
    errorMsg.value = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
    console.error('[Dashboard] fetchDashboard error:', err)
  } finally {
    ui.setLoading(false)
  }
}

onMounted(fetchDashboard)
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="대시보드" :loading="ui.isLoading">
    <template #header-action>
      <button class="ui-btn ui-btn--ghost btn-export">
        <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
          <path d="M7 1v8M3.5 6.5L7 10l3.5-3.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
          <path d="M1.5 11v1.5h11V11" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" />
        </svg>
        데이터 내보내기
      </button>
      <button class="ui-btn btn-gold">
        <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
          <line stroke="currentColor" stroke-linecap="round" stroke-width="2" x1="7" x2="7" y1="2" y2="12" />
          <line stroke="currentColor" stroke-linecap="round" stroke-width="2" x1="2" x2="12" y1="7" y2="7" />
        </svg>
        신규 출고 지시
      </button>
    </template>

    <div v-if="errorMsg" class="fetch-error">
      {{ errorMsg }}
      <button @click="fetchDashboard">다시 시도</button>
    </div>

    <!-- ① 요약 카드 (5개) -->
    <div class="summary-grid">
      <div v-for="card in summaryCards" :key="card.label" class="summary-card">
        <span class="summary-label">{{ card.label }}</span>
        <span
          :class="{
            'summary-value--blue':  card.valueColor === 'blue',
            'summary-value--amber': card.valueColor === 'amber',
            'summary-value--red':   card.valueColor === 'red',
          }"
          class="summary-value"
        >{{ card.value }}</span>
        <div
          :class="{ 'trend-up': card.trendType === 'up', 'trend-down': card.trendType === 'down' }"
          class="summary-trend"
        >
          <svg v-if="card.trendType === 'up'" class="trend-icon" viewBox="0 0 12 12" fill="none">
            <path d="M6 10V2M2 6l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else-if="card.trendType === 'down'" class="trend-icon" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v8M2 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ card.trend }}
          <span class="trend-sub">{{ card.trendLabel }}</span>
        </div>
      </div>
    </div>

    <!-- ② 창고 운영 현황 (간략) -->
    <div class="section-header">
      <span class="section-title">창고 운영 현황</span>
      <span class="section-date">{{ sectionDate }}</span>
    </div>
    <div class="warehouse-mini-grid">
      <div v-for="wh in warehouses" :key="wh.id" class="wh-mini-card">
        <div class="wh-mini-top">
          <span class="wh-mini-name">{{ wh.name }}</span>
          <span
            :class="{
              'wh-mini-badge--active': wh.status === 'active',
              'wh-mini-badge--idle':   wh.status === 'idle',
            }"
            class="wh-mini-badge"
          >
            <span class="status-dot" />{{ wh.statusLabel }}
          </span>
        </div>
        <div class="wh-mini-progress-meta">
          <span class="wh-mini-progress-label">금일 출고 진행률</span>
          <span class="wh-mini-progress-pct">{{ wh.progress }}%</span>
        </div>
        <div class="wh-mini-bar">
          <div :style="{ width: wh.progress + '%' }" class="wh-mini-fill" />
        </div>
        <div class="wh-mini-kpis">
          <div
            v-for="kpi in wh.kpis.filter(k => !k.carriers).slice(0, 2)"
            :key="kpi.label"
            class="wh-mini-kpi"
          >
            <span class="wh-mini-kpi-label">{{ kpi.label }}</span>
            <span class="wh-mini-kpi-value" :class="{ 'wh-mini-kpi-value--alert': kpi.alert }">
              {{ kpi.value }}<span class="wh-mini-kpi-unit">{{ kpi.unit }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ③ 월별 매출 추이 + 보관료 청구 현황 -->
    <div class="two-col-grid">
      <!-- 월별 매출 차트 -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">월별 매출 추이</span>
          <span class="panel-sub">최근 6개월</span>
        </div>
        <VueApexCharts
          v-if="monthlyRevenue.length"
          type="area"
          height="220"
          :options="chartOptions"
          :series="chartSeries"
        />
      </div>

      <!-- 창고 보관료 청구 현황 -->
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title-wrap">
            <span class="panel-title">창고 보관료 청구 현황</span>
            <span class="panel-sub">{{ storageBilling[0]?.billingMonth ?? '' }}</span>
          </div>
          <router-link :to="{ name: ROUTE_NAMES.MASTER_STORAGE_BILLING }" class="panel-more">전체보기 →</router-link>
        </div>
        <BaseTable :columns="BILLING_COLUMNS" :rows="storageBilling" :pagination="null" row-key="id">
          <template #cell-storageQty="{ value }">
            {{ formatNumber(value) }}
          </template>
          <template #cell-locationUtil="{ value }">
            <div class="util-wrap">
              <div class="util-bar">
                <div
                  class="util-fill"
                  :style="{ width: value + '%' }"
                />
              </div>
              <span class="util-pct">{{ value }}%</span>
            </div>
          </template>
          <template #cell-amount="{ value }">
            <span class="amount-cell">₩{{ formatNumber(value) }}</span>
          </template>
          <template #cell-status="{ value }">
            <span
              class="billing-badge"
              :class="{
                'billing-badge--billed':  value === 'BILLED',
                'billing-badge--pending': value === 'PENDING',
              }"
            >{{ billingStatusLabel(value) }}</span>
          </template>
        </BaseTable>
      </div>
    </div>

    <!-- ④ 셀러별 3PL 비용 현황 (full-width) -->
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title-wrap">
          <span class="panel-title">셀러별 3PL 비용 현황</span>
          <span class="panel-sub">당월 청구 기준</span>
        </div>
        <router-link :to="{ name: ROUTE_NAMES.MASTER_SELLER_RECEIVABLES }" class="panel-more">전체보기 →</router-link>
      </div>
      <BaseTable :columns="SELLER_FEE_COLUMNS" :rows="sellerFees" :pagination="null" row-key="sellerCode">
        <template #cell-sellerName="{ row, value }">
          <div class="seller-name-cell">
            <span class="rank-badge">{{ sellerFees.indexOf(row) + 1 }}</span>
            {{ value }}
          </div>
        </template>
        <template #cell-totalBilled="{ value }">
          <span class="amount-cell">₩{{ formatNumber(value) }}</span>
        </template>
        <template #cell-paid="{ value }">
          ₩{{ formatNumber(value) }}
        </template>
        <template #cell-unpaid="{ value }">
          <span :class="{ 'amount-alert': value > 0 }">₩{{ formatNumber(value) }}</span>
        </template>
        <template #cell-daysOverdue="{ value }">
          <span v-if="value === 0" class="overdue-none">정상</span>
          <span v-else class="overdue-badge">{{ value }}일</span>
        </template>
      </BaseTable>
    </div>
  </AppLayout>
</template>

<script>
import VueApexCharts from 'vue3-apexcharts'
export default { components: { VueApexCharts } }
</script>

<style scoped>
.btn-export {
  border-radius: var(--radius-sm);
  font-family: var(--font-barlow);
  font-weight: 500;
}
.btn-export svg { width: 14px; height: 14px; flex-shrink: 0; }

.btn-gold {
  border-radius: var(--radius-sm);
  background: var(--gold);
  font-family: var(--font-barlow);
  font-weight: 700;
  color: var(--t1);
  border: none;
}
.btn-gold:hover { background: var(--gold-lt); }
.btn-gold svg { width: 14px; height: 14px; flex-shrink: 0; }

/* ── 에러 배너 ───────────────────────────────── */
.fetch-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-5);
  margin-bottom: var(--space-5);
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid var(--red);
  border-radius: var(--radius-md);
  color: var(--red);
  font-size: var(--font-size-sm);
}

/* ── 요약 카드 (5열) ─────────────────────────── */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.summary-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  box-shadow: var(--shadow-sm);
}

.summary-label {
  font-family: var(--font-barlow);
  font-weight: 600;
  font-size: var(--font-size-xs);
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--t3);
}

.summary-value {
  font-family: var(--font-condensed);
  font-weight: 700;
  font-size: 30px;
  color: var(--t1);
  line-height: 1;
}
.summary-value--blue  { color: var(--blue); }
.summary-value--amber { color: var(--amber); }
.summary-value--red   { color: var(--red); }

.summary-trend {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}
.trend-up   { color: var(--green); }
.trend-down { color: var(--red); }

.trend-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.trend-sub {
  font-size: var(--font-size-xs);
  color: var(--t3);
}

/* ── 섹션 헤더 ───────────────────────────────── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.section-title {
  font-family: var(--font-condensed);
  font-weight: 700;
  font-size: var(--font-size-xl);
  letter-spacing: 0.5px;
  color: var(--t1);
}

.section-date {
  font-size: var(--font-size-sm);
  color: var(--t3);
}

/* ── 창고 미니 카드 ──────────────────────────── */
.warehouse-mini-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.wh-mini-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.wh-mini-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.wh-mini-name {
  font-family: var(--font-barlow);
  font-weight: 700;
  font-size: var(--font-size-md);
  color: var(--t1);
}

.wh-mini-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-family: var(--font-barlow);
  font-weight: 700;
  font-size: var(--font-size-xs);
}
.wh-mini-badge--active { background: var(--green-pale); color: var(--green); }
.wh-mini-badge--idle   { background: var(--amber-pale); color: #b45309; }

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.wh-mini-progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.wh-mini-progress-label {
  font-size: var(--font-size-xs);
  color: var(--t3);
}

.wh-mini-progress-pct {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--green);
}

.wh-mini-bar {
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.wh-mini-fill {
  height: 100%;
  background: var(--green);
  border-radius: 3px;
}

.wh-mini-kpis {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
  margin-top: var(--space-1);
  padding-top: var(--space-2);
  border-top: 1px solid var(--border);
}

.wh-mini-kpi {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wh-mini-kpi-label {
  font-size: var(--font-size-xs);
  color: var(--t3);
  font-family: var(--font-barlow);
}

.wh-mini-kpi-value {
  font-family: var(--font-condensed);
  font-weight: 700;
  font-size: var(--font-size-lg);
  color: var(--t1);
  line-height: 1;
}

.wh-mini-kpi-value--alert { color: var(--red); }

.wh-mini-kpi-unit {
  font-size: var(--font-size-xs);
  font-family: var(--font-barlow);
  color: var(--t3);
  margin-left: 2px;
}

/* ── 2열 그리드 ──────────────────────────────── */
.two-col-grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

/* ── 패널 ────────────────────────────────────── */
.panel {
  background: var(--surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  border-top: 3px solid var(--blue);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5) var(--space-3);
}

.panel-title-wrap {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.panel-more {
  font-size: var(--font-size-xs);
  font-family: var(--font-barlow);
  font-weight: 600;
  color: var(--blue);
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}
.panel-more:hover { text-decoration: underline; }

.panel-title {
  font-family: var(--font-condensed);
  font-weight: 700;
  font-size: var(--font-size-lg);
  color: var(--t1);
}

.panel-sub {
  font-size: var(--font-size-xs);
  color: var(--t3);
}

/* chart 패딩 */
.panel > :deep(.apexcharts-canvas) {
  padding: 0 var(--space-2);
}

/* ── 사용률 컬럼 ──────────────────────────────── */
.util-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.util-bar {
  width: 64px;
  height: 5px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.util-fill { height: 100%; border-radius: 3px; background: var(--green); }

.util-pct {
  font-family: var(--font-barlow);
  font-weight: 600;
  font-size: var(--font-size-xs);
  color: var(--t2);
}

/* ── 셀 커스텀 스타일 ─────────────────────────── */
.amount-cell {
  font-family: var(--font-barlow);
  font-weight: 600;
  color: var(--t1);
}

.amount-alert {
  font-family: var(--font-barlow);
  font-weight: 700;
  color: var(--red);
}

.billing-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-family: var(--font-barlow);
  font-weight: 600;
  font-size: var(--font-size-xs);
  white-space: nowrap;
}
.billing-badge--billed  { background: var(--green-pale); color: var(--green); }
.billing-badge--pending { background: var(--amber-pale); color: #b45309; }

.seller-name-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--blue-pale);
  color: var(--blue);
  font-family: var(--font-barlow);
  font-weight: 700;
  font-size: 10px;
  flex-shrink: 0;
}

.overdue-none {
  font-size: var(--font-size-xs);
  color: var(--green);
  font-weight: 600;
}

.overdue-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--red-pale);
  color: var(--red);
  font-family: var(--font-barlow);
  font-weight: 700;
  font-size: var(--font-size-xs);
}
</style>
