<script setup>
/**
 * SellerRevenueView — 총괄관리자 셀러별 매출 현황
 *
 * 레이아웃:
 *   상단 stat cards (당월 총 매출 / 셀러 수)
 *   BaseTable (전체 셀러별 매출 + 기여율)
 *
 * 데이터: /members/sellers/revenue + /orders/revenue/current (기여율 계산용)
 */
import { ref, computed, onMounted } from 'vue'
import { getSellerRevenue } from '@/api/member'
import { getCurrentRevenue } from '@/api/order'
import { formatNumber } from '@/utils/format'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'

const breadcrumb = [{ label: '셀러 관리' }, { label: '셀러별 매출' }]

const COLUMNS = [
  { key: 'sellerCode',    label: 'Code',       width: '120px' },
  { key: 'sellerName',    label: '셀러명' },
  { key: 'totalOrders',   label: '주문 건수',  align: 'right',  width: '100px' },
  { key: 'avgOrderValue', label: '평균 주문액', align: 'right', width: '130px' },
  { key: 'monthRevenue',  label: '당월 매출',  align: 'right',  width: '140px' },
  { key: 'contribution',  label: '기여율',     align: 'right',  width: '85px'  },
]

const rows      = ref([])
const isLoading = ref(false)
const totalRevenue = ref(0)
const page      = ref(1)
const PAGE_SIZE = 10

const paginatedRows = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return rows.value.slice(start, start + PAGE_SIZE)
})

const pagination = computed(() => ({
  page: page.value,
  pageSize: PAGE_SIZE,
  total: rows.value.length,
}))

const sellerCount = computed(() => rows.value.length)

async function fetchAll() {
  isLoading.value = true
  try {
    const [revenueRes, currentRes] = await Promise.all([
      getSellerRevenue(),
      getCurrentRevenue(),
    ])
    totalRevenue.value = currentRes.data.data?.totalRevenue ?? 0
    rows.value = revenueRes.data.data.map(row => ({
      ...row,
      contribution: totalRevenue.value
        ? +((row.monthRevenue / totalRevenue.value) * 100).toFixed(1)
        : 0,
    }))
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

      <!-- ── 요약 카드 ─────────────────────────────────────────────────────── -->
      <div class="stat-grid">
        <div class="stat-card">
          <span class="stat-label">당월 총 매출</span>
          <span class="stat-value">₩{{ formatNumber(totalRevenue) }}</span>
        </div>
        <div class="stat-card stat-card--blue">
          <span class="stat-label">등록 셀러 수</span>
          <span class="stat-value">{{ sellerCount }}<span class="stat-unit">명</span></span>
        </div>
      </div>

      <!-- ── 테이블 ─────────────────────────────────────────────────────────── -->
      <BaseTable
        :columns="COLUMNS"
        :rows="paginatedRows"
        :loading="isLoading"
        :pagination="pagination"
        @page-change="page = $event"
      >
        <template #cell-monthRevenue="{ value }">
          ₩{{ formatNumber(value) }}
        </template>

        <template #cell-avgOrderValue="{ value }">
          ₩{{ formatNumber(value) }}
        </template>

        <template #cell-contribution="{ value }">
          <span class="contribution-pct">{{ value }}%</span>
        </template>
      </BaseTable>

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

/* ── 요약 카드 ───────────────────────────────────────────────── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  border-top: 3px solid var(--blue);
}
.stat-card--blue { border-top-color: var(--blue); }

.stat-label {
  font-family: var(--font-barlow);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-family: var(--font-condensed);
  font-size: 28px;
  font-weight: 700;
  color: var(--t1);
  line-height: 1;
}

.stat-unit {
  font-size: var(--font-size-sm);
  font-family: var(--font-barlow);
  color: var(--t3);
  margin-left: 3px;
}

/* ── 기여율 ─────────────────────────────────────────────────── */
.contribution-pct {
  font-family: var(--font-barlow);
  font-size: var(--font-size-xs);
  color: var(--t3);
}
</style>
