<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { formatDate, formatNumber } from '@/utils/format'
import { getOutboundStats, getCurrentRevenue, getMonthlyRevenue, getSellerRevenueList } from '@/api/order'
import { getAsnStats, getInventoryStats, getMonthlyBillingResults, getWarehouseStatus } from '@/api/wms'
import { getSellerList, getSellerStats } from '@/api/member'
import { ROUTE_NAMES } from '@/constants'
import {
  buildSellerDirectory,
  getCurrentBillingMonth,
  normalizeSellerFeeRows,
  normalizeSellerRevenueRows,
} from '@/utils/masterAdmin/sellerMetrics.utils'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
const VueApexCharts = defineAsyncComponent(() => import('vue3-apexcharts'))

const breadcrumb = [{ label: 'CONK' }, { label: '대시보드' }]

const router            = useRouter()
const ui                = useUiStore()
const summaryCards      = ref([])
const warehouses        = ref([])
const sellerFees        = ref([])
const sellerRevenueRows = ref([])
const monthlyRevenue    = ref([])
const sellerFeeViewMode  = ref('chart')
const revenueChartType   = ref('area') // 'area' | 'bar' | 'donut'
const fetchedAt         = ref(null)
const errorMsg          = ref('')

// ── 테이블 컬럼 정의 ──────────────────────────────────────────────────────────

const SELLER_FEE_COLUMNS = [
  { key: 'sellerName',   label: '셀러' },
  { key: 'estimatedCost',label: '당월 예상 비용', align: 'right',  width: '120px' },
  { key: 'momGrowth',    label: '전월비',    align: 'right',  width: '80px'  },
  { key: 'turnoverRate', label: '출고회전율', align: 'center', width: '90px'  },
]

// ── 차트 옵션 ─────────────────────────────────────────────────────────────────

const sectionDate = computed(() =>
  fetchedAt.value ? formatDate(fetchedAt.value, 'datetime') + ' 실시간 기준' : ''
)

const revenueChartOptions = computed(() => {
  const data = monthlyRevenue.value
  const avg  = data.length ? data.reduce((s, d) => s + d.revenue, 0) / data.length : 0

  // ── 도넛 전용 ──
  if (revenueChartType.value === 'donut') {
    return {
      chart:    { type: 'donut', fontFamily: 'Inter, sans-serif' },
      labels:   data.map(d => d.label),
      colors:   ['#4C74FF', '#34B469', '#F5A623', '#E84646', '#9747FF', '#14B8A6'],
      legend:   { position: 'bottom', fontSize: '12px', fontFamily: 'Inter, sans-serif' },
      dataLabels: { enabled: true, formatter: val => val.toFixed(1) + '%' },
      plotOptions: { pie: { donut: { size: '65%' } } },
      tooltip:  { y: { formatter: v => `₩${formatNumber(v)}` } },
    }
  }

  // ── area / bar 공통 ──
  const momColors = data.map((d, i) =>
    i === 0 ? 'transparent' : d.revenue >= data[i - 1].revenue ? '#34B469' : '#E84646'
  )
  const base = {
    chart: { type: revenueChartType.value, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
    colors: ['#4C74FF'],
    dataLabels: {
      enabled: true,
      formatter: (val, { dataPointIndex: i }) => {
        if (i === 0) return ''
        const pct = ((data[i].revenue - data[i - 1].revenue) / data[i - 1].revenue * 100).toFixed(1)
        return (pct >= 0 ? '+' : '') + pct + '%'
      },
      style: { fontSize: '10px', fontWeight: 700, colors: momColors },
      background: { enabled: false },
      offsetY: -8,
    },
    xaxis: {
      categories: data.map(d => d.label),
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { style: { colors: '#7B859A', fontSize: '11px' } },
    },
    yaxis: {
      labels: {
        style: { colors: '#7B859A', fontSize: '11px' },
        formatter: v => `₩${(v / 1_000_000).toFixed(0)}M`,
      },
    },
    grid: { borderColor: '#E4E8F0', strokeDashArray: 4 },
    annotations: {
      yaxis: [{
        y: avg, borderColor: '#F5A623', borderWidth: 1, strokeDashArray: 5,
        label: { text: '평균', position: 'right',
          style: { color: '#F5A623', background: 'transparent', fontSize: '10px', fontWeight: 600 } },
      }],
    },
    tooltip: {
      y: {
        formatter: (v, { dataPointIndex: i }) => {
          const b = `₩${formatNumber(v)}`
          if (i === 0) return b
          const pct = ((data[i].revenue - data[i - 1].revenue) / data[i - 1].revenue * 100).toFixed(1)
          return `${b}  (전월비 ${pct >= 0 ? '+' : ''}${pct}%)`
        },
      },
    },
  }

  if (revenueChartType.value === 'area') {
    return {
      ...base,
      stroke:  { curve: 'smooth', width: 2.5 },
      fill:    { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100] } },
      markers: { size: 4, colors: ['#4C74FF'], strokeColors: '#fff', strokeWidth: 2, hover: { size: 6 } },
    }
  }
  // bar
  return {
    ...base,
    stroke: { show: false },
    fill:   { type: 'solid' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
  }
})

