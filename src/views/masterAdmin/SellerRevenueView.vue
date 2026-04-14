<script setup>
/**
 * SellerRevenueView — 총괄관리자 셀러별 매출 현황
 *
 * 당월 매출 지표에 더해, 선택한 정산월의 3PL 월 정산 결과를 함께 보여준다.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { getSellerList } from '@/api/member'
import { getCurrentRevenue, getSellerRevenue } from '@/api/order'
import { getWhmMonthlyBillingResults } from '@/api/wms'
import { formatNumber } from '@/utils/format'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'

const breadcrumb = [{ label: '셀러 관리' }, { label: '셀러별 매출' }]

const SEGMENTS = [
  { key: 'ALL', label: '전체' },
  { key: 'CORE', label: '주요 셀러' },
  { key: 'LONGTAIL', label: '소형 셀러' },
]

const SORT_OPTIONS = [
  { value: 'revenue_desc', label: '매출 높은 순' },
  { value: 'billing_desc', label: '정산 비용 높은 순' },
  { value: 'orders_desc', label: '주문 많은 순' },
  { value: 'ticket_desc', label: '평균 주문액 높은 순' },
  { value: 'contribution_desc', label: '기여율 높은 순' },
  { value: 'name_asc', label: '셀러명 순' },
]

const PAGE_SIZE = 10

const revenueRows = ref([])
const billingRows = ref([])
const isLoading = ref(false)
const totalRevenue = ref(0)
const billingLoadFailed = ref(false)
const billingMonth = ref(getPreviousBillingMonth())
const searchQ = ref('')
const activeSegment = ref('ALL')
const sortKey = ref('revenue_desc')
const page = ref(1)

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

function getSellerMeta(seller) {
  return {
    sellerId: seller.id,
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
      })
    }

    const item = aggregated.get(sellerId)
    item.totalFee += toAmount(result.totalFee)
    item.storageFee += toAmount(result.storageFee)
    item.pickingFee += toAmount(result.pickingFee)
    item.packingFee += toAmount(result.packingFee)
  }

  return [...aggregated.values()].sort((a, b) => b.totalFee - a.totalFee)
}

const columns = computed(() => [
  { key: 'rank', label: '순위', align: 'center', width: '72px' },
  { key: 'sellerName', label: '셀러' },
  { key: 'monthRevenue', label: '당월 매출', align: 'right', width: '150px' },
  { key: 'billingTotalFee', label: `${billingMonth.value} 정산 비용`, align: 'right', width: '160px' },
  { key: 'billingBreakdown', label: '정산 구성', width: '200px' },
  { key: 'contribution', label: '매출 비중', align: 'right', width: '120px' },
  { key: 'totalOrders', label: '주문 건수', align: 'right', width: '110px' },
  { key: 'avgOrderValue', label: '평균 주문액', align: 'right', width: '140px' },
  { key: 'focus', label: '운영 포인트', align: 'center', width: '120px' },
])

const mergedRows = computed(() => {
  const billingByCode = new Map(
    billingRows.value.map(row => [row.sellerCode, row])
  )

  const merged = revenueRows.value.map(row => {
    const billing = billingByCode.get(row.sellerCode)
    return {
      sellerCode: row.sellerCode,
      sellerName: row.sellerName,
      monthRevenue: toAmount(row.monthRevenue),
      totalOrders: toAmount(row.totalOrders),
      avgOrderValue: toAmount(row.avgOrderValue),
      billingTotalFee: billing?.totalFee ?? 0,
      storageFee: billing?.storageFee ?? 0,
      pickingFee: billing?.pickingFee ?? 0,
      packingFee: billing?.packingFee ?? 0,
    }
  })

  const revenueCodes = new Set(revenueRows.value.map(row => row.sellerCode))
  for (const billing of billingRows.value) {
    if (!revenueCodes.has(billing.sellerCode)) {
      merged.push({
        sellerCode: billing.sellerCode,
        sellerName: billing.sellerName,
        monthRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        billingTotalFee: billing.totalFee,
        storageFee: billing.storageFee,
        pickingFee: billing.pickingFee,
        packingFee: billing.packingFee,
      })
    }
  }

  return merged
})

const revenueRankedRows = computed(() => {
  const baseRows = [...mergedRows.value].sort((a, b) => b.monthRevenue - a.monthRevenue)

  return baseRows.map((row, index) => {
    const contribution = totalRevenue.value
      ? +((row.monthRevenue / totalRevenue.value) * 100).toFixed(1)
      : 0

    let focus = { label: '일반 관리', tone: 'neutral' }
    if (row.monthRevenue === 0 && row.billingTotalFee > 0) focus = { label: '정산 확인', tone: 'critical' }
    else if (contribution >= 15) focus = { label: '집중 관리', tone: 'critical' }
    else if (row.billingTotalFee > 0) focus = { label: '청구 점검', tone: 'primary' }
    else if (contribution < 5) focus = { label: '소형 셀러', tone: 'muted' }

    return {
      ...row,
      rank: index + 1,
      contribution,
      focus,
      billingBreakdown: `보관 ₩${formatNumber(row.storageFee)} / 피킹 ₩${formatNumber(row.pickingFee)} / 패킹 ₩${formatNumber(row.packingFee)}`,
      isCore: contribution >= 15,
      isLongTail: contribution < 5,
    }
  })
})

const activeSellerCount = computed(() => revenueRankedRows.value.filter(row => row.monthRevenue > 0).length)
const billedSellerCount = computed(() => revenueRankedRows.value.filter(row => row.billingTotalFee > 0).length)
const totalBillingFee = computed(() => revenueRankedRows.value.reduce((sum, row) => sum + row.billingTotalFee, 0))
const topSeller = computed(() => revenueRankedRows.value[0] ?? null)
const billingLeader = computed(() => (
  revenueRankedRows.value.reduce((best, row) => (
    !best || row.billingTotalFee > best.billingTotalFee ? row : best
  ), null)
))
const orderLeader = computed(() => (
  revenueRankedRows.value.reduce((best, row) => (
    !best || row.totalOrders > best.totalOrders ? row : best
  ), null)
))
const ticketLeader = computed(() => (
  revenueRankedRows.value.reduce((best, row) => (
    !best || row.avgOrderValue > best.avgOrderValue ? row : best
  ), null)
))
const topFiveRows = computed(() => revenueRankedRows.value.slice(0, 5))

const filteredRows = computed(() => {
  return revenueRankedRows.value.filter(row => {
    const matchesSegment =
      activeSegment.value === 'ALL' ||
      (activeSegment.value === 'CORE' && row.isCore) ||
      (activeSegment.value === 'LONGTAIL' && row.isLongTail)

    if (!matchesSegment) return false

    if (!searchQ.value) return true

    const query = searchQ.value.toLowerCase()
    return row.sellerName.toLowerCase().includes(query) || row.sellerCode.toLowerCase().includes(query)
  })
})

const sortedRows = computed(() => {
  const list = [...filteredRows.value]

  switch (sortKey.value) {
    case 'billing_desc':
      return list.sort((a, b) => b.billingTotalFee - a.billingTotalFee)
    case 'orders_desc':
      return list.sort((a, b) => b.totalOrders - a.totalOrders)
    case 'ticket_desc':
      return list.sort((a, b) => b.avgOrderValue - a.avgOrderValue)
    case 'contribution_desc':
      return list.sort((a, b) => b.contribution - a.contribution)
    case 'name_asc':
      return list.sort((a, b) => a.sellerName.localeCompare(b.sellerName))
    case 'revenue_desc':
    default:
      return list.sort((a, b) => b.monthRevenue - a.monthRevenue)
  }
})

const paginatedRows = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return sortedRows.value.slice(start, start + PAGE_SIZE)
})

const pagination = computed(() => ({
  page: page.value,
  pageSize: PAGE_SIZE,
  total: sortedRows.value.length,
}))

watch([searchQ, activeSegment, sortKey], () => {
  page.value = 1
})

watch(billingMonth, (nextMonth, prevMonth) => {
  if (nextMonth && nextMonth !== prevMonth) {
    fetchAll()
  }
})

async function fetchAll() {
  isLoading.value = true
  billingLoadFailed.value = false

  try {
    const [revenueResult, currentRevenueResult, sellerListResult] = await Promise.allSettled([
      getSellerRevenue(),
      getCurrentRevenue(),
      getSellerList(),
    ])

    const sellerList = getSettledData(sellerListResult, [])
    const sellerMetaById = new Map(
      sellerList.map(seller => {
        const meta = getSellerMeta(seller)
        return [meta.sellerId, meta]
      })
    )

    revenueRows.value = getSettledData(revenueResult, []).map(row => {
      const meta = sellerMetaById.get(row.sellerId) ?? {
        sellerCode: row.sellerId,
        sellerName: `셀러 ${row.sellerId}`,
      }

      return {
        sellerCode: meta.sellerCode,
        sellerName: meta.sellerName,
        monthRevenue: row.monthRevenue,
        totalOrders: row.totalOrders,
        avgOrderValue: row.avgOrderValue,
      }
    })
    const currentRevenue = getSettledData(currentRevenueResult, null)

    totalRevenue.value = currentRevenue?.totalRevenue
      ?? revenueRows.value.reduce((sum, row) => sum + toAmount(row.monthRevenue), 0)

    try {
      const billingRes = await getWhmMonthlyBillingResults({ billingMonth: billingMonth.value })
      billingRows.value = buildMonthlyBillingRows(
        billingRes.data.data ?? [],
        sellerList,
      )
    } catch (billingErr) {
      billingLoadFailed.value = true
      billingRows.value = []
      console.error('[SellerRevenueView] monthly billing fetch error:', billingErr)
    }
  } catch (e) {
    console.error('[SellerRevenueView] fetch error:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchAll)
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb">
    <div class="revenue-page">
      <div class="stat-grid">
        <div class="stat-card stat-card--revenue">
          <span class="stat-label">당월 총 매출</span>
          <span class="stat-value">₩{{ formatNumber(totalRevenue) }}</span>
          <span class="stat-sub">전체 셀러 기준 집계</span>
        </div>

        <div class="stat-card stat-card--blue">
          <span class="stat-label">활성 매출 셀러</span>
          <span class="stat-value">{{ activeSellerCount }}<span class="stat-unit">개사</span></span>
          <span class="stat-sub">매출 발생 셀러 / 전체 {{ revenueRankedRows.length }}개사</span>
        </div>

        <div class="stat-card stat-card--amber">
          <span class="stat-label">{{ billingMonth }} 정산 총액</span>
          <span class="stat-value">₩{{ formatNumber(totalBillingFee) }}</span>
          <span class="stat-sub">선택한 정산월 기준 3PL 청구 합계</span>
        </div>

        <div class="stat-card stat-card--green">
          <span class="stat-label">{{ billingMonth }} 정산 반영 셀러</span>
          <span class="stat-value">{{ billedSellerCount }}<span class="stat-unit">개사</span></span>
          <span class="stat-sub">
            {{ billingLoadFailed ? '월 정산 데이터를 불러오지 못했습니다.' : '선택한 정산월에 청구 데이터가 있는 셀러 수' }}
          </span>
        </div>
      </div>

      <div class="insight-grid">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h3 class="panel-title">상위 셀러 매출 믹스</h3>
              <p class="panel-sub">당월 매출 기준 Top 5</p>
            </div>
          </div>

          <div class="mix-list">
            <div v-for="row in topFiveRows" :key="row.sellerCode" class="mix-row">
              <div class="mix-meta">
                <div class="mix-name-wrap">
                  <span class="mix-rank">#{{ row.rank }}</span>
                  <div>
                    <div class="mix-name">{{ row.sellerName }}</div>
                    <div class="mix-code">{{ row.sellerCode }}</div>
                  </div>
                </div>
                <div class="mix-value-wrap">
                  <span class="mix-value">₩{{ formatNumber(row.monthRevenue) }}</span>
                  <span class="mix-share">{{ row.contribution }}%</span>
                </div>
              </div>

              <div class="mix-bar">
                <div class="mix-fill" :style="{ width: `${row.contribution}%` }" />
              </div>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h3 class="panel-title">관리 포인트</h3>
              <p class="panel-sub">총괄관리자용 핵심 신호</p>
            </div>
          </div>

          <div class="focus-list">
            <div class="focus-item">
              <span class="focus-label">매출 1위 셀러</span>
              <strong class="focus-name">{{ topSeller?.sellerName ?? '-' }}</strong>
              <span class="focus-value">₩{{ formatNumber(topSeller?.monthRevenue) }}</span>
            </div>

            <div class="focus-item">
              <span class="focus-label">{{ billingMonth }} 정산 비용 1위</span>
              <strong class="focus-name">{{ billingLeader?.sellerName ?? '-' }}</strong>
              <span class="focus-value">₩{{ formatNumber(billingLeader?.billingTotalFee) }}</span>
            </div>

            <div class="focus-item">
              <span class="focus-label">주문 건수 1위</span>
              <strong class="focus-name">{{ orderLeader?.sellerName ?? '-' }}</strong>
              <span class="focus-value">{{ formatNumber(orderLeader?.totalOrders) }}건</span>
            </div>

            <div class="focus-item focus-item--muted">
              <span class="focus-label">평균 주문액 1위</span>
              <strong class="focus-name">{{ ticketLeader?.sellerName ?? '-' }}</strong>
              <span class="focus-value">₩{{ formatNumber(ticketLeader?.avgOrderValue) }}</span>
            </div>
          </div>
        </section>
      </div>

      <section class="table-panel">
        <div class="table-head">
          <div>
            <h3 class="panel-title">셀러별 매출 순위</h3>
            <p class="panel-sub">당월 매출과 {{ billingMonth }} 정산 비용을 함께 비교합니다.</p>
          </div>
        </div>

        <div class="toolbar">
          <div class="segment-tabs">
            <button
              v-for="segment in SEGMENTS"
              :key="segment.key"
              type="button"
              class="segment-tab"
              :class="{ active: activeSegment === segment.key }"
              @click="activeSegment = segment.key"
            >
              {{ segment.label }}
            </button>
          </div>

          <div class="toolbar-right">
            <label class="month-filter">
              <span class="month-filter__label">정산월</span>
              <input
                v-model="billingMonth"
                class="month-filter__input"
                type="month"
              />
            </label>

            <div class="search-box">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#B0B8CC" stroke-width="1.6">
                <circle cx="6" cy="6" r="4.5" />
                <path d="M10 10l2.5 2.5" stroke-linecap="round" />
              </svg>
              <input
                v-model="searchQ"
                class="search-input"
                type="text"
                placeholder="셀러명 또는 코드 검색"
              />
            </div>

            <select v-model="sortKey" class="select-filter">
              <option v-for="option in SORT_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <BaseTable
          :columns="columns"
          :rows="paginatedRows"
          :loading="isLoading"
          :pagination="pagination"
          row-key="sellerCode"
          @page-change="page = $event"
        >
          <template #cell-rank="{ row }">
            <span class="rank-pill">#{{ row.rank }}</span>
          </template>

          <template #cell-sellerName="{ row }">
            <div class="seller-cell">
              <div class="seller-name">{{ row.sellerName }}</div>
              <div class="seller-code">{{ row.sellerCode }}</div>
            </div>
          </template>

          <template #cell-monthRevenue="{ value }">
            <span class="metric-strong">₩{{ formatNumber(value) }}</span>
          </template>

          <template #cell-billingTotalFee="{ value }">
            <span class="metric-strong metric-strong--blue">₩{{ formatNumber(value) }}</span>
          </template>

          <template #cell-billingBreakdown="{ row }">
            <div class="billing-cell">
              <span>보관 ₩{{ formatNumber(row.storageFee) }}</span>
              <span>피킹 ₩{{ formatNumber(row.pickingFee) }}</span>
              <span>패킹 ₩{{ formatNumber(row.packingFee) }}</span>
            </div>
          </template>

          <template #cell-contribution="{ value }">
            <div class="contribution-cell">
              <div class="contribution-bar">
                <div class="contribution-fill" :style="{ width: `${Math.min(value, 100)}%` }" />
              </div>
              <span class="contribution-value">{{ value }}%</span>
            </div>
          </template>

          <template #cell-totalOrders="{ value }">
            {{ formatNumber(value) }}건
          </template>

          <template #cell-avgOrderValue="{ value }">
            ₩{{ formatNumber(value) }}
          </template>

          <template #cell-focus="{ value }">
            <span class="focus-chip" :class="`focus-chip--${value.tone}`">{{ value.label }}</span>
          </template>
        </BaseTable>
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
.revenue-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-6);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.stat-card {
  background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,247,252,0.94) 100%);
  border: 1px solid var(--border);
  border-top: 3px solid var(--blue);
  border-radius: var(--radius-md);
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  box-shadow: var(--shadow-sm);
}

.stat-card--blue { border-top-color: var(--blue); }
.stat-card--amber { border-top-color: var(--amber); }
.stat-card--green { border-top-color: var(--green); }
.stat-card--revenue { border-top-color: var(--gold); }

.stat-label {
  font-family: var(--font-barlow);
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.stat-value {
  font-family: var(--font-condensed);
  font-size: 32px;
  font-weight: 700;
  color: var(--t1);
  line-height: 1;
}

.stat-unit {
  margin-left: 4px;
  font-size: var(--font-size-sm);
  font-family: var(--font-barlow);
  color: var(--t3);
}

.stat-sub {
  color: var(--t3);
  font-size: var(--font-size-xs);
}

.insight-grid {
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: var(--space-5);
}

.panel,
.table-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.panel-header,
.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6) var(--space-3);
}

.panel-title {
  margin: 0;
  font-family: var(--font-condensed);
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--t1);
}

.panel-sub {
  margin-top: 4px;
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.mix-list,
.focus-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0 var(--space-6) var(--space-6);
}

.mix-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.mix-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.mix-name-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.mix-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: var(--blue-pale);
  color: var(--blue);
  font-family: var(--font-barlow);
  font-size: var(--font-size-xs);
  font-weight: 700;
  flex-shrink: 0;
}

.mix-name {
  color: var(--t1);
  font-weight: 600;
}

.mix-code {
  color: var(--t3);
  font-size: var(--font-size-xs);
  font-family: var(--font-mono);
}

.mix-value-wrap {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  white-space: nowrap;
}

.mix-value {
  color: var(--t1);
  font-weight: 700;
}

.mix-share {
  color: var(--blue);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.mix-bar,
.contribution-bar {
  height: 8px;
  background: var(--surface-2);
  border-radius: 999px;
  overflow: hidden;
}

.mix-fill,
.contribution-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--blue) 0%, #7aa2ff 100%);
  border-radius: 999px;
}

.focus-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-2);
}

.focus-item--muted {
  background: linear-gradient(180deg, var(--surface-2) 0%, rgba(244,247,252,0.9) 100%);
}

.focus-label {
  color: var(--t3);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
}

.focus-name {
  color: var(--t1);
  font-size: var(--font-size-lg);
}

.focus-value {
  color: var(--blue);
  font-weight: 700;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 0 var(--space-6) var(--space-4);
  flex-wrap: wrap;
}

.segment-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.segment-tab {
  height: 34px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--t2);
  font-family: var(--font-barlow);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--ease-fast);
}

.segment-tab.active {
  background: var(--blue-pale);
  border-color: var(--blue);
  color: var(--blue);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.month-filter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.month-filter__label {
  color: var(--t3);
  font-size: var(--font-size-xs);
  font-weight: 700;
  white-space: nowrap;
}

.month-filter__input {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 260px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
}

.search-box:focus-within {
  border-color: var(--blue);
}

.search-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--t1);
  font-size: var(--font-size-sm);
}

.select-filter {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.seller-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.seller-name {
  color: var(--t1);
  font-weight: 600;
}

.seller-code {
  color: var(--t3);
  font-size: var(--font-size-xs);
  font-family: var(--font-mono);
}

.rank-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--t2);
  font-family: var(--font-barlow);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.metric-strong {
  font-weight: 700;
  color: var(--t1);
}

.metric-strong--blue {
  color: var(--blue);
}

.billing-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  color: var(--t2);
  font-size: var(--font-size-xs);
  line-height: 1.4;
}

.contribution-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.contribution-bar {
  width: 84px;
}

.contribution-value {
  min-width: 42px;
  color: var(--blue);
  font-weight: 700;
  font-size: var(--font-size-xs);
}

.focus-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-family: var(--font-barlow);
  font-size: var(--font-size-xs);
  font-weight: 700;
  white-space: nowrap;
}

.focus-chip--critical {
  background: var(--amber-pale);
  color: #b45309;
}

.focus-chip--primary {
  background: var(--blue-pale);
  color: var(--blue);
}

.focus-chip--muted {
  background: var(--surface-2);
  color: var(--t3);
}

.focus-chip--neutral {
  background: var(--green-pale);
  color: var(--green);
}

@media (max-width: 1200px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .insight-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .revenue-page {
    padding: var(--space-4);
  }

  .stat-grid {
    grid-template-columns: 1fr;
  }

  .search-box {
    width: 100%;
  }

  .toolbar-right {
    width: 100%;
  }

  .month-filter {
    width: 100%;
    justify-content: space-between;
  }

  .month-filter__input {
    width: 100%;
  }

  .select-filter {
    width: 100%;
  }

  .mix-meta,
  .toolbar {
    align-items: flex-start;
  }

  .mix-meta {
    flex-direction: column;
  }

  .mix-value-wrap {
    width: 100%;
    justify-content: space-between;
  }

  .contribution-cell {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
