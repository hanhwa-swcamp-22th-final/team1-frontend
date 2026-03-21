<script setup>
/**
 * SellerRevenueView — 총괄관리자 셀러별 매출 현황
 *
 * 현재 API 범위에서 총괄관리자가 빠르게 판단할 수 있도록
 * KPI, 상위 셀러 분포, 검색/정렬, 운영 우선순위 테이블을 함께 제공한다.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { getSellerRevenue } from '@/api/member'
import { getCurrentRevenue } from '@/api/order'
import { formatNumber } from '@/utils/format'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'

const breadcrumb = [{ label: '셀러 관리' }, { label: '셀러별 매출' }]

const COLUMNS = [
  { key: 'rank', label: '순위', align: 'center', width: '72px' },
  { key: 'sellerName', label: '셀러' },
  { key: 'monthRevenue', label: '당월 매출', align: 'right', width: '150px' },
  { key: 'contribution', label: '매출 비중', align: 'right', width: '130px' },
  { key: 'totalOrders', label: '주문 건수', align: 'right', width: '110px' },
  { key: 'avgOrderValue', label: '평균 주문액', align: 'right', width: '140px' },
  { key: 'focus', label: '운영 포인트', align: 'center', width: '120px' },
]

const SEGMENTS = [
  { key: 'ALL', label: '전체' },
  { key: 'CORE', label: '주요 셀러' },
  { key: 'LONGTAIL', label: '소형 셀러' },
]

const SORT_OPTIONS = [
  { value: 'revenue_desc', label: '매출 높은 순' },
  { value: 'orders_desc', label: '주문 많은 순' },
  { value: 'ticket_desc', label: '평균 주문액 높은 순' },
  { value: 'contribution_desc', label: '기여율 높은 순' },
  { value: 'name_asc', label: '셀러명 순' },
]

const rows = ref([])
const isLoading = ref(false)
const totalRevenue = ref(0)
const searchQ = ref('')
const activeSegment = ref('ALL')
const sortKey = ref('revenue_desc')
const page = ref(1)
const PAGE_SIZE = 10

const revenueRankedRows = computed(() => {
  const baseRows = [...rows.value].sort((a, b) => b.monthRevenue - a.monthRevenue)
  return baseRows.map((row, index) => {
    const contribution = totalRevenue.value
      ? +((row.monthRevenue / totalRevenue.value) * 100).toFixed(1)
      : 0

    let focus = { label: '일반 관리', tone: 'neutral' }
    if (contribution >= 15) focus = { label: '집중 관리', tone: 'critical' }
    else if (contribution >= 8) focus = { label: '성장 관찰', tone: 'primary' }
    else if (contribution < 5) focus = { label: '소형 셀러', tone: 'muted' }

    return {
      ...row,
      rank: index + 1,
      contribution,
      focus,
      isCore: contribution >= 15,
      isLongTail: contribution < 5,
    }
  })
})

const activeSellerCount = computed(() => revenueRankedRows.value.filter(row => row.monthRevenue > 0).length)
const totalOrders = computed(() => revenueRankedRows.value.reduce((sum, row) => sum + row.totalOrders, 0))
const topSeller = computed(() => revenueRankedRows.value[0] ?? null)
const orderLeader = computed(() => {
  return revenueRankedRows.value.reduce((best, row) => (
    !best || row.totalOrders > best.totalOrders ? row : best
  ), null)
})
const ticketLeader = computed(() => {
  return revenueRankedRows.value.reduce((best, row) => (
    !best || row.avgOrderValue > best.avgOrderValue ? row : best
  ), null)
})
const top3Concentration = computed(() => {
  return +revenueRankedRows.value
    .slice(0, 3)
    .reduce((sum, row) => sum + row.contribution, 0)
    .toFixed(1)
})
const longTailRevenueShare = computed(() => {
  return +revenueRankedRows.value
    .filter(row => row.isLongTail)
    .reduce((sum, row) => sum + row.contribution, 0)
    .toFixed(1)
})
const topFiveRows = computed(() => revenueRankedRows.value.slice(0, 5))

const filteredRows = computed(() => {
  return revenueRankedRows.value.filter((row) => {
    const matchesSegment =
      activeSegment.value === 'ALL' ||
      (activeSegment.value === 'CORE' && row.isCore) ||
      (activeSegment.value === 'LONGTAIL' && row.isLongTail)

    if (!matchesSegment) return false

    if (!searchQ.value) return true

    const query = searchQ.value.toLowerCase()
    return (
      row.sellerName.toLowerCase().includes(query) ||
      row.sellerCode.toLowerCase().includes(query)
    )
  })
})

const sortedRows = computed(() => {
  const list = [...filteredRows.value]

  switch (sortKey.value) {
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

async function fetchAll() {
  isLoading.value = true
  try {
    const [revenueRes, currentRes] = await Promise.all([
      getSellerRevenue(),
      getCurrentRevenue(),
    ])
    totalRevenue.value = currentRes.data.data?.totalRevenue ?? 0
    rows.value = revenueRes.data.data ?? []
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
          <span class="stat-label">Top 3 집중도</span>
          <span class="stat-value">{{ top3Concentration }}<span class="stat-unit">%</span></span>
          <span class="stat-sub">상위 3개 셀러 매출 비중</span>
        </div>

        <div class="stat-card stat-card--green">
          <span class="stat-label">소형 셀러 비중</span>
          <span class="stat-value">{{ longTailRevenueShare }}<span class="stat-unit">%</span></span>
          <span class="stat-sub">기여율 5% 미만 셀러 합산</span>
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
              <span class="focus-label">주문 건수 1위</span>
              <strong class="focus-name">{{ orderLeader?.sellerName ?? '-' }}</strong>
              <span class="focus-value">{{ formatNumber(orderLeader?.totalOrders) }}건</span>
            </div>

            <div class="focus-item">
              <span class="focus-label">평균 주문액 1위</span>
              <strong class="focus-name">{{ ticketLeader?.sellerName ?? '-' }}</strong>
              <span class="focus-value">₩{{ formatNumber(ticketLeader?.avgOrderValue) }}</span>
            </div>

            <div class="focus-item focus-item--muted">
              <span class="focus-label">총 주문 건수</span>
              <strong class="focus-name">전체 셀러 합산</strong>
              <span class="focus-value">{{ formatNumber(totalOrders) }}건</span>
            </div>
          </div>
        </section>
      </div>

      <section class="table-panel">
        <div class="table-head">
          <div>
            <h3 class="panel-title">셀러별 매출 순위</h3>
            <p class="panel-sub">검색, 세그먼트, 정렬로 빠르게 우선순위를 확인합니다.</p>
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
          :columns="COLUMNS"
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