const revenueChartSeries = computed(() =>
  revenueChartType.value === 'donut'
    ? monthlyRevenue.value.map(d => d.revenue)
    : [{ name: '매출액', data: monthlyRevenue.value.map(d => d.revenue) }]
)

const sellerFeeChartRows = computed(() => {
  const revenueMap = new Map(
    sellerRevenueRows.value.map(row => [row.sellerId, row.monthRevenue ?? 0])
  )

  return [...sellerFees.value]
    .map(row => ({
      ...row,
      monthRevenue: revenueMap.get(row.sellerId) ?? 0,
    }))
    .sort((a, b) => b.monthRevenue - a.monthRevenue)
    .slice(0, 5)
})

const sellerFeeChartOptions = computed(() => ({
  chart: {
    type: 'donut',
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif',
  },
  labels: sellerFeeChartRows.value.map(row => row.sellerName),
  colors: ['#1746A2', '#2563EB', '#4C74FF', '#6B8CFF', '#9BB2FF', '#C7D4FF'],
  stroke: {
    width: 0,
  },
  plotOptions: {
    pie: {
      donut: {
        size: '62%',
        labels: {
          show: true,
          name: {
            show: true,
            fontSize: '12px',
            fontWeight: 600,
            color: '#7B859A',
          },
          value: {
            show: true,
            fontSize: '18px',
            fontWeight: 700,
            color: '#22304A',
            formatter: value => `₩${formatNumber(Number(value))}`,
          },
          total: {
            show: true,
            label: '총 예상 비용',
            fontSize: '12px',
            fontWeight: 600,
            color: '#7B859A',
            formatter: () => {
              const total = sellerFeeChartRows.value.reduce((sum, row) => sum + row.estimatedCost, 0)
              return `₩${formatNumber(total)}`
            },
          },
        },
      },
    },
  },
  dataLabels: {
    enabled: true,
    formatter: value => `${value.toFixed(1)}%`,
    style: {
      fontSize: '11px',
      fontWeight: 600,
      colors: ['#FFFFFF'],
    },
  },
  legend: {
    show: true,
    position: 'right',
    fontSize: '12px',
    fontWeight: 600,
    labels: {
      colors: '#22304A',
    },
    itemMargin: {
      horizontal: 8,
      vertical: 6,
    },
    formatter: (seriesName, opts) => {
      const row = sellerFeeChartRows.value[opts.seriesIndex]
      if (!row) return seriesName
      return `${seriesName}  ₩${formatNumber(row.estimatedCost)}`
    },
  },
  tooltip: {
    custom: ({ dataPointIndex }) => {
      const row = sellerFeeChartRows.value[dataPointIndex]
      if (!row) return ''

      const growthLabel = Number.isFinite(row.momGrowth)
        ? (row.momGrowth > 0
            ? `전월비 +${row.momGrowth.toFixed(1)}%`
            : `전월비 ${row.momGrowth.toFixed(1)}%`)
        : '전월비 데이터 없음'
      const turnoverLabel = Number.isFinite(row.turnoverRate)
        ? `출고회전율 ${row.turnoverRate}%`
        : '출고회전율 데이터 없음'

      return `
        <div class="seller-fee-tooltip">
          <strong>${row.sellerName}</strong>
          <span>당월 매출: ₩${formatNumber(row.monthRevenue)}</span>
          <span>예상 비용: ₩${formatNumber(row.estimatedCost)}</span>
          <span>${growthLabel}</span>
          <span>${turnoverLabel}</span>
        </div>
      `
    },
  },
}))

