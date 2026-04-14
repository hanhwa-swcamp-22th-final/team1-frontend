<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { formatDate, formatNumber } from '@/utils/format'
import { getCurrentRevenue, getMonthlyRevenue, getOutboundStats } from '@/api/order'
import { getAsnStats, getInventoryStats, getWarehouseStatus, getWhmMonthlyBillingResults } from '@/api/wms'
import { getSellerList, getSellerStats } from '@/api/member'
import { ROUTE_NAMES } from '@/constants'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import VueApexCharts from 'vue3-apexcharts'

const breadcrumb = [{ label: 'CONK' }, { label: '대시보드' }]

const router = useRouter()
const ui = useUiStore()
const summaryCards = ref([])
const warehouses = ref([])
const sellerFees = ref([])
const monthlyRevenue = ref([])
const sellerFeeViewMode = ref('chart')
const revenueChartType = ref('area') // 'area' | 'bar' | 'donut'
const billingMonth = ref(getPreviousBillingMonth())
const billingLoadFailed = ref(false)
const fetchedAt = ref(null)
const errorMsg = ref('')

function getPreviousBillingMonth(baseDate = new Date()) {
  const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function toAmount(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

function getSettledData(result, fallback) {
  return result?.status === 'fulfilled' ? (result.value.data?.data ?? fallback) : fallback
}

function getSellerStatsFallback(sellers = []) {
  const activeSellerCount = sellers.filter(seller => seller.status === 'ACTIVE' || seller.status === 'APPROVED').length
  return {
    activeSellerCount: activeSellerCount || sellers.length,
    newThisMonth: 0,
    trendType: 'neutral',
  }
}

function getRevenueFallback(revenueRows = []) {
  const totalRevenue = revenueRows.reduce((sum, row) => sum + toAmount(row.monthRevenue), 0)
  return {
    totalRevenue,
    trend: '-',
    trendLabel: '집계 데이터 준비 중',
    trendType: 'neutral',
  }
}

function getSellerMeta(seller) {
  return {
    sellerCode: seller.customerCode || seller.sellerInfo || seller.id,
    sellerName: seller.brandNameKo || seller.brandNameEn || seller.sellerInfo || seller.customerCode || seller.id,
  }
}

function buildMonthlyBillingRows(billingResults = [], sellers = []) {
  const sellerMetaById = new Map()
  for (const seller of sellers) {
    const meta = getSellerMeta(seller)
    if (seller.id) sellerMetaById.set(seller.id, meta)
    if (seller.tenantId) sellerMetaById.set(seller.tenantId, meta)
  }

  const aggregated = new Map()

  for (const result of billingResults) {
    const sellerId = result.sellerId
    const sellerMeta = sellerMetaById.get(sellerId) ?? {
      sellerCode: sellerId,
      sellerName: `셀러 ${sellerId}`,
    }

    if (!aggregated.has(sellerId)) {
      aggregated.set(sellerId, {
        sellerId,
        sellerCode: sellerMeta.sellerCode,
        sellerName: sellerMeta.sellerName,
        totalFee: 0,
        storageFee: 0,
        pickingFee: 0,
        packingFee: 0,
        pickCount: 0,
        packCount: 0,
        warehouseIds: new Set(),
      })
    }

    const item = aggregated.get(sellerId)
    item.totalFee += toAmount(result.totalFee)
    item.storageFee += toAmount(result.storageFee)
    item.pickingFee += toAmount(result.pickingFee)
    item.packingFee += toAmount(result.packingFee)
    item.pickCount += toAmount(result.pickCount)
    item.packCount += toAmount(result.packCount)

    if (result.warehouseId) {
      item.warehouseIds.add(result.warehouseId)
    }
  }

  return [...aggregated.values()]
    .map(item => ({
      ...item,
      warehouseCount: item.warehouseIds.size,
    }))
    .sort((a, b) => b.totalFee - a.totalFee)
}

// ── 테이블 컬럼 정의 ──────────────────────────────────────────────────────────

const SELLER_FEE_COLUMNS = [
  { key: 'sellerName', label: '셀러' },
  { key: 'totalFee', label: '월 정산 총액', align: 'right', width: '140px' },
  { key: 'storageFee', label: '보관비', align: 'right', width: '120px' },
  { key: 'pickingFee', label: '피킹비', align: 'right', width: '120px' },
  { key: 'packingFee', label: '패킹비', align: 'right', width: '120px' },
]

// ── 차트 옵션 ─────────────────────────────────────────────────────────────────

const sectionDate = computed(() =>
  fetchedAt.value ? formatDate(fetchedAt.value, 'datetime') + ' 실시간 기준' : ''
)

const revenueChartOptions = computed(() => {
  const data = monthlyRevenue.value
  const avg = data.length ? data.reduce((sum, item) => sum + item.revenue, 0) / data.length : 0

  if (revenueChartType.value === 'donut') {
    return {
      chart: { type: 'donut', fontFamily: 'Inter, sans-serif' },
      labels: data.map(item => item.label),
      colors: ['#4C74FF', '#34B469', '#F5A623', '#E84646', '#9747FF', '#14B8A6'],
      legend: { position: 'bottom', fontSize: '12px', fontFamily: 'Inter, sans-serif' },
      dataLabels: { enabled: true, formatter: value => value.toFixed(1) + '%' },
      plotOptions: { pie: { donut: { size: '65%' } } },
      tooltip: { y: { formatter: value => `₩${formatNumber(value)}` } },
    }
  }

  const momColors = data.map((item, index) =>
    index === 0 ? 'transparent' : item.revenue >= data[index - 1].revenue ? '#34B469' : '#E84646'
  )

  const base = {
    chart: { type: revenueChartType.value, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
    colors: ['#4C74FF'],
    dataLabels: {
      enabled: true,
      formatter: (value, { dataPointIndex: index }) => {
        if (index === 0) return ''
        const pct = ((data[index].revenue - data[index - 1].revenue) / data[index - 1].revenue * 100).toFixed(1)
        return (pct >= 0 ? '+' : '') + pct + '%'
      },
      style: { fontSize: '10px', fontWeight: 700, colors: momColors },
      background: { enabled: false },
      offsetY: -8,
    },
    xaxis: {
      categories: data.map(item => item.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#7B859A', fontSize: '11px' } },
    },
    yaxis: {
      labels: {
        style: { colors: '#7B859A', fontSize: '11px' },
        formatter: value => `₩${(value / 1_000_000).toFixed(0)}M`,
      },
    },
    grid: { borderColor: '#E4E8F0', strokeDashArray: 4 },
    annotations: {
      yaxis: [{
        y: avg,
        borderColor: '#F5A623',
        borderWidth: 1,
        strokeDashArray: 5,
        label: {
          text: '평균',
          position: 'right',
          style: { color: '#F5A623', background: 'transparent', fontSize: '10px', fontWeight: 600 },
        },
      }],
    },
    tooltip: {
      y: {
        formatter: (value, { dataPointIndex: index }) => {
          const formatted = `₩${formatNumber(value)}`
          if (index === 0) return formatted
          const pct = ((data[index].revenue - data[index - 1].revenue) / data[index - 1].revenue * 100).toFixed(1)
          return `${formatted}  (전월비 ${pct >= 0 ? '+' : ''}${pct}%)`
        },
      },
    },
  }

  if (revenueChartType.value === 'area') {
    return {
      ...base,
      stroke: { curve: 'smooth', width: 2.5 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100] } },
      markers: { size: 4, colors: ['#4C74FF'], strokeColors: '#fff', strokeWidth: 2, hover: { size: 6 } },
    }
  }

  return {
    ...base,
    stroke: { show: false },
    fill: { type: 'solid' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
  }
})

const revenueChartSeries = computed(() => (
  revenueChartType.value === 'donut'
    ? monthlyRevenue.value.map(item => item.revenue)
    : [{ name: '매출액', data: monthlyRevenue.value.map(item => item.revenue) }]
))

const sellerFeeChartRows = computed(() => [...sellerFees.value].slice(0, 5))

const sellerFeePanelSub = computed(() => (
  sellerFeeViewMode.value === 'chart'
    ? `${billingMonth.value} 정산월 청구액 상위 5개 셀러`
    : `${billingMonth.value} 정산월 청구 상세`
))

const sellerFeeEmptyMessage = computed(() => {
  if (billingLoadFailed.value) {
    return '월 정산 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
  }
  return `${billingMonth.value} 정산월에 표시할 셀러 정산 데이터가 없습니다.`
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
            label: `${billingMonth.value} 총 청구액`,
            fontSize: '12px',
            fontWeight: 600,
            color: '#7B859A',
            formatter: () => {
              const total = sellerFeeChartRows.value.reduce((sum, row) => sum + row.totalFee, 0)
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
      return `${seriesName}  ₩${formatNumber(row.totalFee)}`
    },
  },
  tooltip: {
    custom: ({ dataPointIndex }) => {
      const row = sellerFeeChartRows.value[dataPointIndex]
      if (!row) return ''

      return `
        <div class="seller-fee-tooltip">
          <strong>${row.sellerName}</strong>
          <span>월 정산 총액: ₩${formatNumber(row.totalFee)}</span>
          <span>보관비: ₩${formatNumber(row.storageFee)}</span>
          <span>피킹비: ₩${formatNumber(row.pickingFee)}</span>
          <span>패킹비: ₩${formatNumber(row.packingFee)}</span>
        </div>
      `
    },
  },
}))

const sellerFeeChartSeries = computed(() => sellerFeeChartRows.value.map(row => row.totalFee))

function moveToSellerRevenue() {
  router.push({ name: ROUTE_NAMES.MASTER_SELLER_REVENUE })
}

async function fetchDashboard() {
  errorMsg.value = ''
  ui.setLoading(true)

  try {
    const results = await Promise.allSettled([
      getOutboundStats(),
      getCurrentRevenue(),
      getMonthlyRevenue(),
      getAsnStats(),
      getInventoryStats(),
      getWarehouseStatus(),
      getSellerList(),
      getSellerStats(),
    ])

    const [
      outboundResult,
      currentRevenueResult,
      monthlyRevenueResult,
      asnResult,
      inventoryResult,
      warehouseResult,
      sellerListResult,
      sellerStatsResult,
    ] = results

    const sellerList = getSettledData(sellerListResult, [])
    const outbound = getSettledData(outboundResult, {
      pendingOutboundCount: 0,
      trend: '-',
      trendLabel: '데이터 없음',
      trendType: 'neutral',
    })
    const asn = getSettledData(asnResult, {
      unprocessedCount: 0,
      trend: '-',
      trendLabel: '데이터 없음',
      trendType: 'neutral',
    })
    const inventory = getSettledData(inventoryResult, {
      lowStockSkuCount: 0,
      trend: '-',
      trendLabel: '데이터 없음',
      trendType: 'neutral',
    })
    const sellerStats = getSettledData(sellerStatsResult, getSellerStatsFallback(sellerList))
    const warehousesData = getSettledData(warehouseResult, [])
    const currentRevenue = getSettledData(currentRevenueResult, null)
    const monthlyRevenueRows = getSettledData(monthlyRevenueResult, [])

    let billingRows = []
    billingLoadFailed.value = false

    try {
      const billingRes = await getWhmMonthlyBillingResults({ billingMonth: billingMonth.value })
      billingRows = buildMonthlyBillingRows(
        billingRes.data.data ?? [],
        sellerList,
      )
    } catch (billingErr) {
      billingLoadFailed.value = true
      console.error('[Dashboard] monthly billing fetch error:', billingErr)
    }

    const resolvedRevenue = currentRevenue ?? getRevenueFallback(billingRows.map(row => ({ monthRevenue: row.totalFee })))

    summaryCards.value = [
      { label: '당월 총 매출', value: `₩${formatNumber(resolvedRevenue.totalRevenue)}`, trend: resolvedRevenue.trend, trendLabel: resolvedRevenue.trendLabel, trendType: resolvedRevenue.trendType, valueColor: 'blue' },
      { label: '전체 출고 예정 건수', value: formatNumber(outbound.pendingOutboundCount), trend: outbound.trend, trendLabel: outbound.trendLabel, trendType: outbound.trendType },
      { label: '미처리 ASN (검수 대기)', value: String(asn.unprocessedCount), trend: asn.trend, trendLabel: asn.trendLabel, trendType: asn.trendType, valueColor: 'amber' },
      { label: '재고 부족 경고 SKU', value: String(inventory.lowStockSkuCount), trend: inventory.trend, trendLabel: inventory.trendLabel, trendType: inventory.trendType, valueColor: 'red' },
      { label: '활성 셀러 업체 수', value: String(sellerStats.activeSellerCount), trend: `${sellerStats.newThisMonth}개사`, trendLabel: '이번 달 신규', trendType: sellerStats.trendType },
    ]

    warehouses.value = warehousesData
    monthlyRevenue.value = monthlyRevenueRows
    sellerFees.value = billingRows
    fetchedAt.value = new Date()
  } finally {
    ui.setLoading(false)
  }
}

onMounted(fetchDashboard)

watch(billingMonth, (nextMonth, prevMonth) => {
  if (nextMonth && nextMonth !== prevMonth) {
    fetchDashboard()
  }
})
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
      <div v-else class="seller-fee-empty">
        월별 매출 추이 데이터가 아직 준비되지 않았습니다.
      </div>
    </div>

    <!-- ④ 셀러별 월 정산 현황 (full-width) -->
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title-wrap">
          <span class="panel-title">셀러별 월 정산 현황</span>
          <span class="panel-sub">{{ sellerFeePanelSub }}</span>
        </div>
        <div class="panel-actions">
          <label class="month-filter">
            <span class="month-filter__label">정산월</span>
            <input
              v-model="billingMonth"
              class="month-filter__input"
              type="month"
            />
          </label>
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
            <div class="seller-name-meta">
              <span>{{ value }}</span>
              <span class="seller-code-sub">{{ row.sellerCode }}</span>
            </div>
          </div>
        </template>
        <template #cell-totalFee="{ value }">
          <span class="amount-cell amount-cell--strong">₩{{ formatNumber(value) }}</span>
        </template>
        <template #cell-storageFee="{ value }">
          <span class="amount-cell">₩{{ formatNumber(value) }}</span>
        </template>
        <template #cell-pickingFee="{ value }">
          <span class="amount-cell">₩{{ formatNumber(value) }}</span>
        </template>
        <template #cell-packingFee="{ value }">
          <span class="amount-cell">₩{{ formatNumber(value) }}</span>
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
          {{ sellerFeeEmptyMessage }}
        </div>
        <div v-if="sellerFeeChartRows.length" class="seller-fee-chart-note">
          {{ billingMonth }} 정산월 기준 청구액 상위 {{ sellerFeeChartRows.length }}개 셀러의 비용 비중을 보여줍니다.
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

.month-filter {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.month-filter__label {
  font-size: var(--font-size-xs);
  color: var(--t3);
  font-weight: 600;
  white-space: nowrap;
}

.month-filter__input {
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
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

.seller-name-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.seller-code-sub {
  color: var(--t3);
  font-size: 11px;
  font-family: var(--font-mono);
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

.amount-cell--strong {
  color: var(--blue);
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