const sellerFeeChartSeries = computed(() => sellerFeeChartRows.value.map(row => row.estimatedCost))

function moveToSellerRevenue() {
  router.push({ name: ROUTE_NAMES.MASTER_SELLER_REVENUE })
}

// ── 데이터 fetch ──────────────────────────────────────────────────────────────

async function fetchDashboard() {
  errorMsg.value = ''
  ui.setLoading(true)
  try {
    const billingMonth = getCurrentBillingMonth()
    const [outboundRes, asnRes, inventoryRes, sellerRes, whRes,
           revenueRes, monthlyRes, sellerListRes, sellerFeeRes, sellerRevenueRes] = await Promise.all([
      getOutboundStats(),
      getAsnStats(),
      getInventoryStats(),
      getSellerStats(),
      getWarehouseStatus(),
      getCurrentRevenue(),
      getMonthlyRevenue(),
      getSellerList(),
      getMonthlyBillingResults(billingMonth),
      getSellerRevenueList(),
    ])

    const o = outboundRes.data.data
    const a = asnRes.data.data
    const i = inventoryRes.data.data
    const s = sellerRes.data.data
    const r = revenueRes.data.data
    const sellerDirectory = buildSellerDirectory(sellerListRes.data.data ?? [])

    summaryCards.value = [
      { label: '당월 총 매출',        value: `₩${formatNumber(r.totalRevenue)}`, trend: r.trend, trendLabel: r.trendLabel, trendType: r.trendType, valueColor: 'blue'  },
      { label: '전체 출고 예정 건수',  value: formatNumber(o.pendingOutboundCount), trend: o.trend, trendLabel: o.trendLabel, trendType: o.trendType },
      { label: '미처리 ASN (검수 대기)', value: String(a.unprocessedCount), trend: a.trend, trendLabel: a.trendLabel, trendType: a.trendType, valueColor: 'amber' },
      { label: '재고 부족 경고 SKU',   value: String(i.lowStockSkuCount),  trend: i.trend, trendLabel: i.trendLabel, trendType: i.trendType, valueColor: 'red'   },
      { label: '활성 셀러 업체 수',    value: String(s.activeSellerCount), trend: `${s.newThisMonth}개사`, trendLabel: '이번 달 신규', trendType: s.trendType },
    ]

    warehouses.value     = whRes.data.data
    monthlyRevenue.value = monthlyRes.data.data
    sellerFees.value     = normalizeSellerFeeRows(sellerFeeRes.data.data ?? [], sellerDirectory)
      .sort((a, b) => b.estimatedCost - a.estimatedCost)
    sellerRevenueRows.value = normalizeSellerRevenueRows(sellerRevenueRes.data.data ?? [], sellerDirectory)
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

    <!-- ③ 월별 매출 추이 -->
    <div class="panel panel--spacious">
      <div class="panel-header">
        <div class="panel-title-wrap">
          <span class="panel-title">월별 매출 추이</span>
          <span class="panel-sub">최근 6개월</span>
        </div>
        <div class="view-toggle" role="tablist" aria-label="차트 유형">
          <button type="button" class="view-toggle__button"
            :class="{ 'view-toggle__button--active': revenueChartType === 'area' }"
            @click="revenueChartType = 'area'">추이</button>
          <button type="button" class="view-toggle__button"
            :class="{ 'view-toggle__button--active': revenueChartType === 'bar' }"
            @click="revenueChartType = 'bar'">막대</button>
          <button type="button" class="view-toggle__button"
            :class="{ 'view-toggle__button--active': revenueChartType === 'donut' }"
            @click="revenueChartType = 'donut'">비중</button>
        </div>
      </div>
      <VueApexCharts
        v-if="monthlyRevenue.length"
        :type="revenueChartType"
        height="260"
        :options="revenueChartOptions"
        :series="revenueChartSeries"
      />
    </div>

    <!-- ④ 셀러별 3PL 비용 현황 (full-width) -->
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title-wrap">
          <span class="panel-title">셀러별 3PL 비용 현황</span>
          <span class="panel-sub">
            {{ sellerFeeViewMode === 'chart' ? '매출액 상위 5개 셀러 비용 비중' : '당월 청구 기준' }}
          </span>
        </div>
        <div class="panel-actions">
          <div class="view-toggle" role="tablist" aria-label="셀러별 3PL 비용 보기 방식">
            <button
              type="button"
              class="view-toggle__button"
              :class="{ 'view-toggle__button--active': sellerFeeViewMode === 'table' }"
              @click="sellerFeeViewMode = 'table'"
            >
              테이블
            </button>
            <button
              type="button"
              class="view-toggle__button"
              :class="{ 'view-toggle__button--active': sellerFeeViewMode === 'chart' }"
              @click="sellerFeeViewMode = 'chart'"
            >
              그래프
            </button>
          </div>
          <button type="button" class="panel-more panel-more--button" @click="moveToSellerRevenue">
            상세보기 →
          </button>
        </div>
      </div>
      <BaseTable
        v-if="sellerFeeViewMode === 'table'"
        :columns="SELLER_FEE_COLUMNS"
        :rows="sellerFees"
        :pagination="null"
        row-key="sellerId"
      >
        <template #cell-sellerName="{ row, value }">
          <div class="seller-name-cell">
            <span class="rank-badge">{{ sellerFees.indexOf(row) + 1 }}</span>
            {{ value }}
          </div>
        </template>
        <template #cell-estimatedCost="{ value }">
          <span class="amount-cell">₩{{ formatNumber(value) }}</span>
        </template>
        <template #cell-momGrowth="{ value }">
          <span v-if="Number.isFinite(value)" :class="value > 0 ? 'trend-up-text' : 'trend-down-text'">
            {{ value > 0 ? '▲' : '▼' }} {{ Math.abs(value).toFixed(1) }}%
          </span>
          <span v-else class="muted-text">-</span>
        </template>
        <template #cell-turnoverRate="{ value }">
          <span v-if="Number.isFinite(value)" class="turnover-rate">{{ value }}%</span>
          <span v-else class="muted-text">-</span>
        </template>
      </BaseTable>
      <div v-else class="seller-fee-chart-panel">
        <VueApexCharts
          v-if="sellerFeeChartRows.length"
          type="donut"
          height="340"
          :options="sellerFeeChartOptions"
          :series="sellerFeeChartSeries"
        />
        <div v-else class="seller-fee-empty">
          표시할 셀러 비용 데이터가 없습니다.
        </div>
        <div v-if="sellerFeeChartRows.length" class="seller-fee-chart-note">
          당월 매출액 기준 상위 {{ sellerFeeChartRows.length }}개 셀러의 3PL 비용 비중을 보여줍니다.
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
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

.muted-text {
  color: var(--t3);
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

/* ── 패널 ────────────────────────────────────── */
.panel {
  background: var(--surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  border-top: 3px solid var(--blue);
}

.panel--spacious {
  margin-bottom: var(--space-6);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
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

.panel-more--button {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

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

.panel-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.view-toggle {
  display: inline-flex;
  align-items: center;
  padding: 3px;
  background: #edf2ff;
  border-radius: var(--radius-full);
}

.view-toggle__button {
  min-width: 60px;
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--t2);
  font-family: var(--font-barlow);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.view-toggle__button--active {
  background: var(--surface);
  color: var(--blue);
  box-shadow: var(--shadow-sm);
}

/* chart 패딩 */
.panel > :deep(.apexcharts-canvas) {
  padding: 0 var(--space-2);
}

.seller-fee-chart-panel {
  padding: 0 var(--space-3) var(--space-4);
}

.seller-fee-chart-note {
  padding: 0 var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--t3);
}

.seller-fee-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  color: var(--t3);
  font-size: var(--font-size-sm);
}

/* ── 셀 커스텀 스타일 ─────────────────────────── */
.amount-cell {
  font-family: var(--font-barlow);
  font-weight: 600;
  color: var(--t1);
}

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

.trend-up-text {
  color: var(--red);
  font-family: var(--font-barlow);
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.trend-down-text {
  color: var(--blue);
  font-family: var(--font-barlow);
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.turnover-rate {
  font-family: var(--font-barlow);
  font-weight: 600;
  color: var(--green);
}

:deep(.seller-fee-tooltip) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--t1) 94%, transparent);
  color: #fff;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.4;
}

:deep(.seller-fee-tooltip strong) {
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 960px) {
  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .panel-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
